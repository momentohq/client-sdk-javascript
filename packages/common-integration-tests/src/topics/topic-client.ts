import {v4} from 'uuid';
import {
  CreateCache,
  DeleteCache,
  MomentoErrorCode,
  TopicItem,
  TopicPublish,
  TopicSubscribe,
  SubscribeCallOptions,
  CacheNotFoundError,
} from '@gomomento/sdk-core';
import {
  expectWithMessage,
  ItBehavesLikeItValidatesCacheName,
  ItBehavesLikeItValidatesTopicName,
  testTopicName,
  uint8ArrayForTest,
  ValidateCacheProps,
  ValidateTopicProps,
} from '../common-int-test-utils';
import {TextEncoder} from 'util';
import {sleep} from '@gomomento/sdk-core/dist/src/internal/utils';
import {
  ICacheClient,
  ITopicClient,
} from '@gomomento/sdk-core/dist/src/internal/clients';
import {IResponseError} from '@gomomento/sdk-core/dist/src/messages/responses/response-base';

const STREAM_WAIT_TIME_MS = 2000;

// TODO: Uncomment when Configuration is plumbed through
// describe('topic client constructor', () => {
//   ItBehavesLikeItValidatesRequestTimeout(0);
//   ItBehavesLikeItValidatesRequestTimeout(-1);
// });

export function runTopicClientTests(
  topicClient: ITopicClient,
  topicClientWithThrowOnErrors: ITopicClient,
  cacheClient: ICacheClient,
  integrationTestCacheName: string
) {
  describe('#publish', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return topicClient.publish(props.cacheName, 'topic', 'value');
    });

    ItBehavesLikeItValidatesTopicName((props: ValidateTopicProps) => {
      return topicClient.publish('cache', props.topicName, 'value');
    });

    it('should error when publishing to a cache that does not exist', async () => {
      const response = await topicClient.publish(v4(), 'topic', 'value');
      expectWithMessage(() => {
        expect((response as IResponseError).errorCode()).toEqual(
          MomentoErrorCode.CACHE_NOT_FOUND_ERROR
        );
      }, `expected NOT_FOUND_ERROR but got ${response.toString()}`);
      expect((response as IResponseError).message()).toContain(
        'A cache with the specified name does not exist.'
      );
    });

    it('should not error when publishing to a topic that does not exist', async () => {
      const response = await topicClient.publish(
        integrationTestCacheName,
        v4(),
        'value'
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(TopicPublish.Success);
      }, `expected SUCCESS but got ${response.toString()}`);
    });
  });

  describe('#subscribe', () => {
    const trivialHandlers: SubscribeCallOptions = {
      onError: () => {
        return;
      },
      onItem: () => {
        return;
      },
    };

    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return topicClient.subscribe(props.cacheName, 'topic', trivialHandlers);
    });

    ItBehavesLikeItValidatesTopicName((props: ValidateTopicProps) => {
      return topicClient.subscribe('cache', props.topicName, trivialHandlers);
    });

    it('should error when subscribing to a cache that does not exist and unsubscribe from the error handler', async () => {
      const response = await topicClient.subscribe(
        v4(),
        'topic',
        trivialHandlers
      );
      expectWithMessage(() => {
        expect((response as IResponseError).errorCode()).toEqual(
          MomentoErrorCode.CACHE_NOT_FOUND_ERROR
        );
      }, `expected NOT_FOUND_ERROR but got ${response.toString()}`);
    });
  });

  describe('subscribe and publish', () => {
    it('should publish strings and bytes and receive them on a subscription', async () => {
      const topicName = testTopicName();
      const publishedValues = [
        'value1',
        'value2',
        new TextEncoder().encode('value3'),
      ];
      const expectedValues = ['value1', 'value2', uint8ArrayForTest('value3')];
      const receivedValues: (string | Uint8Array)[] = [];

      let done = false;
      const subscribeResponse = await topicClient.subscribe(
        integrationTestCacheName,
        topicName,
        {
          onItem: (item: TopicItem) => {
            receivedValues.push(item.value());
          },
          onError: (error: TopicSubscribe.Error) => {
            if (!done) {
              expect(1).fail(
                `Should not receive an error but got one: ${error.message()}`
              );
            }
          },
        }
      );
      expectWithMessage(() => {
        expect(subscribeResponse).toBeInstanceOf(TopicSubscribe.Subscription);
      }, `expected SUBSCRIPTION but got ${subscribeResponse.toString()}`);

      // Wait for stream to start.
      await sleep(STREAM_WAIT_TIME_MS);

      for (const value of publishedValues) {
        const publishResponse = await topicClient.publish(
          integrationTestCacheName,
          topicName,
          value
        );
        expectWithMessage(() => {
          expect(publishResponse).toBeInstanceOf(TopicPublish.Success);
        }, `expected SUCCESS but got ${publishResponse.toString()}`);
      }

      // Wait for values to be received.
      await sleep(STREAM_WAIT_TIME_MS);

      expect(receivedValues).toEqual(expectedValues);
      done = true;

      // Need to close the stream before the test ends or else the test will hang.
      (subscribeResponse as TopicSubscribe.Subscription).unsubscribe();
    });

    it('should not receive messages when unsubscribed', async () => {
      const topicName = testTopicName();
      const publishedValue = 'value';
      const receivedValues: (string | Uint8Array)[] = [];

      let done = false;
      const subscribeResponse = await topicClient.subscribe(
        integrationTestCacheName,
        topicName,
        {
          onItem: (item: TopicItem) => {
            receivedValues.push(item.value());
          },
          onError: (error: TopicSubscribe.Error) => {
            if (!done) {
              expect(1).fail(
                `Should not receive an error but got one: ${error.message()}`
              );
            }
          },
        }
      );
      expectWithMessage(() => {
        expect(subscribeResponse).toBeInstanceOf(TopicSubscribe.Subscription);
      }, `expected SUBSCRIPTION but got ${subscribeResponse.toString()}`);

      // Wait for stream to start.
      await sleep(STREAM_WAIT_TIME_MS);
      // Unsubscribing before data is published should not receive any data.
      (subscribeResponse as TopicSubscribe.Subscription).unsubscribe();

      const publishResponse = await topicClient.publish(
        integrationTestCacheName,
        topicName,
        publishedValue
      );
      expect(publishResponse).toBeInstanceOf(TopicPublish.Success);

      // Wait for values to go over the network.
      await sleep(STREAM_WAIT_TIME_MS);

      expect(receivedValues).toEqual([]);
      done = true;

      // Need to close the stream before the test ends or else the test will hang.
      (subscribeResponse as TopicSubscribe.Subscription).unsubscribe();
    });

    it('should subscribe with default handlers', async () => {
      const topicName = testTopicName();

      const subscribeResponse = await topicClient.subscribe(
        integrationTestCacheName,
        topicName,
        {
          onItem: () => {
            return;
          },
        }
      );
      expectWithMessage(() => {
        expect(subscribeResponse).toBeInstanceOf(TopicSubscribe.Subscription);
      }, `expected SUBSCRIPTION but get ${subscribeResponse.toString()}`);
      (subscribeResponse as TopicSubscribe.Subscription).unsubscribe();
    });

    it('should unsubscribe automatically if the cache is deleted mid-subscription', async () => {
      const randomCacheName = v4();
      const createCacheResponse = await cacheClient.createCache(
        randomCacheName
      );
      let subscribeResponse: TopicSubscribe.Response | undefined;

      try {
        expect(createCacheResponse).toBeInstanceOf(CreateCache.Success);

        const subscribeResponse = await topicClient.subscribe(
          randomCacheName,
          v4(),
          {
            onItem: (item: TopicItem) => {
              expect(1).fail(
                `Should not receive an item but got one: ${item.toString()}`
              );
            },
            onError: (
              error: TopicSubscribe.Error,
              subscription: TopicSubscribe.Subscription
            ) => {
              expect(error.errorCode()).toEqual(
                MomentoErrorCode.CACHE_NOT_FOUND_ERROR
              );
              expect(subscription.isSubscribed).toBeFalse();
            },
          }
        );
        expectWithMessage(() => {
          expect(subscribeResponse).toBeInstanceOf(TopicSubscribe.Subscription);
        }, `expected SUBSCRIPTION but got ${subscribeResponse.toString()}`);

        // Wait for stream to start.
        await sleep(STREAM_WAIT_TIME_MS);

        // Pull the rug out from under the subscription.
        const deleteCacheResponse = await cacheClient.deleteCache(
          randomCacheName
        );
        expect(deleteCacheResponse).toBeInstanceOf(DeleteCache.Success);

        // Wait for the subscription error handler to run.
        await sleep(STREAM_WAIT_TIME_MS);
      } finally {
        // Just in case
        const deleteCacheResponse = await cacheClient.deleteCache(
          randomCacheName
        );
        if (deleteCacheResponse instanceof DeleteCache.Error) {
          expect(deleteCacheResponse.errorCode()).toBe(
            MomentoErrorCode.NOT_FOUND_ERROR
          );
        }

        // Just in case
        if (
          subscribeResponse !== undefined &&
          subscribeResponse instanceof TopicSubscribe.Subscription
        ) {
          subscribeResponse.unsubscribe();
        }
      }
    });
  });

  describe('when client is configured to throw on errors', () => {
    it('should throw when publishing to a cache that does not exist', async () => {
      await expect(async () => {
        await topicClientWithThrowOnErrors.publish(v4(), 'topic', 'value');
      }).rejects.toThrow(CacheNotFoundError);
    });
  });
}

// happy path tests using topic client with v2 api key
export function runTopicClientTestsWithApiKeyV2(
  topicClient: ITopicClient,
  integrationTestCacheName: string
) {
  describe('#publish', () => {
    it('should not error when publishing to a topic that does not exist', async () => {
      const response = await topicClient.publish(
        integrationTestCacheName,
        v4(),
        'value'
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(TopicPublish.Success);
      }, `expected SUCCESS but got ${response.toString()}`);
    });
  });

  describe('subscribe and publish', () => {
    it('should publish strings and bytes and receive them on a subscription', async () => {
      const topicName = testTopicName();
      const publishedValues = [
        'value1',
        'value2',
        new TextEncoder().encode('value3'),
      ];
      const expectedValues = ['value1', 'value2', uint8ArrayForTest('value3')];
      const receivedValues: (string | Uint8Array)[] = [];

      let done = false;
      const subscribeResponse = await topicClient.subscribe(
        integrationTestCacheName,
        topicName,
        {
          onItem: (item: TopicItem) => {
            receivedValues.push(item.value());
          },
          onError: (error: TopicSubscribe.Error) => {
            if (!done) {
              expect(1).fail(
                `Should not receive an error but got one: ${error.message()}`
              );
            }
          },
        }
      );
      expectWithMessage(() => {
        expect(subscribeResponse).toBeInstanceOf(TopicSubscribe.Subscription);
      }, `expected SUBSCRIPTION but got ${subscribeResponse.toString()}`);

      // Wait for stream to start.
      await sleep(STREAM_WAIT_TIME_MS);

      for (const value of publishedValues) {
        const publishResponse = await topicClient.publish(
          integrationTestCacheName,
          topicName,
          value
        );
        expectWithMessage(() => {
          expect(publishResponse).toBeInstanceOf(TopicPublish.Success);
        }, `expected SUCCESS but got ${publishResponse.toString()}`);
      }

      // Wait for values to be received.
      await sleep(STREAM_WAIT_TIME_MS);

      expect(receivedValues).toEqual(expectedValues);
      done = true;

      // Need to close the stream before the test ends or else the test will hang.
      (subscribeResponse as TopicSubscribe.Subscription).unsubscribe();
    });
  });
}
