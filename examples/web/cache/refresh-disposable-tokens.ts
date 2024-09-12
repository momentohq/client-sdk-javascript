import {
  AuthClient,
  CredentialProvider,
  DisposableTokenScope,
  ExpiresAt,
  ExpiresIn,
  GenerateDisposableTokenResponse,
  TopicClient,
  TopicItem,
  TopicPermission,
  TopicPublishResponse,
  TopicRole,
  TopicSubscribe,
  TopicSubscribeResponse,
} from '@gomomento/sdk-web';
import {initJSDom} from './utils/jsdom';

function getRefreshAfterMs(expiresAt: ExpiresAt, refreshBefore: number): number {
  const refreshingIn = expiresAt.epoch() * 1000 - Date.now() - refreshBefore;
  console.log(`Refreshing in ${refreshingIn} ms`);
  return refreshingIn;
}

async function tokenVendingMachine(): Promise<{token: string; expiresAt: ExpiresAt}> {
  const authClient = new AuthClient({});
  const topic1Perms: TopicPermission = {
    role: TopicRole.PublishSubscribe,
    cache: 'my-cache',
    topic: 'topic-1',
  };
  const topic2Perms: TopicPermission = {
    role: TopicRole.PublishSubscribe,
    cache: 'my-cache',
    topic: 'topic-2',
  };
  const permsScope: DisposableTokenScope = {
    permissions: [topic1Perms, topic2Perms],
  };
  const tokenResponse = await authClient.generateDisposableToken(permsScope, ExpiresIn.seconds(30));
  if (tokenResponse.type === GenerateDisposableTokenResponse.Error) {
    throw new Error(`Failed to generate a disposable token: ${tokenResponse.toString()}`);
  }
  const humanReadableTime = new Date(tokenResponse.expiresAt.epoch() * 1000).toISOString();
  console.log(`Generated a disposable token that will expire at ${humanReadableTime}`);
  const disposableToken = {
    token: tokenResponse.authToken,
    expiresAt: tokenResponse.expiresAt,
  };
  return disposableToken;
}

interface TokenRefreshingTopicClientProps {
  refreshBeforeExpiryMs: number;
  getDisposableToken: () => Promise<{token: string; expiresAt: ExpiresAt}>;
}

class TokenRefreshingTopicClient {
  topicClient: TopicClient | undefined;
  refreshBeforeExpiryMs: number;
  getDisposableToken: () => Promise<{token: string; expiresAt: ExpiresAt}>;
  activeSubscriptions: Record<
    string,
    {
      cacheName: string;
      topicName: string;
      lastSequenceNumber: number;
      unsubscribe: () => void;
      onItem: (item: TopicItem) => void;
      onError: (error: TopicSubscribe.Error) => void;
    }
  > = {};

  constructor(props: TokenRefreshingTopicClientProps) {
    this.refreshBeforeExpiryMs = props.refreshBeforeExpiryMs;
    this.getDisposableToken = props.getDisposableToken;
  }

  private async initializeTopicClient() {
    const disposableToken = await this.getDisposableToken();
    this.topicClient = new TopicClient({
      credentialProvider: CredentialProvider.fromString(disposableToken.token),
    });
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      await this.refreshToken();
    }, getRefreshAfterMs(disposableToken.expiresAt, this.refreshBeforeExpiryMs));
    console.log('Initialized topic client and set first timeout');
  }

  private async refreshToken() {
    console.log('Disposable token expiring soon, refreshing topic client with new token');
    const disposableToken = await this.getDisposableToken();
    const newTopicClient = new TopicClient({
      credentialProvider: CredentialProvider.fromString(disposableToken.token),
    });
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      await this.refreshToken();
    }, getRefreshAfterMs(disposableToken.expiresAt, this.refreshBeforeExpiryMs));

    // for each active subscription, unsubscribe from the old topic client and subscribe to the new one
    for (const key in this.activeSubscriptions) {
      const value = this.activeSubscriptions[key];
      const newSubscription = await newTopicClient.subscribe(value.cacheName, value.topicName, {
        onItem: value.onItem,
        onError: value.onError,
      });
      value.unsubscribe();

      if (newSubscription.type === TopicSubscribeResponse.Error) {
        console.error(`Error subscribing to topic: ${newSubscription.toString()}`);
      } else {
        this.activeSubscriptions[key].unsubscribe = () => {
          newSubscription.unsubscribe();
        };
      }
    }

    delete this.topicClient;
    this.topicClient = newTopicClient;
  }

  async publish(cacheName: string, topicName: string, message: string) {
    if (!this.topicClient) {
      console.log('Initializing topic client from subscribe');
      await this.initializeTopicClient();
    }
    const resp = await this.topicClient?.publish(cacheName, topicName, message);
    if (resp?.type === TopicPublishResponse.Error) {
      console.error(`Error publishing message: ${resp.toString()}`);
    }
  }

  async subscribe(
    cacheName: string,
    topicName: string,
    options: {
      onItem: (item: TopicItem) => void;
      onError: (error: TopicSubscribe.Error) => void;
    }
  ) {
    console.log(`Subscribe function called for ${cacheName}:${topicName}`);

    if (!this.topicClient) {
      console.log('Initializing topic client from subscribe');
      await this.initializeTopicClient();
    }

    const wrappedOnItem = (item: TopicItem) => {
      const currentSubscription = this.activeSubscriptions[`${cacheName}:${topicName}`];
      // pass through to user-provided onItem only if message hasn't been processed before
      if (item.sequenceNumber() > currentSubscription.lastSequenceNumber) {
        options.onItem(item);
        currentSubscription.lastSequenceNumber = item.sequenceNumber();
      }
    };

    if (!this.topicClient) {
      throw new Error('Topic client is not initialized');
    }
    const resp = await this.topicClient.subscribe(cacheName, topicName, {
      onItem: wrappedOnItem,
      onError: options.onError,
    });

    if (resp.type === TopicSubscribeResponse.Error) {
      console.error(`Error subscribing to topic: ${resp.toString()}`);
    } else {
      console.log(`Subscribed to ${cacheName}:${topicName}`);
      const key = `${cacheName}:${topicName}`;

      // if key already exists, update the existing subscription
      // otherwise make new record
      if (key in this.activeSubscriptions) {
        this.activeSubscriptions[key].unsubscribe = () => {
          resp.unsubscribe();
        };
      } else {
        this.activeSubscriptions[key] = {
          cacheName,
          topicName,
          lastSequenceNumber: 0,
          unsubscribe: () => {
            resp.unsubscribe();
          },
          onItem: wrappedOnItem,
          onError: options.onError,
        };
      }
      console.log('New subscription added, active subscriptions are now:', this.activeSubscriptions);
    }
  }
}

const main = async () => {
  // Because the Momento Web SDK is intended for use in a browser, we use the JSDom library
  // to set up an environment that will allow us to use it in a node.js program.
  initJSDom();

  // Expecting uninterrupted sequence number progression from each subscription.
  const onItemA = (item: TopicItem) => {
    console.log(`Callback A: User code processing message ${item.sequenceNumber()}`);
  };
  const onItemB = (item: TopicItem) => {
    console.log(`Callback B: User code processing message ${item.sequenceNumber()}`);
  };
  const onError = (error: TopicSubscribe.Error) => {
    console.error(`User code received error: ${error.toString()}`);
  };
  const getDisposableToken = tokenVendingMachine;

  const wrappedTopicClient = new TokenRefreshingTopicClient({
    refreshBeforeExpiryMs: 10_000, // 10 seconds before token expires, refresh it.
    getDisposableToken,
  });

  await wrappedTopicClient.subscribe('my-cache', 'topic-1', {
    onItem: onItemA,
    onError,
  });

  await wrappedTopicClient.subscribe('my-cache', 'topic-2', {
    onItem: onItemB,
    onError,
  });

  const endDemoTime = Date.now() + 45_000; // Run for 45 seconds

  // Meanwhile, publish a message every second and see how the topic client
  // is refreshed after tokens expire every 20 seconds.
  while (Date.now() < endDemoTime) {
    await wrappedTopicClient.publish('my-cache', 'topic-1', 'Message for topic 1');
    await wrappedTopicClient.publish('my-cache', 'topic-2', 'Message for topic 2');
  }
};

main()
  .then(() => {
    console.log('End of demo!');
    // Don't leave the process hanging
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running disposable tokens example: ${e.message}`);
    throw e;
  });
