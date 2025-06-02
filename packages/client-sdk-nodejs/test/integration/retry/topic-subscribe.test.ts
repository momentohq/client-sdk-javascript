import {
  DefaultMomentoLoggerFactory,
  SubscribeCallOptions,
  TopicClient,
  TopicConfigurations,
} from '../../../src';
import {
  MomentoLogger,
  TopicSubscribe,
  MomentoErrorCode,
  MomentoLocalProvider,
} from '@gomomento/sdk-core';
import {sleep} from '@gomomento/sdk-core/dist/src/internal/utils';
import {WithCacheAndTopicClient} from '../integration-setup';
import {MomentoLocalMiddlewareArgs} from '../../momento-local-middleware';
import {TestRetryMetricsCollector} from '../../test-retry-metrics-collector';
import {v4} from 'uuid';
import {MomentoRPCMethod} from '../../../src/config/retry/momento-rpc-method';

describe('Topic subscribe initialization tests', () => {
  let testMetricsCollector: TestRetryMetricsCollector;
  let momentoLogger: MomentoLogger;
  let loggerFactory: DefaultMomentoLoggerFactory;

  beforeAll(() => {
    testMetricsCollector = new TestRetryMetricsCollector();
    loggerFactory = new DefaultMomentoLoggerFactory();
    momentoLogger = loggerFactory.getLogger('TopicSubscribeTest');
  });

  it('should not silently queue subscribe requests on full channels', async () => {
    let unsubscribeCounter = 0;
    const callOptions: SubscribeCallOptions = {
      onSubscriptionEnd: () => {
        unsubscribeCounter++;
      },
    };

    const momentoLocalMiddlewareArgs: MomentoLocalMiddlewareArgs = {
      logger: momentoLogger,
      testMetricsCollector: testMetricsCollector,
      requestId: v4(),
    };

    await WithCacheAndTopicClient(
      config => config.withNumStreamConnections(1),
      momentoLocalMiddlewareArgs,
      async (topicClient, cacheName) => {
        const topicName = 'topic';

        // Should successfully subscribe 100 times
        const subscriptions: TopicSubscribe.Subscription[] = [];
        for (let i = 0; i < 100; i++) {
          const subscribeResponse = await topicClient.subscribe(
            cacheName,
            topicName,
            callOptions
          );
          expect(subscribeResponse).toBeInstanceOf(TopicSubscribe.Subscription);
          subscriptions.push(subscribeResponse as TopicSubscribe.Subscription);
        }
        expect(subscriptions.length).toBe(100);

        // Subscribing one more time should fail, not silently queue up the request
        const subscribeResponse = await topicClient.subscribe(
          cacheName,
          topicName,
          callOptions
        );
        expect(subscribeResponse).toBeInstanceOf(TopicSubscribe.Error);
        const subscribeError = subscribeResponse as TopicSubscribe.Error;
        expect(subscribeError).toBeInstanceOf(TopicSubscribe.Error);
        expect(subscribeError.errorCode()).toBe(
          MomentoErrorCode.CLIENT_RESOURCE_EXHAUSTED
        );

        // Unsubscribing should allow one new subscription to be created
        subscriptions[0].unsubscribe();
        await sleep(100);
        expect(unsubscribeCounter).toBe(1);

        const subscribeResponse2 = await topicClient.subscribe(
          cacheName,
          topicName,
          callOptions
        );
        expect(subscribeResponse2).toBeInstanceOf(TopicSubscribe.Subscription);
        subscriptions.push(subscribeResponse2 as TopicSubscribe.Subscription);

        // Another subscribe attempt should fail (i.e. should not over-decrement)
        const subscribeResponse3 = await topicClient.subscribe(
          cacheName,
          topicName,
          callOptions
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
      }
    );
  });

  it('mid-stream error should decrement subscription count', async () => {
    let unsubscribeCounter = 0;
    const callOptions: SubscribeCallOptions = {
      onSubscriptionEnd: () => {
        unsubscribeCounter++;
      },
      onError(e) {
        expect(e).toBeInstanceOf(TopicSubscribe.Error);
        expect(e.errorCode()).toBe(MomentoErrorCode.CACHE_NOT_FOUND_ERROR);
      },
    };

    const momentoLocalMiddlewareArgs: MomentoLocalMiddlewareArgs = {
      logger: momentoLogger,
      testMetricsCollector: testMetricsCollector,
      requestId: v4(),
      streamError: MomentoErrorCode.CACHE_NOT_FOUND_ERROR,
      streamErrorRpcList: [MomentoRPCMethod.TopicSubscribe],
      streamErrorMessageLimit: 3,
    };

    const basicTopicClient = new TopicClient({
      configuration:
        TopicConfigurations.Default.latest().withNumStreamConnections(1),
      credentialProvider: new MomentoLocalProvider({
        hostname: process.env.MOMENTO_HOSTNAME || '127.0.0.1',
        port: parseInt(process.env.MOMENTO_PORT || '8080'),
      }),
    });

    await WithCacheAndTopicClient(
      config => config.withNumStreamConnections(1),
      momentoLocalMiddlewareArgs,
      async (topicClient, cacheName) => {
        const topicName = 'topic';

        // Should successfully subscribe 99 times using a client without momento-local args
        const subscriptions: TopicSubscribe.Subscription[] = [];
        for (let i = 0; i < 99; i++) {
          const subscribeResponse = await basicTopicClient.subscribe(
            cacheName,
            topicName,
            callOptions
          );
          expect(subscribeResponse).toBeInstanceOf(TopicSubscribe.Subscription);
          subscriptions.push(subscribeResponse as TopicSubscribe.Subscription);
        }

        // Subscribe one more time but expecting an error after a couple of heartbeats
        const subscribeResponse = await topicClient.subscribe(
          cacheName,
          'another-topic',
          callOptions
        );
        expect(subscribeResponse).toBeInstanceOf(TopicSubscribe.Subscription);
        subscriptions.push(subscribeResponse as TopicSubscribe.Subscription);
        expect(subscriptions.length).toBe(100);

        // Wait for the subscription that ran into the error to be closed
        await sleep(3000);
        expect(unsubscribeCounter).toBe(1);

        // Another subscribe attempt should succeed because the subscription that
        // ran into the error should have decremented the subscription count.
        const subscribeResponse2 = await basicTopicClient.subscribe(
          cacheName,
          topicName,
          callOptions
        );
        expect(subscribeResponse2).toBeInstanceOf(TopicSubscribe.Subscription);
        subscriptions.push(subscribeResponse2 as TopicSubscribe.Subscription);

        // Another subscribe attempt should fail because the subscription count
        // should be at 100 again
        const subscribeResponse3 = await basicTopicClient.subscribe(
          cacheName,
          topicName,
          callOptions
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
      }
    );
  });

  describe.each([2, 10, 20])('using %i stream channels', numStreamChannels => {
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

      const momentoLocalMiddlewareArgs: MomentoLocalMiddlewareArgs = {
        logger: momentoLogger,
        testMetricsCollector: testMetricsCollector,
        requestId: v4(),
      };

      await WithCacheAndTopicClient(
        config => config.withNumStreamConnections(numStreamChannels),
        momentoLocalMiddlewareArgs,
        async (topicClient, cacheName) => {
          const topicName = 'topic';

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
            expect(subscribeResponse).toBeInstanceOf(
              TopicSubscribe.Subscription
            );
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
        }
      );
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

      const momentoLocalMiddlewareArgs: MomentoLocalMiddlewareArgs = {
        logger: momentoLogger,
        testMetricsCollector: testMetricsCollector,
        requestId: v4(),
      };

      await WithCacheAndTopicClient(
        config => config.withNumStreamConnections(numStreamChannels),
        momentoLocalMiddlewareArgs,
        async (topicClient, cacheName) => {
          const topicName = 'topic';
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
            expect(subscribeResponse).toBeInstanceOf(
              TopicSubscribe.Subscription
            );
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
        }
      );
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

      const momentoLocalMiddlewareArgs: MomentoLocalMiddlewareArgs = {
        logger: momentoLogger,
        testMetricsCollector: testMetricsCollector,
        requestId: v4(),
      };

      await WithCacheAndTopicClient(
        config => config.withNumStreamConnections(numStreamChannels),
        momentoLocalMiddlewareArgs,
        async (topicClient, cacheName) => {
          const topicName = 'topic';
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
            expect(subscribeResponse).toBeInstanceOf(
              TopicSubscribe.Subscription
            );
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
        }
      );
    });

    it('handles a burst of subscribe, unsubscribe, subscribe requests', async () => {
      let unsubscribeCounter = 0;
      const callOptions: SubscribeCallOptions = {
        onSubscriptionEnd: () => {
          unsubscribeCounter++;
        },
      };

      const momentoLocalMiddlewareArgs: MomentoLocalMiddlewareArgs = {
        logger: momentoLogger,
        testMetricsCollector: testMetricsCollector,
        requestId: v4(),
      };

      await WithCacheAndTopicClient(
        config => config.withNumStreamConnections(numStreamChannels),
        momentoLocalMiddlewareArgs,
        async (topicClient, cacheName) => {
          const topicName = 'topic';
          // Should successfully start a burst of subscriptions
          const subscribePromises = [];
          for (let i = 0; i < maxStreamCapacity; i++) {
            const subscribePromise = topicClient.subscribe(
              cacheName,
              topicName,
              callOptions
            );
            subscribePromises.push(subscribePromise);
          }
          const subscribeResponses = await Promise.all(subscribePromises);
          const successfulSubscriptions: TopicSubscribe.Subscription[] = [];
          for (const subscribeResponse of subscribeResponses) {
            expect(subscribeResponse).toBeInstanceOf(
              TopicSubscribe.Subscription
            );
            successfulSubscriptions.push(
              subscribeResponse as TopicSubscribe.Subscription
            );
          }
          expect(successfulSubscriptions.length).toBe(maxStreamCapacity);

          // Batch of unsubscribe requests
          const unsubscribeBurstSize = maxStreamCapacity / 2;
          for (let i = 0; i < unsubscribeBurstSize; i++) {
            successfulSubscriptions[i].unsubscribe();
          }
          await sleep(100);
          expect(unsubscribeCounter).toBe(unsubscribeBurstSize);

          // Burst of subscribe requests
          const subscribeBurstSize = maxStreamCapacity / 2 + 10;
          const subscribePromises2 = [];
          for (let i = 0; i < subscribeBurstSize; i++) {
            const subscribePromise = topicClient.subscribe(
              cacheName,
              topicName,
              callOptions
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
        }
      );
    });
  });
});
