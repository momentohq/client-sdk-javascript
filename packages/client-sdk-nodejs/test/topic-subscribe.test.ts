import {
  MomentoErrorCode,
  SubscribeCallOptions,
  TopicClient,
  TopicConfigurations,
} from '../src';
import {
  CredentialProvider,
  NoopMomentoLoggerFactory,
  TopicSubscribe,
} from '@gomomento/sdk-core';
import {testTopicName} from '@gomomento/common-integration-tests';

/******************************************************************/
/* Do not run these tests in CI as they rely on using a cache with
/* a subscription limit >= 410.
/* Provide the name of your dev cache with greater subscription
/* limits using the TEST_CACHE_NAME environment variable.
/******************************************************************/

describe('Topic subscribe initialization tests', () => {
  let credentialProvider: CredentialProvider;
  let cacheName: string;

  beforeAll(() => {
    if (!process.env.TEST_CACHE_NAME) {
      throw new Error('TEST_CACHE_NAME is not set');
    }
    cacheName = process.env.TEST_CACHE_NAME;

    credentialProvider = CredentialProvider.fromEnvVar('MOMENTO_API_KEY');
  });

  it('should not silently queue subscribe requests on full channels', async () => {
    const topicName = testTopicName();
    const topicClient = new TopicClient({
      configuration: TopicConfigurations.Default.latest(
        new NoopMomentoLoggerFactory()
      ).withNumStreamConnections(1),
      credentialProvider,
    });

    // Should successfully subscribe 100 times
    const subscriptions: TopicSubscribe.Subscription[] = [];
    for (let i = 0; i < 100; i++) {
      const subscribeResponse = await topicClient.subscribe(
        cacheName,
        topicName,
        {}
      );
      expect(subscribeResponse).toBeInstanceOf(TopicSubscribe.Subscription);
      subscriptions.push(subscribeResponse as TopicSubscribe.Subscription);
    }
    expect(subscriptions.length).toBe(100);

    // Subscribing one more time should fail, not silently queue up the request
    const subscribeResponse = await topicClient.subscribe(
      cacheName,
      topicName,
      {}
    );
    expect(subscribeResponse).toBeInstanceOf(TopicSubscribe.Error);
    const subscribeError = subscribeResponse as TopicSubscribe.Error;
    expect(subscribeError).toBeInstanceOf(TopicSubscribe.Error);
    expect(subscribeError.errorCode()).toBe(
      MomentoErrorCode.CLIENT_RESOURCE_EXHAUSTED
    );

    // Cleanup
    for (const subscription of subscriptions) {
      subscription.unsubscribe();
    }
  });

  describe('using 2 stream channels', () => {
    const numStreamChannels = 2;
    const maxStreamCapacity = numStreamChannels * 100;

    it('should handle a burst of subscribe requests < max capacity', async () => {
      let errorCounter = 0;
      let disconnectedCounter = 0;
      const subscribeOptions: SubscribeCallOptions = {
        onError() {
          errorCounter++;
        },
        onConnectionLost() {
          disconnectedCounter++;
        },
      };

      const topicName = testTopicName();
      const topicClient = new TopicClient({
        configuration: TopicConfigurations.Default.latest(
          new NoopMomentoLoggerFactory()
        ).withNumStreamConnections(numStreamChannels),
        credentialProvider,
      });

      // Should successfully start a burst of subscriptions
      const subscribePromises = [];
      for (let i = 0; i < maxStreamCapacity / 2; i++) {
        const subscribePromise = topicClient.subscribe(
          cacheName,
          topicName,
          subscribeOptions
        );
        subscribePromises.push(subscribePromise);
      }

      const subscribeResponses = await Promise.all(subscribePromises);
      const successfulSubscriptions: TopicSubscribe.Subscription[] = [];
      for (const subscribeResponse of subscribeResponses) {
        expect(subscribeResponse).toBeInstanceOf(TopicSubscribe.Subscription);
        successfulSubscriptions.push(
          subscribeResponse as TopicSubscribe.Subscription
        );
      }
      expect(successfulSubscriptions.length).toBe(maxStreamCapacity / 2);

      expect(errorCounter).toBe(0);
      expect(disconnectedCounter).toBe(0);

      // Cleanup
      for (const subscription of successfulSubscriptions) {
        subscription.unsubscribe();
      }
    });

    it('should handle a burst of subscribe requests == max capacity', async () => {
      let errorCounter = 0;
      let disconnectedCounter = 0;
      const subscribeOptions: SubscribeCallOptions = {
        onError() {
          errorCounter++;
        },
        onConnectionLost() {
          disconnectedCounter++;
        },
      };

      const topicName = testTopicName();
      const topicClient = new TopicClient({
        configuration: TopicConfigurations.Default.latest(
          new NoopMomentoLoggerFactory()
        ).withNumStreamConnections(numStreamChannels),
        credentialProvider,
      });

      // Should successfully start a burst of subscriptions
      const subscribePromises = [];
      for (let i = 0; i < maxStreamCapacity; i++) {
        const subscribePromise = topicClient.subscribe(
          cacheName,
          topicName,
          subscribeOptions
        );
        subscribePromises.push(subscribePromise);
      }

      const subscribeResponses = await Promise.all(subscribePromises);
      const successfulSubscriptions: TopicSubscribe.Subscription[] = [];
      for (const subscribeResponse of subscribeResponses) {
        expect(subscribeResponse).toBeInstanceOf(TopicSubscribe.Subscription);
        successfulSubscriptions.push(
          subscribeResponse as TopicSubscribe.Subscription
        );
      }
      expect(successfulSubscriptions.length).toBe(maxStreamCapacity);

      expect(errorCounter).toBe(0);
      expect(disconnectedCounter).toBe(0);

      // Cleanup
      for (const subscription of successfulSubscriptions) {
        subscription.unsubscribe();
      }
    });

    it('should handle a burst of subscribe requests > max capacity', async () => {
      let errorCounter = 0;
      let disconnectedCounter = 0;
      const subscribeOptions: SubscribeCallOptions = {
        onError() {
          errorCounter++;
        },
        onConnectionLost() {
          disconnectedCounter++;
        },
      };

      const topicName = testTopicName();
      const topicClient = new TopicClient({
        configuration: TopicConfigurations.Default.latest(
          new NoopMomentoLoggerFactory()
        ).withNumStreamConnections(numStreamChannels),
        credentialProvider,
      });

      // Should successfully start a burst of subscriptions
      const subscribePromises = [];
      for (let i = 0; i < maxStreamCapacity + 10; i++) {
        const subscribePromise = topicClient.subscribe(
          cacheName,
          topicName,
          subscribeOptions
        );
        subscribePromises.push(subscribePromise);
      }

      const subscribeResponses = await Promise.all(subscribePromises);

      const successfulResponses = subscribeResponses.filter(
        response => response instanceof TopicSubscribe.Subscription
      );
      const successfulSubscriptions: TopicSubscribe.Subscription[] = [];
      for (const subscribeResponse of successfulResponses) {
        expect(subscribeResponse).toBeInstanceOf(TopicSubscribe.Subscription);
        successfulSubscriptions.push(
          subscribeResponse as TopicSubscribe.Subscription
        );
      }
      expect(successfulSubscriptions.length).toBe(maxStreamCapacity);

      const errorResponses = subscribeResponses.filter(
        response => response instanceof TopicSubscribe.Error
      );
      expect(errorResponses.length).toBe(10);

      expect(errorCounter).toBe(0);
      expect(disconnectedCounter).toBe(0);

      // Cleanup
      for (const subscription of successfulSubscriptions) {
        subscription.unsubscribe();
      }
    });
  });

  describe('using 4 stream channels', () => {
    const numStreamChannels = 4;
    const maxStreamCapacity = numStreamChannels * 100;

    it('should handle a burst of subscribe requests < max capacity', async () => {
      let errorCounter = 0;
      let disconnectedCounter = 0;
      const subscribeOptions: SubscribeCallOptions = {
        onError() {
          errorCounter++;
        },
        onConnectionLost() {
          disconnectedCounter++;
        },
      };

      const topicName = testTopicName();
      const topicClient = new TopicClient({
        configuration: TopicConfigurations.Default.latest(
          new NoopMomentoLoggerFactory()
        ).withNumStreamConnections(numStreamChannels),
        credentialProvider,
      });

      // Should successfully start a burst of subscriptions
      const subscribePromises = [];
      for (let i = 0; i < maxStreamCapacity / 2; i++) {
        const subscribePromise = topicClient.subscribe(
          cacheName,
          topicName,
          subscribeOptions
        );
        subscribePromises.push(subscribePromise);
      }

      const subscribeResponses = await Promise.all(subscribePromises);
      const successfulSubscriptions: TopicSubscribe.Subscription[] = [];
      for (const subscribeResponse of subscribeResponses) {
        expect(subscribeResponse).toBeInstanceOf(TopicSubscribe.Subscription);
        successfulSubscriptions.push(
          subscribeResponse as TopicSubscribe.Subscription
        );
      }
      expect(successfulSubscriptions.length).toBe(maxStreamCapacity / 2);

      expect(errorCounter).toBe(0);
      expect(disconnectedCounter).toBe(0);

      // Cleanup
      for (const subscription of successfulSubscriptions) {
        subscription.unsubscribe();
      }
    });

    it('should handle a burst of subscribe requests == max capacity', async () => {
      let errorCounter = 0;
      let disconnectedCounter = 0;
      const subscribeOptions: SubscribeCallOptions = {
        onError() {
          errorCounter++;
        },
        onConnectionLost() {
          disconnectedCounter++;
        },
      };

      const topicName = testTopicName();
      const topicClient = new TopicClient({
        configuration: TopicConfigurations.Default.latest(
          new NoopMomentoLoggerFactory()
        ).withNumStreamConnections(numStreamChannels),
        credentialProvider,
      });

      // Should successfully start a burst of subscriptions
      const subscribePromises = [];
      for (let i = 0; i < maxStreamCapacity; i++) {
        const subscribePromise = topicClient.subscribe(
          cacheName,
          topicName,
          subscribeOptions
        );
        subscribePromises.push(subscribePromise);
      }

      const subscribeResponses = await Promise.all(subscribePromises);
      const successfulSubscriptions: TopicSubscribe.Subscription[] = [];
      for (const subscribeResponse of subscribeResponses) {
        expect(subscribeResponse).toBeInstanceOf(TopicSubscribe.Subscription);
        successfulSubscriptions.push(
          subscribeResponse as TopicSubscribe.Subscription
        );
      }
      expect(successfulSubscriptions.length).toBe(maxStreamCapacity);

      expect(errorCounter).toBe(0);
      expect(disconnectedCounter).toBe(0);

      // Cleanup
      for (const subscription of successfulSubscriptions) {
        subscription.unsubscribe();
      }
    });

    it('should handle a burst of subscribe requests > max capacity', async () => {
      let errorCounter = 0;
      let disconnectedCounter = 0;
      const subscribeOptions: SubscribeCallOptions = {
        onError() {
          errorCounter++;
        },
        onConnectionLost() {
          disconnectedCounter++;
        },
      };

      const topicName = testTopicName();
      const topicClient = new TopicClient({
        configuration: TopicConfigurations.Default.latest(
          new NoopMomentoLoggerFactory()
        ).withNumStreamConnections(numStreamChannels),
        credentialProvider,
      });

      // Should successfully start a burst of subscriptions
      const subscribePromises = [];
      for (let i = 0; i < maxStreamCapacity + 10; i++) {
        const subscribePromise = topicClient.subscribe(
          cacheName,
          topicName,
          subscribeOptions
        );
        subscribePromises.push(subscribePromise);
      }

      const subscribeResponses = await Promise.all(subscribePromises);

      const successfulResponses = subscribeResponses.filter(
        response => response instanceof TopicSubscribe.Subscription
      );
      const successfulSubscriptions: TopicSubscribe.Subscription[] = [];
      for (const subscribeResponse of successfulResponses) {
        expect(subscribeResponse).toBeInstanceOf(TopicSubscribe.Subscription);
        successfulSubscriptions.push(
          subscribeResponse as TopicSubscribe.Subscription
        );
      }
      expect(successfulSubscriptions.length).toBe(maxStreamCapacity);

      const errorResponses = subscribeResponses.filter(
        response => response instanceof TopicSubscribe.Error
      );
      expect(errorResponses.length).toBe(10);

      expect(errorCounter).toBe(0);
      expect(disconnectedCounter).toBe(0);

      // Cleanup
      for (const subscription of successfulSubscriptions) {
        subscription.unsubscribe();
      }
    });
  });
});
