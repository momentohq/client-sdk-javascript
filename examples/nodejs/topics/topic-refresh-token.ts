import {
  AllCaches,
  AllTopics,
  AuthClient,
  CredentialProvider,
  DisposableTokenScopes,
  ExpiresAt,
  ExpiresIn,
  GenerateDisposableTokenResponse,
  TopicClient,
  TopicItem,
  TopicPublish,
  TopicPublishResponse,
  TopicSubscribe,
  TopicSubscribeResponse,
} from '@gomomento/sdk';

export interface TokenRefreshingTopicClientProps {
  refreshBeforeExpiryMs: number;
  getDisposableToken: () => Promise<{token: string; expiresAt: ExpiresAt}>;
}

export class TopicRefreshToken {
  private topicClient?: TopicClient;
  private readonly refreshBeforeExpiryMs: number;
  private readonly getDisposableToken: () => Promise<{token: string; expiresAt: ExpiresAt}>;
  private activeSubscriptions: Record<
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

  private constructor(props: TokenRefreshingTopicClientProps) {
    this.refreshBeforeExpiryMs = props.refreshBeforeExpiryMs;
    this.getDisposableToken = props.getDisposableToken;
  }

  private async initialize() {
    const disposableToken = await this.getDisposableToken();
    this.topicClient = new TopicClient({
      credentialProvider: CredentialProvider.fromString(disposableToken.token),
    });
    this.scheduleTokenRefresh(disposableToken.expiresAt);
  }

  static async create(props: TokenRefreshingTopicClientProps) {
    const client = new TopicRefreshToken(props);
    await client.initialize();
    return client;
  }

  private scheduleTokenRefresh(expiresAt: ExpiresAt) {
    const refreshAfterMs = getRefreshAfterMs(expiresAt, this.refreshBeforeExpiryMs);
    setTimeout(() => void this.refreshToken(), refreshAfterMs);
  }

  private async refreshToken() {
    console.log('Disposable token expiring soon, refreshing topic client with new token');
    const disposableToken = await this.getDisposableToken();
    const newTopicClient = new TopicClient({
      credentialProvider: CredentialProvider.fromString(disposableToken.token),
    });

    // Refresh subscriptions with new token
    await this.refreshSubscriptions(newTopicClient);
    this.scheduleTokenRefresh(disposableToken.expiresAt);
    this.topicClient = newTopicClient;
  }

  private async refreshSubscriptions(newTopicClient: TopicClient) {
    for (const key in this.activeSubscriptions) {
      const value = this.activeSubscriptions[key];
      const newSubscription = await newTopicClient.subscribe(value.cacheName, value.topicName, {
        onItem: value.onItem,
        onError: value.onError,
      });
      value.unsubscribe(); // Unsubscribe old subscription

      if (newSubscription.type === TopicSubscribeResponse.Error) {
        throw new Error(`Error subscribing to topic: ${newSubscription.toString()}`);
      } else {
        this.activeSubscriptions[key].unsubscribe = () => newSubscription.unsubscribe();
      }
    }
  }

  async publish(cacheName: string, topicName: string, message: string, onError?: (resp: TopicPublish.Error) => void) {
    if (!this.topicClient) {
      await this.initialize();
    }
    const resp = await this.topicClient?.publish(cacheName, topicName, message);
    if (resp?.type === TopicPublishResponse.Error && onError) {
      onError(resp);
    }
  }

  async subscribe(
    cacheName: string,
    topicName: string,
    options: {onItem: (item: TopicItem) => void; onError: (error: TopicSubscribe.Error) => void}
  ) {
    if (!this.topicClient) {
      await this.initialize();
    }

    const wrappedOnItem = (item: TopicItem) => {
      const currentSubscription = this.activeSubscriptions[`${cacheName}:${topicName}`];
      if (item.sequenceNumber() > currentSubscription.lastSequenceNumber) {
        options.onItem(item);
        currentSubscription.lastSequenceNumber = item.sequenceNumber();
      }
    };

    const resp = await this.topicClient?.subscribe(cacheName, topicName, {
      onItem: wrappedOnItem,
      onError: options.onError,
    });

    if (resp?.type === TopicSubscribeResponse.Error) {
      throw new Error(`Error subscribing to topic: ${resp.toString()}`);
    }

    this.activeSubscriptions[`${cacheName}:${topicName}`] = {
      cacheName,
      topicName,
      lastSequenceNumber: 0,
      unsubscribe: () => resp?.unsubscribe(),
      onItem: wrappedOnItem,
      onError: options.onError,
    };
  }
}

function getRefreshAfterMs(expiresAt: ExpiresAt, refreshBefore: number): number {
  return expiresAt.epoch() * 1000 - Date.now() - refreshBefore;
}

async function getDisposableToken(): Promise<{token: string; expiresAt: ExpiresAt}> {
  const authClient = new AuthClient();
  const fetchResp = await authClient.generateDisposableToken(
    DisposableTokenScopes.topicPublishSubscribe(AllCaches, AllTopics),
    ExpiresIn.minutes(1)
  );

  switch (fetchResp.type) {
    case GenerateDisposableTokenResponse.Error:
      throw new Error(`Error generating disposable token: ${fetchResp.toString()}`);
    case GenerateDisposableTokenResponse.Success:
      return {token: fetchResp.authToken, expiresAt: fetchResp.expiresAt};
  }
}

async function main() {
  const client = await TopicRefreshToken.create({
    refreshBeforeExpiryMs: 5000,
    getDisposableToken: getDisposableToken,
  });

  const cacheName = 'cache';
  const topicName = 'my-topic';
  let messageCount = 0;

  // Subscribe to the topic with a message handler
  await client.subscribe(cacheName, topicName, {
    onItem: item => {
      messageCount++;
      console.log(`Received message: ${item.valueString()}`);
    },
    onError: error => {
      console.error(`Subscription error: ${error.toString()}`);
    },
  });

  // Continuously publish messages every 2 seconds
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const publishInterval = setInterval(async () => {
    const message = `Message #${messageCount + 1}`;
    await client.publish(cacheName, topicName, message, error => {
      if (error) {
        console.error(`Publish error: ${error.toString()}`);
      }
    });
    console.log(`Published: ${message}`);
  }, 2000);

  // Run the test for 5 minutes
  setTimeout(() => {
    console.log('Test finished');
    clearInterval(publishInterval);
  }, 300000);
}

main().catch(console.error);
