import {
  DefaultMomentoLoggerFactory,
  MomentoErrorCode,
  MomentoLogger,
  SubscribeCallOptions,
} from '../../../src';
import {TestRetryMetricsCollector} from '../../test-retry-metrics-collector';
import {WithCacheAndTopicClient} from '../integration-setup';
import {MomentoLocalMiddlewareArgs} from '../../momento-local-middleware';
import {v4} from 'uuid';
import {Semaphore} from '@gomomento/sdk-core/dist/src/internal/utils';
import {TopicPublish, TopicSubscribe} from '@gomomento/sdk-core';
import {MomentoRPCMethod} from '../../../src/config/retry/momento-rpc-method';

describe('Topic client retry tests', () => {
  let testMetricsCollector: TestRetryMetricsCollector;
  let momentoLogger: MomentoLogger;

  beforeAll(() => {
    testMetricsCollector = new TestRetryMetricsCollector();
    momentoLogger = new DefaultMomentoLoggerFactory().getLogger(
      'TopicClientRetryTests'
    );
  });

  describe('subscribe', () => {
    it('should retry on recoverable error and restore connection', async () => {
      const streamMessageLimit = 3;
      const momentoLocalMiddlewareArgs: MomentoLocalMiddlewareArgs = {
        logger: momentoLogger,
        testMetricsCollector: testMetricsCollector,
        requestId: v4(),
        streamError: MomentoErrorCode.SERVER_UNAVAILABLE,
        streamErrorRpcList: [MomentoRPCMethod.TopicSubscribe],
        streamErrorMessageLimit: streamMessageLimit,
      };
      let subscription: TopicSubscribe.Subscription | null = null;
      const semaphore = new Semaphore(0); // Semaphore starts at 0 (not acquired)
      let retryCounter = 0;
      let errorCounter = 0;

      const subscribeOptions: SubscribeCallOptions = {
        onItem(item) {
          momentoLogger.info(`Received item: ${item.valueString()}`);
        },
        onError() {
          errorCounter++;
        },
        onConnectionLost() {
          retryCounter++;
          semaphore.release(); // release the semaphore to allow the test to continue
        },
      };

      await WithCacheAndTopicClient(
        config => config,
        momentoLocalMiddlewareArgs,
        async (topicClient, cacheName) => {
          const topicName = 'topic';

          // Subscribe to the topic
          const subscribeResponse = await topicClient.subscribe(
            cacheName,
            topicName,
            subscribeOptions
          );
          expect(subscribeResponse).toBeInstanceOf(TopicSubscribe.Subscription);
          subscription = subscribeResponse as TopicSubscribe.Subscription;

          expect(retryCounter).toBe(0);

          // Wait for connection lost
          await semaphore.acquire(); // Wait until the semaphore is released

          expect(retryCounter).toBe(1);
          expect(errorCounter).toBe(0);

          // Unsubscribe after test completes
          if (subscription) {
            subscription.unsubscribe();
          }
        }
      );
    });

    it('should not retry on an unrecoverable error', async () => {
      const streamMessageLimit = 3;
      const momentoLocalMiddlewareArgs: MomentoLocalMiddlewareArgs = {
        logger: momentoLogger,
        testMetricsCollector: testMetricsCollector,
        requestId: v4(),
        // Currently, CACHE_NOT_FOUND_ERROR is the only unrecoverable error that is not retried.
        streamError: MomentoErrorCode.CACHE_NOT_FOUND_ERROR,
        streamErrorRpcList: [MomentoRPCMethod.TopicSubscribe],
        streamErrorMessageLimit: streamMessageLimit,
      };
      const semaphore = new Semaphore(0); // Semaphore starts at 0 (not acquired)
      let connectionLostCounter = 0;
      let errorCounter = 0;

      const subscribeOptions: SubscribeCallOptions = {
        onItem(item) {
          momentoLogger.info(`Received item: ${item.valueString()}`);
        },
        onError() {
          errorCounter++;
        },
        onConnectionLost() {
          connectionLostCounter++;
          semaphore.release(); // release the semaphore to allow the test to continue
        },
      };

      await WithCacheAndTopicClient(
        config => config,
        momentoLocalMiddlewareArgs,
        async (topicClient, cacheName) => {
          const topicName = 'topic';

          // Subscribe to the topic
          const subscribeResponse = await topicClient.subscribe(
            cacheName,
            topicName,
            subscribeOptions
          );
          expect(subscribeResponse).toBeInstanceOf(TopicSubscribe.Subscription);

          // Wait for connection lost
          await semaphore.acquire(); // wait for error to be received

          expect(errorCounter).toBe(1);
          expect(connectionLostCounter).toBe(1);
        }
      );
    });
  });

  describe('publish', () => {
    it('should error on deadline exceeded', async () => {
      const momentoLocalMiddlewareArgs: MomentoLocalMiddlewareArgs = {
        logger: momentoLogger,
        testMetricsCollector: testMetricsCollector,
        requestId: v4(),
        delayRpcList: [MomentoRPCMethod.TopicPublish],
        delayMillis: 6000, // Default deadline is 5 seconds
      };

      await WithCacheAndTopicClient(
        config => config,
        momentoLocalMiddlewareArgs,
        async (topicClient, cacheName) => {
          const publishResponse = await topicClient.publish(
            cacheName,
            'topic',
            'message'
          );
          expect(publishResponse).toBeInstanceOf(TopicPublish.Error);
          expect((publishResponse as TopicPublish.Error).errorCode()).toEqual(
            MomentoErrorCode.TIMEOUT_ERROR
          );
        }
      );
    });
  });
});
