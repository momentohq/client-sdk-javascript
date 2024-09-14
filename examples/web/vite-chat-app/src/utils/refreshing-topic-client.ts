import { CredentialProvider, ExpiresAt, TopicClient, TopicItem, TopicPublish, TopicPublishResponse, TopicSubscribe, TopicSubscribeResponse } from "@gomomento/sdk-web";

export interface TokenRefreshingTopicClientProps {
  refreshBeforeExpiryMs: number;
  getDisposableToken: () => Promise<{token: string; expiresAt: ExpiresAt}>;
}

export class TokenRefreshingTopicClient {
  topicClient?: TopicClient;
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

  private constructor(props: TokenRefreshingTopicClientProps) {
    this.refreshBeforeExpiryMs = props.refreshBeforeExpiryMs;
    this.getDisposableToken = props.getDisposableToken;
  }

  private async initialize() {
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

  static async create(props: TokenRefreshingTopicClientProps) {
    const client = new TokenRefreshingTopicClient(props);
    await client.initialize();
    return client;
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
        throw new Error(`Error subscribing to topic: ${newSubscription.toString()}`);
      } else {
        this.activeSubscriptions[key].unsubscribe = () => {
          newSubscription.unsubscribe();
        };
      }
    }
    this.topicClient = newTopicClient;
  }

  async publish(cacheName: string, topicName: string, message: string, onError?: (resp: TopicPublish.Error) => void) {
    if (this.topicClient === undefined) {
      await this.initialize();
    }
    const resp = await this.topicClient?.publish(cacheName, topicName, message);
    if (resp?.type === TopicPublishResponse.Error) {
      console.error(`Error publishing message: ${resp.toString()}`);
      if (onError) {
        onError(resp);
      }
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
    if (this.topicClient === undefined) {
      await this.initialize();
    }

    const wrappedOnItem = (item: TopicItem) => {
      const currentSubscription = this.activeSubscriptions[`${cacheName}:${topicName}`];
      // pass through to user-provided onItem only if message hasn't been processed before
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
    } else {
      console.log(`Subscribed to ${cacheName}:${topicName}`);
      const key = `${cacheName}:${topicName}`;

      // if key already exists, update the existing subscription
      // otherwise make new record
      if (key in this.activeSubscriptions) {
        this.activeSubscriptions[key].unsubscribe = () => {
          resp?.unsubscribe();
        };
      } else {
        this.activeSubscriptions[key] = {
          cacheName,
          topicName,
          lastSequenceNumber: 0,
          unsubscribe: () => {
            resp?.unsubscribe();
          },
          onItem: wrappedOnItem,
          onError: options.onError,
        };
      }
      console.log('New subscription added, active subscriptions are now:', this.activeSubscriptions);
    }
  }
}

function getRefreshAfterMs(expiresAt: ExpiresAt, refreshBefore: number): number {
  const refreshingIn = expiresAt.epoch() * 1000 - Date.now() - refreshBefore;
  console.log(`Refreshing in ${refreshingIn} ms`);
  return refreshingIn;
}
