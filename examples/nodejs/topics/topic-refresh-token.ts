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

// This wrapper class makes it easy to use disposable auth tokens with the TopicClient.
// At some user-specified time before the token expires (refreshBeforeExpiryMs), a new
// disposable token will be fetched via the user-specified getDisposableToken function
// and the new token is used to create a new TopicClient instance. All active subscriptions
// are transferred to the new client, then the old client is replaced by the new one.
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
  private testFinished = false;

  private constructor(props: TokenRefreshingTopicClientProps) {
    this.refreshBeforeExpiryMs = props.refreshBeforeExpiryMs;
    this.getDisposableToken = props.getDisposableToken;
  }

  // The wrapper class requires an async initialization function to set up the
  // first TopicClient instance since the constructor cannot be async and the
  // getDisposableToken function is async.
  // A new TopicClient requires a new CredentialProvider with the new disposable token.
  private async initialize() {
    const disposableToken = await this.getDisposableToken();
    this.topicClient = new TopicClient({
      credentialProvider: CredentialProvider.fromDisposableToken(disposableToken.token),
    });
    this.scheduleTokenRefresh(disposableToken.expiresAt);
  }

  // create() is a factory method that creates a new instance of the wrapper class.
  static async create(props: TokenRefreshingTopicClientProps) {
    const client = new TopicRefreshToken(props);
    await client.initialize();
    return client;
  }

  // scheduleTokenRefresh() is a helper function that schedules a token refresh
  private scheduleTokenRefresh(expiresAt: ExpiresAt) {
    if (this.testFinished) return; // Stop the refresh if the test is finished
    const refreshAfterMs = getRefreshAfterMs(expiresAt, this.refreshBeforeExpiryMs);
    setTimeout(() => void this.refreshToken(), refreshAfterMs);
  }

  // refreshToken() is the function that is called to refresh the token.
  private async refreshToken() {
    if (this.testFinished) return; // Stop refreshing if the test is finished

    console.log('Disposable token expiring soon, refreshing topic client with new token');
    const disposableToken = await this.getDisposableToken();
    const newTopicClient = new TopicClient({
      credentialProvider: CredentialProvider.fromDisposableToken(disposableToken.token),
    });

    // Refresh subscriptions with new token
    await this.refreshSubscriptions(newTopicClient);
    this.scheduleTokenRefresh(disposableToken.expiresAt);
    this.topicClient = newTopicClient;
  }

  // For each active subscription, make sure to start the same subscription on the new client,
  // transfer over the existing onItem and onError callbacks, then unsubscribe from the old client.
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

  // Simply passes a publish request to the underlying TopicClient instance.
  // Calls the onError callback if the publish request fails.
  async publish(cacheName: string, topicName: string, message: string, onError?: (resp: TopicPublish.Error) => void) {
    if (!this.topicClient) {
      await this.initialize();
    }
    const resp = await this.topicClient?.publish(cacheName, topicName, message);
    if (resp?.type === TopicPublishResponse.Error && onError) {
      onError(resp);
    }
  }

  // Subscribes to a topic and stores the subscription and callbacks in the
  // activeSubscriptions record. The wrappedOnItem callback is a wrapper around
  // the user-provided onItem callback. The wrapper ensures that duplicate messages
  // are not processed by the user code since there could be some overlap in message
  // delivery between the old and new TopicClient instances when refreshing the client.
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
      // Pass item through to user-provided onItem only if message hasn't been processed before
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

    // If the subscription already exists, update the existing subscription to include the
    // unsubscribe function. Otherwise, make a new record with all necessary info.
    this.activeSubscriptions[`${cacheName}:${topicName}`] = {
      cacheName,
      topicName,
      lastSequenceNumber: 0,
      unsubscribe: () => resp?.unsubscribe(),
      onItem: wrappedOnItem,
      onError: options.onError,
    };
  }

  // Call this to end the test and stop refreshing and publishing
  finishTest() {
    this.testFinished = true;

    // Unsubscribe from all active subscriptions
    Object.values(this.activeSubscriptions).forEach(subscription => {
      subscription.unsubscribe();
    });

    console.log('Test completed. All subscriptions have been unsubscribed.');

    // Do not leave the process hanging if the test is finished
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  }
}

// Helper function for setting the correct SetTimeout value for refreshing the token.
function getRefreshAfterMs(expiresAt: ExpiresAt, refreshBefore: number): number {
  return expiresAt.epoch() * 1000 - Date.now() - refreshBefore;
}

// Helper function to get a disposable token from the auth service
async function getDisposableToken(): Promise<{token: string; expiresAt: ExpiresAt}> {
  const authClient = new AuthClient({
    credentialProvider: CredentialProvider.fromEnvironmentVariable('V1_API_KEY'),
  });
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

  // Run the test for 2 minutes
  setTimeout(() => {
    console.log('Test finished');
    clearInterval(publishInterval);
    client.finishTest();
  }, 120000);
}

main().catch(console.error);
