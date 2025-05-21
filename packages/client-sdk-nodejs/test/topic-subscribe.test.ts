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
/* a subscription limit >= 2010.
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

    // Unsubscribing should allow one new subscription to be created
    subscriptions[0].unsubscribe();
    const subscribeResponse2 = await topicClient.subscribe(
      cacheName,
      topicName,
      {}
    );
    expect(subscribeResponse2).toBeInstanceOf(TopicSubscribe.Subscription);
    subscriptions.push(subscribeResponse2 as TopicSubscribe.Subscription);

    // Another subscribe attempt should fail (i.e. should not over-decrement)
    const subscribeResponse3 = await topicClient.subscribe(
      cacheName,
      topicName,
      {}
    );
    expect(subscribeResponse3).toBeInstanceOf(TopicSubscribe.Error);
    const subscribeError3 = subscribeResponse3 as TopicSubscribe.Error;
    expect(subscribeError3).toBeInstanceOf(TopicSubscribe.Error);
    expect(subscribeError3.errorCode()).toBe(
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

    it('handles a burst of subscribe, unsubscribe, subscribe requests', async () => {
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

      // Burst of unsubscribe requests
      const unsubscribeBurstSize = maxStreamCapacity / 2;
      const unsubscribePromises = [];
      for (let i = 0; i < unsubscribeBurstSize; i++) {
        const unsubscribePromise = successfulSubscriptions[i].unsubscribe();
        unsubscribePromises.push(unsubscribePromise);
      }
      await Promise.all(unsubscribePromises);
      expect(errorCounter).toBe(0);
      expect(disconnectedCounter).toBe(unsubscribeBurstSize);

      // Burst of subscribe requests
      const subscribeBurstSize = maxStreamCapacity / 2 + 10;
      const subscribePromises2 = [];
      for (let i = 0; i < subscribeBurstSize; i++) {
        const subscribePromise = topicClient.subscribe(
          cacheName,
          topicName,
          subscribeOptions
        );
        subscribePromises2.push(subscribePromise);
      }
      const subscribeResponses2 = await Promise.all(subscribePromises2);
      const successfulSubscriptions2: TopicSubscribe.Subscription[] = [];
      for (const subscribeResponse of subscribeResponses2) {
        if (subscribeResponse instanceof TopicSubscribe.Subscription) {
          successfulSubscriptions2.push(subscribeResponse);
        }
      }
      expect(successfulSubscriptions2.length).toBe(subscribeBurstSize - 10);

      // Cleanup
      for (const subscription of successfulSubscriptions) {
        subscription.unsubscribe();
      }
      for (const subscription of successfulSubscriptions2) {
        subscription.unsubscribe();
      }
    });
  });

  describe('using 10 stream channels', () => {
    const numStreamChannels = 10;
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

  describe('using 20 stream channels', () => {
    const numStreamChannels = 20;
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
