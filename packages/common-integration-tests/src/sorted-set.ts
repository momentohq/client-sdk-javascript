import {v4} from 'uuid';
import {
  CacheDelete,
  CacheSortedSetFetch,
  CacheSortedSetGetRank,
  CacheSortedSetGetScore,
  CacheSortedSetGetScores,
  CacheSortedSetIncrementScore,
  CacheSortedSetPutElement,
  CacheSortedSetPutElements,
  CacheSortedSetRemoveElement,
  CacheSortedSetRemoveElements,
  CacheSortedSetLength,
  CacheSortedSetLengthByScore,
  CollectionTtl,
  MomentoErrorCode,
  SortedSetOrder,
} from '@gomomento/sdk-core';
import {
  expectWithMessage,
  ItBehavesLikeItValidatesCacheName,
  uint8ArrayForTest,
  ValidateCacheProps,
  ValidateSortedSetChangerProps,
  ValidateSortedSetProps,
} from './common-int-test-utils';
import {
  IResponseError,
  IResponseMiss,
  IResponseSuccess,
  ResponseBase,
} from '@gomomento/sdk-core/dist/src/messages/responses/response-base';
import {sleep} from '@gomomento/sdk-core/dist/src/internal/utils';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/internal/clients';

export function runSortedSetTests(
  Momento: ICacheClient,
  IntegrationTestCacheName: string
) {
  describe('Integration tests for sorted set operations', () => {
    it('is good at logic', async () => {
      await new Promise(r => setTimeout(r, 1));
      expect(true).toBeTrue();
    });

    const itBehavesLikeItValidates = (
      responder: (props: ValidateSortedSetProps) => Promise<ResponseBase>
    ) => {
      ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
        return responder({
          cacheName: props.cacheName,
          sortedSetName: v4(),
          value: v4(),
        });
      });

      it('validates its sorted set name', async () => {
        const response = await responder({
          cacheName: IntegrationTestCacheName,
          sortedSetName: '  ',
          value: v4(),
        });

        expect((response as IResponseError).errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      });
    };

    const itBehavesLikeItMissesWhenSortedSetDoesNotExist = (
      responder: (props: ValidateSortedSetProps) => Promise<ResponseBase>
    ) => {
      it('misses when the sorted set does not exist', async () => {
        const response = await responder({
          cacheName: IntegrationTestCacheName,
          sortedSetName: v4(),
          value: v4(),
        });

        expect((response as IResponseMiss).is_miss).toBeTrue();
      });
    };

    const itBehavesLikeItHasACollectionTtl = (
      changeResponder: (
        props: ValidateSortedSetChangerProps
      ) => Promise<ResponseBase>
    ) => {
      it('does not refresh with no refresh ttl', async () => {
        const sortedSetName = v4();
        const value = v4();
        const timeout = 1;

        let changeResponse = await changeResponder({
          cacheName: IntegrationTestCacheName,
          sortedSetName: sortedSetName,
          value: value,
          score: 42,
          ttl: CollectionTtl.of(timeout).withNoRefreshTtlOnUpdates(),
        });
        expect((changeResponse as IResponseSuccess).is_success).toBeTrue();

        changeResponse = await changeResponder({
          cacheName: IntegrationTestCacheName,
          sortedSetName: sortedSetName,
          value: value,
          score: 42,
          ttl: CollectionTtl.of(timeout * 10).withNoRefreshTtlOnUpdates(),
        });
        expect((changeResponse as IResponseSuccess).is_success).toBeTrue();
        await sleep(timeout * 1000);

        const getResponse = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheSortedSetFetch.Miss);
        }, `expected MISS but got ${getResponse.toString()}`);
      });

      it('refreshes with refresh ttl', async () => {
        const sortedSetName = v4();
        const value = v4();
        const timeout = 1;

        let changeResponse = await changeResponder({
          cacheName: IntegrationTestCacheName,
          sortedSetName: sortedSetName,
          value: value,
          score: 42,
          ttl: CollectionTtl.of(timeout).withRefreshTtlOnUpdates(),
        });
        expect((changeResponse as IResponseSuccess).is_success).toBeTrue();

        changeResponse = await changeResponder({
          cacheName: IntegrationTestCacheName,
          sortedSetName: sortedSetName,
          value: value,
          score: 42,
          ttl: CollectionTtl.of(timeout * 10).withRefreshTtlOnUpdates(),
        });
        expect((changeResponse as IResponseSuccess).is_success).toBeTrue();
        await sleep(timeout * 1000);

        const getResponse = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
      });
    };

    describe('#sortedSetFetchByRank', () => {
      const responder = (props: ValidateSortedSetProps) => {
        return Momento.sortedSetFetchByRank(
          props.cacheName,
          props.sortedSetName
        );
      };

      itBehavesLikeItValidates(responder);
      itBehavesLikeItMissesWhenSortedSetDoesNotExist(responder);

      it('should return expected toString value with sortedSetFetch', async () => {
        const sortedSetName = v4();
        await Momento.sortedSetPutElement(
          IntegrationTestCacheName,
          sortedSetName,
          'a',
          42
        );
        const response = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        expect((response as CacheSortedSetFetch.Hit).toString()).toEqual(
          'Hit: valueArrayStringElements: a: 42'
        );
      });

      it('should provide value accessors for string and byte elements', async () => {
        const sortedSetName = v4();
        const field1 = 'foo';
        const score1 = 90210;
        const field2 = 'bar';
        const score2 = 42;

        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          new Map([
            [field1, score1],
            [field2, score2],
          ])
        );

        const response = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        const hitResponse = response as CacheSortedSetFetch.Hit;

        const expectedStringElements = [
          {value: 'bar', score: 42},
          {value: 'foo', score: 90210},
        ];

        const expectedUint8Elements = [
          {value: uint8ArrayForTest('bar'), score: 42},
          {value: uint8ArrayForTest('foo'), score: 90210},
        ];

        expect(hitResponse.valueArrayStringElements()).toEqual(
          expectedStringElements
        );
        expect(hitResponse.valueArrayUint8Elements()).toEqual(
          expectedUint8Elements
        );
        expect(hitResponse.valueArray()).toEqual(expectedStringElements);
      });

      describe('when fetching with ranges and order', () => {
        const sortedSetName = v4();

        beforeAll(done => {
          const setupPromise = Momento.sortedSetPutElements(
            IntegrationTestCacheName,
            sortedSetName,
            {
              bam: 1000,
              foo: 1,
              taco: 90210,
              bar: 2,
              burrito: 9000,
              baz: 42,
              habanero: 68,
              jalapeno: 1_000_000,
            }
          );
          setupPromise
            .then(() => {
              done();
            })
            .catch(e => {
              throw e;
            });
        });

        it('should fetch only the specified range if start rank is specified', async () => {
          const response = await Momento.sortedSetFetchByRank(
            IntegrationTestCacheName,
            sortedSetName,
            {
              startRank: 4,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'bam', score: 1000},
            {value: 'burrito', score: 9000},
            {value: 'taco', score: 90210},
            {value: 'jalapeno', score: 1_000_000},
          ]);
        });

        it('should fetch only the specified range if end rank is specified', async () => {
          const response = await Momento.sortedSetFetchByRank(
            IntegrationTestCacheName,
            sortedSetName,
            {
              endRank: 3,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'foo', score: 1},
            {value: 'bar', score: 2},
            {value: 'baz', score: 42},
          ]);
        });

        it('should fetch only the specified range if both start and end rank are specified', async () => {
          const response = await Momento.sortedSetFetchByRank(
            IntegrationTestCacheName,
            sortedSetName,
            {
              startRank: 1,
              endRank: 5,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'bar', score: 2},
            {value: 'baz', score: 42},
            {value: 'habanero', score: 68},
            {value: 'bam', score: 1000},
          ]);
        });

        it('should return an empty list if start rank is out of bounds', async () => {
          const response = await Momento.sortedSetFetchByRank(
            IntegrationTestCacheName,
            sortedSetName,
            {
              startRank: 10,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([]);
        });

        it('should return all the remaining elements if end rank is out of bounds', async () => {
          const response = await Momento.sortedSetFetchByRank(
            IntegrationTestCacheName,
            sortedSetName,
            {
              startRank: 5,
              endRank: 100,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'burrito', score: 9000},
            {value: 'taco', score: 90210},
            {value: 'jalapeno', score: 1_000_000},
          ]);
        });

        it('should return the last elements if start rank is negative', async () => {
          const response = await Momento.sortedSetFetchByRank(
            IntegrationTestCacheName,
            sortedSetName,
            {
              startRank: -5,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'habanero', score: 68},
            {value: 'bam', score: 1000},
            {value: 'burrito', score: 9000},
            {value: 'taco', score: 90210},
            {value: 'jalapeno', score: 1_000_000},
          ]);
        });

        it('should return all but the last elements if end rank is negative', async () => {
          const response = await Momento.sortedSetFetchByRank(
            IntegrationTestCacheName,
            sortedSetName,
            {
              endRank: -2,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'foo', score: 1},
            {value: 'bar', score: 2},
            {value: 'baz', score: 42},
            {value: 'habanero', score: 68},
            {value: 'bam', score: 1000},
            {value: 'burrito', score: 9000},
          ]);
        });

        it('should return a range from the end of the set if both start and end rank are negative', async () => {
          const response = await Momento.sortedSetFetchByRank(
            IntegrationTestCacheName,
            sortedSetName,
            {
              startRank: -5,
              endRank: -2,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'habanero', score: 68},
            {value: 'bam', score: 1000},
            {value: 'burrito', score: 9000},
          ]);
        });

        it('should fetch in ascending order if order is explicitly specified', async () => {
          const response = await Momento.sortedSetFetchByRank(
            IntegrationTestCacheName,
            sortedSetName,
            {
              order: SortedSetOrder.Ascending,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'foo', score: 1},
            {value: 'bar', score: 2},
            {value: 'baz', score: 42},
            {value: 'habanero', score: 68},
            {value: 'bam', score: 1000},
            {value: 'burrito', score: 9000},
            {value: 'taco', score: 90210},
            {value: 'jalapeno', score: 1_000_000},
          ]);
        });

        it('should fetch in descending order if specified', async () => {
          const response = await Momento.sortedSetFetchByRank(
            IntegrationTestCacheName,
            sortedSetName,
            {
              order: SortedSetOrder.Descending,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'jalapeno', score: 1_000_000},
            {value: 'taco', score: 90210},
            {value: 'burrito', score: 9000},
            {value: 'bam', score: 1000},
            {value: 'habanero', score: 68},
            {value: 'baz', score: 42},
            {value: 'bar', score: 2},
            {value: 'foo', score: 1},
          ]);
        });

        it('should support descending order with a start rank', async () => {
          const response = await Momento.sortedSetFetchByRank(
            IntegrationTestCacheName,
            sortedSetName,
            {
              order: SortedSetOrder.Descending,
              startRank: 5,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'baz', score: 42},
            {value: 'bar', score: 2},
            {value: 'foo', score: 1},
          ]);
        });

        it('should support descending order with a end rank', async () => {
          const response = await Momento.sortedSetFetchByRank(
            IntegrationTestCacheName,
            sortedSetName,
            {
              order: SortedSetOrder.Descending,
              endRank: 3,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'jalapeno', score: 1_000_000},
            {value: 'taco', score: 90210},
            {value: 'burrito', score: 9000},
          ]);
        });

        it('should support descending order with a start and end rank', async () => {
          const response = await Momento.sortedSetFetchByRank(
            IntegrationTestCacheName,
            sortedSetName,
            {
              order: SortedSetOrder.Descending,
              startRank: 3,
              endRank: 5,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'bam', score: 1000},
            {value: 'habanero', score: 68},
          ]);
        });

        it('should error if start rank is greater than end rank', async () => {
          const response = await Momento.sortedSetFetchByRank(
            IntegrationTestCacheName,
            sortedSetName,
            {
              order: SortedSetOrder.Descending,
              startRank: 5,
              endRank: 3,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Error);
          }, `expected ERROR but got ${response.toString()}`);
          const errorResponse = response as CacheSortedSetFetch.Error;
          expect(errorResponse.errorCode()).toEqual(
            MomentoErrorCode.INVALID_ARGUMENT_ERROR
          );
          expect(errorResponse.message()).toEqual(
            'Invalid argument passed to Momento client: start rank must be less than end rank'
          );
          expect(errorResponse.toString()).toEqual(
            'Invalid argument passed to Momento client: start rank must be less than end rank'
          );
        });

        it('should error if negative start rank is less than negative end rank', async () => {
          const response = await Momento.sortedSetFetchByRank(
            IntegrationTestCacheName,
            sortedSetName,
            {
              order: SortedSetOrder.Descending,
              startRank: -3,
              endRank: -5,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Error);
          }, `expected ERROR but got ${response.toString()}`);
          const errorResponse = response as CacheSortedSetFetch.Error;
          expect(errorResponse.errorCode()).toEqual(
            MomentoErrorCode.INVALID_ARGUMENT_ERROR
          );
          expect(errorResponse.message()).toEqual(
            'Invalid argument passed to Momento client: negative start rank must be less than negative end rank'
          );
          expect(errorResponse.toString()).toEqual(
            'Invalid argument passed to Momento client: negative start rank must be less than negative end rank'
          );
        });
      });

      it('should return a miss if the sorted set does not exist', async () => {
        const sortedSetName = v4();
        let fetchResponse = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSortedSetFetch.Miss);
        }, `expected MISS but got ${fetchResponse.toString()}`);

        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          new Map([
            [v4(), 1],
            [v4(), 2],
            [v4(), 3],
          ])
        );

        fetchResponse = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${fetchResponse.toString()}`);

        const deleteResponse = await Momento.delete(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(deleteResponse).toBeInstanceOf(CacheDelete.Success);
        }, `expected SUCCESS but got ${deleteResponse.toString()}`);

        fetchResponse = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSortedSetFetch.Miss);
        }, `expected MISS but got ${fetchResponse.toString()}`);
      });

      it('should support happy path for fetchByRank via curried cache via ICache interface', async () => {
        const sortedSetName = v4();

        const cache = Momento.cache(IntegrationTestCacheName);

        await cache.sortedSetPutElements(sortedSetName, {
          bam: 1000,
          foo: 1,
          taco: 90210,
          bar: 2,
          burrito: 9000,
          baz: 42,
          habanero: 68,
          jalapeno: 1_000_000,
        });

        const response = await cache.sortedSetFetchByRank(sortedSetName, {
          startRank: 1,
          endRank: 5,
        });

        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        const hitResponse = response as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArray()).toEqual([
          {value: 'bar', score: 2},
          {value: 'baz', score: 42},
          {value: 'habanero', score: 68},
          {value: 'bam', score: 1000},
        ]);
      });

      it('should support accessing value for a sortedSetFetchByRank Hit without instanceof check', async () => {
        const sortedSetName = v4();

        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          {
            bam: 1000,
            foo: 1,
            taco: 90210,
            bar: 2,
            burrito: 9000,
            baz: 42,
            habanero: 68,
            jalapeno: 1_000_000,
          }
        );

        let fetchResponse = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName,
          {
            startRank: 1,
            endRank: 5,
          }
        );

        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${fetchResponse.toString()}`);

        const expectedResult = [
          {value: 'bar', score: 2},
          {value: 'baz', score: 42},
          {value: 'habanero', score: 68},
          {value: 'bam', score: 1000},
        ];

        expect(fetchResponse.value()).toEqual(expectedResult);

        const hitResponse = fetchResponse as CacheSortedSetFetch.Hit;
        expect(hitResponse.value()).toEqual(expectedResult);
        expect(hitResponse.valueArray()).toEqual(expectedResult);

        fetchResponse = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          v4()
        );

        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSortedSetFetch.Miss);
        }, `expected MISS but got ${fetchResponse.toString()}`);
        expect(fetchResponse.value()).toEqual(undefined);
      });
    });

    describe('#sortedSetFetchByScore', () => {
      const responder = (props: ValidateSortedSetProps) => {
        return Momento.sortedSetFetchByScore(
          props.cacheName,
          props.sortedSetName
        );
      };

      itBehavesLikeItValidates(responder);
      itBehavesLikeItMissesWhenSortedSetDoesNotExist(responder);

      it('should return expected toString value', async () => {
        const sortedSetName = v4();
        await Momento.sortedSetPutElement(
          IntegrationTestCacheName,
          sortedSetName,
          'a',
          42
        );
        const response = await Momento.sortedSetFetchByScore(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        expect((response as CacheSortedSetFetch.Hit).toString()).toEqual(
          'Hit: valueArrayStringElements: a: 42'
        );
      });

      it('should provide value accessors for string and byte elements', async () => {
        const sortedSetName = v4();
        const field1 = 'foo';
        const score1 = 90210;
        const field2 = 'bar';
        const score2 = 42;

        const putResponse = await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          new Map([
            [field1, score1],
            [field2, score2],
          ])
        );
        expectWithMessage(() => {
          expect(putResponse).toBeInstanceOf(CacheSortedSetPutElements.Success);
        }, `expected SUCCESS but got ${putResponse.toString()}`);

        const response = await Momento.sortedSetFetchByScore(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        const hitResponse = response as CacheSortedSetFetch.Hit;

        const expectedStringElements = [
          {value: 'bar', score: 42},
          {value: 'foo', score: 90210},
        ];

        const expectedUint8Elements = [
          {value: uint8ArrayForTest('bar'), score: 42},
          {value: uint8ArrayForTest('foo'), score: 90210},
        ];

        expect(hitResponse.valueArrayStringElements()).toEqual(
          expectedStringElements
        );
        expect(hitResponse.valueArrayUint8Elements()).toEqual(
          expectedUint8Elements
        );
        expect(hitResponse.valueArray()).toEqual(expectedStringElements);
      });

      describe('when fetching with minScore, maxScore, ranges and order', () => {
        const sortedSetName = v4();

        beforeAll(done => {
          const setupPromise = Momento.sortedSetPutElements(
            IntegrationTestCacheName,
            sortedSetName,
            {
              bam: 1000,
              foo: 1,
              taco: 90210,
              bar: 2,
              burrito: 9000,
              baz: 42,
              habanero: 68,
              jalapeno: 1_000_000,
            }
          );
          setupPromise
            .then(() => {
              done();
            })
            .catch(e => {
              throw e;
            });
        });

        it('should fetch only the matching elements if minScore is specified', async () => {
          const response = await Momento.sortedSetFetchByScore(
            IntegrationTestCacheName,
            sortedSetName,
            {
              minScore: 100,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'bam', score: 1000},
            {value: 'burrito', score: 9000},
            {value: 'taco', score: 90210},
            {value: 'jalapeno', score: 1_000_000},
          ]);
        });

        it('should fetch only the matching elements if maxScore is specified', async () => {
          const response = await Momento.sortedSetFetchByScore(
            IntegrationTestCacheName,
            sortedSetName,
            {
              maxScore: 1000,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'foo', score: 1},
            {value: 'bar', score: 2},
            {value: 'baz', score: 42},
            {value: 'habanero', score: 68},
            {value: 'bam', score: 1000},
          ]);
        });

        it('should fetch only the matching elements if minScore and maxScore are specified', async () => {
          const response = await Momento.sortedSetFetchByScore(
            IntegrationTestCacheName,
            sortedSetName,
            {
              minScore: 100,
              maxScore: 10_000,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'bam', score: 1000},
            {value: 'burrito', score: 9000},
          ]);
        });

        it('should fetch an empty list if minScore is out of range', async () => {
          const response = await Momento.sortedSetFetchByScore(
            IntegrationTestCacheName,
            sortedSetName,
            {
              minScore: 2_000_000,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([]);
        });

        it('should fetch an empty list if maxScore is out of range', async () => {
          const response = await Momento.sortedSetFetchByScore(
            IntegrationTestCacheName,
            sortedSetName,
            {
              maxScore: 0,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([]);
        });

        it('should fetch the whole set if minScore is less than the minimum score', async () => {
          const response = await Momento.sortedSetFetchByScore(
            IntegrationTestCacheName,
            sortedSetName,
            {
              minScore: 0,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'foo', score: 1},
            {value: 'bar', score: 2},
            {value: 'baz', score: 42},
            {value: 'habanero', score: 68},
            {value: 'bam', score: 1000},
            {value: 'burrito', score: 9000},
            {value: 'taco', score: 90210},
            {value: 'jalapeno', score: 1_000_000},
          ]);
        });

        it('should fetch the whole set if maxScore is greater than the maximum score', async () => {
          const response = await Momento.sortedSetFetchByScore(
            IntegrationTestCacheName,
            sortedSetName,
            {
              maxScore: 2_000_000,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'foo', score: 1},
            {value: 'bar', score: 2},
            {value: 'baz', score: 42},
            {value: 'habanero', score: 68},
            {value: 'bam', score: 1000},
            {value: 'burrito', score: 9000},
            {value: 'taco', score: 90210},
            {value: 'jalapeno', score: 1_000_000},
          ]);
        });

        it('should error if minScore is greater than maxScore', async () => {
          const response = await Momento.sortedSetFetchByScore(
            IntegrationTestCacheName,
            sortedSetName,
            {
              minScore: 1_000,
              maxScore: 100,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Error);
          }, `expected ERROR but got ${response.toString()}`);
          const errorResponse = response as CacheSortedSetFetch.Error;
          expect(errorResponse.errorCode()).toEqual(
            MomentoErrorCode.INVALID_ARGUMENT_ERROR
          );
          expect(errorResponse.message()).toEqual(
            'Invalid argument passed to Momento client: minScore must be less than or equal to maxScore'
          );
          expect(errorResponse.toString()).toEqual(
            'Invalid argument passed to Momento client: minScore must be less than or equal to maxScore'
          );
        });

        it('should fetch starting from the offset if specified', async () => {
          const response = await Momento.sortedSetFetchByScore(
            IntegrationTestCacheName,
            sortedSetName,
            {
              minScore: 100,
              offset: 2,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'taco', score: 90210},
            {value: 'jalapeno', score: 1_000_000},
          ]);
        });

        it('should fetch the specified number of results if count is specified', async () => {
          const response = await Momento.sortedSetFetchByScore(
            IntegrationTestCacheName,
            sortedSetName,
            {
              minScore: 100,
              count: 2,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'bam', score: 1000},
            {value: 'burrito', score: 9000},
          ]);
        });

        it('should fetch the specified number of results from the offset if both count and offset are specified', async () => {
          const response = await Momento.sortedSetFetchByScore(
            IntegrationTestCacheName,
            sortedSetName,
            {
              minScore: 10,
              offset: 2,
              count: 3,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'bam', score: 1000},
            {value: 'burrito', score: 9000},
            {value: 'taco', score: 90210},
          ]);
        });

        it('should return an empty list if offset is greater than the size of the results', async () => {
          const response = await Momento.sortedSetFetchByScore(
            IntegrationTestCacheName,
            sortedSetName,
            {
              minScore: 100,
              offset: 5,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([]);
        });

        it('should return all remaining results if count is greater than the number of available results', async () => {
          const response = await Momento.sortedSetFetchByScore(
            IntegrationTestCacheName,
            sortedSetName,
            {
              minScore: 100,
              count: 100,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'bam', score: 1000},
            {value: 'burrito', score: 9000},
            {value: 'taco', score: 90210},
            {value: 'jalapeno', score: 1_000_000},
          ]);
        });

        it('should error if count is negative', async () => {
          const response = await Momento.sortedSetFetchByScore(
            IntegrationTestCacheName,
            sortedSetName,
            {
              minScore: 100,
              count: -2,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Error);
          }, `expected ERROR but got ${response.toString()}`);
          const errorResponse = response as CacheSortedSetFetch.Error;
          expect(errorResponse.errorCode()).toEqual(
            MomentoErrorCode.INVALID_ARGUMENT_ERROR
          );
          expect(errorResponse.message()).toEqual(
            'Invalid argument passed to Momento client: count must be strictly positive (> 0)'
          );
          expect(errorResponse.toString()).toEqual(
            'Invalid argument passed to Momento client: count must be strictly positive (> 0)'
          );
        });

        it('should error if offset is negative', async () => {
          const response = await Momento.sortedSetFetchByScore(
            IntegrationTestCacheName,
            sortedSetName,
            {
              minScore: 100,
              offset: -2,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Error);
          }, `expected ERROR but got ${response.toString()}`);
          const errorResponse = response as CacheSortedSetFetch.Error;
          expect(errorResponse.errorCode()).toEqual(
            MomentoErrorCode.INVALID_ARGUMENT_ERROR
          );
          expect(errorResponse.message()).toEqual(
            'Invalid argument passed to Momento client: offset must be non-negative (>= 0)'
          );
          expect(errorResponse.toString()).toEqual(
            'Invalid argument passed to Momento client: offset must be non-negative (>= 0)'
          );
        });

        it('should return results in ascending order if order is explicitly set to ascending', async () => {
          const response = await Momento.sortedSetFetchByScore(
            IntegrationTestCacheName,
            sortedSetName,
            {
              order: SortedSetOrder.Ascending,
              minScore: 100,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'bam', score: 1000},
            {value: 'burrito', score: 9000},
            {value: 'taco', score: 90210},
            {value: 'jalapeno', score: 1_000_000},
          ]);
        });

        it('should return results in descending order if order is set to descending', async () => {
          const response = await Momento.sortedSetFetchByScore(
            IntegrationTestCacheName,
            sortedSetName,
            {
              order: SortedSetOrder.Descending,
              minScore: 100,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'jalapeno', score: 1_000_000},
            {value: 'taco', score: 90210},
            {value: 'burrito', score: 9000},
            {value: 'bam', score: 1000},
          ]);
        });

        it('should support offset and count when returning results in descending order', async () => {
          const response = await Momento.sortedSetFetchByScore(
            IntegrationTestCacheName,
            sortedSetName,
            {
              order: SortedSetOrder.Descending,
              minScore: 20,
              maxScore: 100_000,
              offset: 2,
              count: 2,
            }
          );

          expectWithMessage(() => {
            expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
          }, `expected HIT but got ${response.toString()}`);
          const hitResponse = response as CacheSortedSetFetch.Hit;
          expect(hitResponse.valueArray()).toEqual([
            {value: 'bam', score: 1000},
            {value: 'habanero', score: 68},
          ]);
        });
      });

      it('should return a miss if the sorted set does not exist', async () => {
        const sortedSetName = v4();
        let fetchResponse = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSortedSetFetch.Miss);
        }, `expected MISS but got ${fetchResponse.toString()}`);

        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          new Map([
            [v4(), 1],
            [v4(), 2],
            [v4(), 3],
          ])
        );

        fetchResponse = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${fetchResponse.toString()}`);

        const deleteResponse = await Momento.delete(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(deleteResponse).toBeInstanceOf(CacheDelete.Success);
        }, `expected SUCCESS but got ${deleteResponse.toString()}`);

        fetchResponse = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSortedSetFetch.Miss);
        }, `expected MISS but got ${fetchResponse.toString()}`);
      });

      it('should support happy path for fetchByScore via curried cache via ICache interface', async () => {
        const sortedSetName = v4();

        const cache = Momento.cache(IntegrationTestCacheName);

        await cache.sortedSetPutElements(sortedSetName, {
          bam: 1000,
          foo: 1,
          taco: 90210,
          bar: 2,
          burrito: 9000,
          baz: 42,
          habanero: 68,
          jalapeno: 1_000_000,
        });

        const response = await cache.sortedSetFetchByScore(sortedSetName, {
          minScore: 100,
          maxScore: 10_000,
        });

        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        const hitResponse = response as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArray()).toEqual([
          {value: 'bam', score: 1000},
          {value: 'burrito', score: 9000},
        ]);
      });

      it('should support accessing value for sortedSetFetchByScore Hit without instanceof check', async () => {
        const sortedSetName = v4();

        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          {
            bam: 1000,
            foo: 1,
            taco: 90210,
            bar: 2,
            burrito: 9000,
            baz: 42,
            habanero: 68,
            jalapeno: 1_000_000,
          }
        );

        let fetchResponse = await Momento.sortedSetFetchByScore(
          IntegrationTestCacheName,
          sortedSetName,
          {
            minScore: 100,
            maxScore: 10_000,
          }
        );

        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${fetchResponse.toString()}`);

        const expectedResult = [
          {value: 'bam', score: 1000},
          {value: 'burrito', score: 9000},
        ];

        expect(fetchResponse.value()).toEqual(expectedResult);

        const hitResponse = fetchResponse as CacheSortedSetFetch.Hit;
        expect(hitResponse.value()).toEqual(expectedResult);
        expect(hitResponse.valueArray()).toEqual(expectedResult);

        fetchResponse = await Momento.sortedSetFetchByScore(
          IntegrationTestCacheName,
          v4()
        );

        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSortedSetFetch.Miss);
        }, `expected MISS but got ${fetchResponse.toString()}`);
        expect(fetchResponse.value()).toEqual(undefined);
      });
    });

    describe('#sortedSetGetRank', () => {
      const responder = (props: ValidateSortedSetProps) => {
        return Momento.sortedSetGetRank(
          props.cacheName,
          props.sortedSetName,
          props.value
        );
      };

      itBehavesLikeItValidates(responder);
      itBehavesLikeItMissesWhenSortedSetDoesNotExist(responder);

      it('retrieves rank for a value that exists', async () => {
        const sortedSetName = v4();
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          {foo: 42, bar: 84, baz: 90210}
        );

        let result = await Momento.sortedSetGetRank(
          IntegrationTestCacheName,
          sortedSetName,
          'bar'
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetGetRank.Hit);
        }, `expected HIT but got ${result.toString()}`);
        let hitResult = result as CacheSortedSetGetRank.Hit;
        expect(hitResult.rank()).toEqual(1);

        result = await Momento.sortedSetGetRank(
          IntegrationTestCacheName,
          sortedSetName,
          'baz'
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetGetRank.Hit);
        }, `expected HIT but got ${result.toString()}`);
        hitResult = result as CacheSortedSetGetRank.Hit;
        expect(hitResult.rank()).toEqual(2);

        result = await Momento.sortedSetGetRank(
          IntegrationTestCacheName,
          sortedSetName,
          'foo'
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetGetRank.Hit);
        }, `expected HIT but got ${result.toString()}`);
        hitResult = result as CacheSortedSetGetRank.Hit;
        expect(hitResult.rank()).toEqual(0);
      });

      it('returns a miss for a value that does not exist', async () => {
        const sortedSetName = v4();
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          {foo: 42, bar: 84, baz: 90210}
        );

        const result = await Momento.sortedSetGetRank(
          IntegrationTestCacheName,
          sortedSetName,
          'taco'
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetGetRank.Miss);
        }, `expected MISS but got ${result.toString()}`);
      });

      it('should support happy path for sortedSetGetRank via curried cache via ICache interface', async () => {
        const sortedSetName = v4();
        const cache = Momento.cache(IntegrationTestCacheName);
        await cache.sortedSetPutElements(sortedSetName, {
          foo: 42,
          bar: 84,
          baz: 90210,
        });

        const result = await cache.sortedSetGetRank(sortedSetName, 'bar');
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetGetRank.Hit);
        }, `expected HIT but got ${result.toString()}`);
        const hitResult = result as CacheSortedSetGetRank.Hit;
        expect(hitResult.rank()).toEqual(1);
      });
    });

    describe('#sortedSetGetScore', () => {
      const responder = (props: ValidateSortedSetProps) => {
        return Momento.sortedSetGetScore(
          props.cacheName,
          props.sortedSetName,
          props.value
        );
      };

      itBehavesLikeItValidates(responder);
      itBehavesLikeItMissesWhenSortedSetDoesNotExist(responder);

      it('retrieves score for a value that exists', async () => {
        const sortedSetName = v4();
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          {foo: 42, bar: 84, baz: 90210}
        );

        let result = await Momento.sortedSetGetScore(
          IntegrationTestCacheName,
          sortedSetName,
          'bar'
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetGetScore.Hit);
        }, `expected HIT but got ${result.toString()}`);
        let hitResult = result as CacheSortedSetGetScore.Hit;
        expect(hitResult.score()).toEqual(84);

        result = await Momento.sortedSetGetScore(
          IntegrationTestCacheName,
          sortedSetName,
          'baz'
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetGetScore.Hit);
        }, `expected HIT but got ${result.toString()}`);
        hitResult = result as CacheSortedSetGetScore.Hit;
        expect(hitResult.score()).toEqual(90210);
      });

      it('returns a miss for a value that does not exist', async () => {
        const sortedSetName = v4();
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          {foo: 42, bar: 84, baz: 90210}
        );

        const result = await Momento.sortedSetGetScore(
          IntegrationTestCacheName,
          sortedSetName,
          'taco'
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetGetScore.Miss);
        }, `expected MISS but got ${result.toString()}`);
      });

      it('should support happy path for sortedSetGetScore via curried cache via ICache interface', async () => {
        const sortedSetName = v4();
        const cache = Momento.cache(IntegrationTestCacheName);
        await cache.sortedSetPutElements(sortedSetName, {
          foo: 42,
          bar: 84,
          baz: 90210,
        });

        const result = await cache.sortedSetGetScore(sortedSetName, 'bar');
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetGetScore.Hit);
        }, `expected HIT but got ${result.toString()}`);
        const hitResult = result as CacheSortedSetGetScore.Hit;
        expect(hitResult.score()).toEqual(84);
      });

      it('should support accessing value for CacheSortedSetGetScore.Hit without instanceof check', async () => {
        const sortedSetName = v4();
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          {
            foo: 42,
            bar: 84,
            baz: 90210,
          }
        );

        let getScoreResponse = await Momento.sortedSetGetScore(
          IntegrationTestCacheName,
          sortedSetName,
          'bar'
        );
        expectWithMessage(() => {
          expect(getScoreResponse).toBeInstanceOf(CacheSortedSetGetScore.Hit);
        }, `expected HIT but got ${getScoreResponse.toString()}`);

        expect(getScoreResponse.score()).toEqual(84);

        const hitResult = getScoreResponse as CacheSortedSetGetScore.Hit;
        expect(hitResult.score()).toEqual(84);

        getScoreResponse = await Momento.sortedSetGetScore(
          IntegrationTestCacheName,
          v4(),
          'bar'
        );

        expectWithMessage(() => {
          expect(getScoreResponse).toBeInstanceOf(CacheSortedSetGetScore.Miss);
        }, `expected MISS but got ${getScoreResponse.toString()}`);

        expect(getScoreResponse.score()).toEqual(undefined);
      });
    });

    describe('#sortedSetGetScores', () => {
      const responder = (props: ValidateSortedSetProps) => {
        return Momento.sortedSetGetScores(
          props.cacheName,
          props.sortedSetName,
          [props.value] as string[] | Uint8Array[]
        );
      };

      itBehavesLikeItValidates(responder);
      itBehavesLikeItMissesWhenSortedSetDoesNotExist(responder);

      it('retrieves scores for values that exist', async () => {
        const sortedSetName = v4();
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          {foo: 42, bar: 84, baz: 90210}
        );

        const result = await Momento.sortedSetGetScores(
          IntegrationTestCacheName,
          sortedSetName,
          ['bar', 'baz']
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetGetScores.Hit);
        }, `expected HIT but got ${result.toString()}`);
        const hitResult = result as CacheSortedSetGetScores.Hit;
        expect(hitResult.valueRecord()).toEqual({
          bar: 84,
          baz: 90210,
        });
      });

      it('returns partial record if some values do not exist', async () => {
        const sortedSetName = v4();
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          {foo: 42, bar: 84, baz: 90210}
        );

        const result = await Momento.sortedSetGetScores(
          IntegrationTestCacheName,
          sortedSetName,
          ['bar', 'taco']
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetGetScores.Hit);
        }, `expected HIT but got ${result.toString()}`);
        const hitResult = result as CacheSortedSetGetScores.Hit;
        expect(hitResult.valueRecord()).toEqual({
          bar: 84,
        });
      });

      it('should support happy path for sortedSetGetScores via curried cache via ICache interface', async () => {
        const sortedSetName = v4();
        const cache = Momento.cache(IntegrationTestCacheName);
        await cache.sortedSetPutElements(sortedSetName, {
          foo: 42,
          bar: 84,
          baz: 90210,
        });

        const result = await cache.sortedSetGetScores(sortedSetName, [
          'bar',
          'baz',
        ]);
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetGetScores.Hit);
        }, `expected HIT but got ${result.toString()}`);
        const hitResult = result as CacheSortedSetGetScores.Hit;
        expect(hitResult.valueRecord()).toEqual({bar: 84, baz: 90210});
      });

      it('should support accessing value for CacheSortedSetGetScores.Hit without instanceof check', async () => {
        const sortedSetName = v4();
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          {
            foo: 42,
            bar: 84,
            baz: 90210,
          }
        );

        let getScoresResponse = await Momento.sortedSetGetScores(
          IntegrationTestCacheName,
          sortedSetName,
          ['bar', 'baz']
        );
        expectWithMessage(() => {
          expect(getScoresResponse).toBeInstanceOf(CacheSortedSetGetScores.Hit);
        }, `expected HIT but got ${getScoresResponse.toString()}`);

        const expectedResult = {bar: 84, baz: 90210};

        expect(getScoresResponse.value()).toEqual(expectedResult);

        const hitResult = getScoresResponse as CacheSortedSetGetScores.Hit;
        expect(hitResult.value()).toEqual(expectedResult);
        expect(hitResult.valueRecord()).toEqual(expectedResult);

        getScoresResponse = await Momento.sortedSetGetScores(
          IntegrationTestCacheName,
          v4(),
          ['foo', 'bar']
        );

        expectWithMessage(() => {
          expect(getScoresResponse).toBeInstanceOf(
            CacheSortedSetGetScores.Miss
          );
        }, `expected MISS but got ${getScoresResponse.toString()}`);
        expect(getScoresResponse.value()).toEqual(undefined);
      });
    });

    describe('#sortedSetIncrementScore', () => {
      const responder = (props: ValidateSortedSetProps) => {
        return Momento.sortedSetIncrementScore(
          props.cacheName,
          props.sortedSetName,
          props.value
        );
      };

      const changeResponder = (props: ValidateSortedSetChangerProps) => {
        return Momento.sortedSetIncrementScore(
          props.cacheName,
          props.sortedSetName,
          props.value,
          5,
          {ttl: props.ttl}
        );
      };

      itBehavesLikeItValidates(responder);
      itBehavesLikeItHasACollectionTtl(changeResponder);

      it('creates sorted set and element if they do not exist', async () => {
        const sortedSetName = v4();
        let fetchResponse = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSortedSetFetch.Miss);
        }, `expected MISS but got ${fetchResponse.toString()}`);

        let incrementResponse = await Momento.sortedSetIncrementScore(
          IntegrationTestCacheName,
          sortedSetName,
          'foo'
        );
        expectWithMessage(() => {
          expect(incrementResponse).toBeInstanceOf(
            CacheSortedSetIncrementScore.Success
          );
        }, `expected SUCCESS but got ${incrementResponse.toString()}`);
        let successResponse =
          incrementResponse as CacheSortedSetIncrementScore.Success;
        expect(successResponse.score()).toEqual(1);

        fetchResponse = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${fetchResponse.toString()}`);
        const hitResponse = fetchResponse as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArray()).toEqual([
          {
            value: 'foo',
            score: 1,
          },
        ]);

        incrementResponse = await Momento.sortedSetIncrementScore(
          IntegrationTestCacheName,
          sortedSetName,
          'bar',
          42
        );

        expectWithMessage(() => {
          expect(incrementResponse).toBeInstanceOf(
            CacheSortedSetIncrementScore.Success
          );
        }, `expected SUCCESS but got ${incrementResponse.toString()}`);
        successResponse =
          incrementResponse as CacheSortedSetIncrementScore.Success;
        expect(successResponse.score()).toEqual(42);

        fetchResponse = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );

        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${fetchResponse.toString()}`);
        const hitResponse2 = fetchResponse as CacheSortedSetFetch.Hit;
        expect(hitResponse2.valueArray()).toEqual([
          {value: 'foo', score: 1},
          {value: 'bar', score: 42},
        ]);
      });

      it('increments an existing field by the expected amount for a string value', async () => {
        const sortedSetName = v4();
        const value = 'foo';
        await Momento.sortedSetPutElement(
          IntegrationTestCacheName,
          sortedSetName,
          value,
          90210
        );

        const incrementResponse = await Momento.sortedSetIncrementScore(
          IntegrationTestCacheName,
          sortedSetName,
          value,
          10
        );
        expectWithMessage(() => {
          expect(incrementResponse).toBeInstanceOf(
            CacheSortedSetIncrementScore.Success
          );
        }, `expected SUCCESS but got ${incrementResponse.toString()}`);
        const successResponse =
          incrementResponse as CacheSortedSetIncrementScore.Success;
        expect(successResponse.score()).toEqual(90220);

        const fetchResponse = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${fetchResponse.toString()}`);
        const hitResponse = fetchResponse as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArray()).toEqual([
          {value: value, score: 90220},
        ]);
      });

      it('increments an existing field by the expected amount for a bytes value', async () => {
        const sortedSetName = v4();
        const value = uint8ArrayForTest('foo');
        await Momento.sortedSetPutElement(
          IntegrationTestCacheName,
          sortedSetName,
          value,
          90210
        );

        const incrementResponse = await Momento.sortedSetIncrementScore(
          IntegrationTestCacheName,
          sortedSetName,
          value,
          10
        );
        expectWithMessage(() => {
          expect(incrementResponse).toBeInstanceOf(
            CacheSortedSetIncrementScore.Success
          );
        }, `expected SUCCESS but got ${incrementResponse.toString()}`);
        const successResponse =
          incrementResponse as CacheSortedSetIncrementScore.Success;
        expect(successResponse.score()).toEqual(90220);

        const fetchResponse = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${fetchResponse.toString()}`);
        const hitResponse = fetchResponse as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArrayUint8Elements()).toEqual([
          {value: value, score: 90220},
        ]);
      });

      it('decrements an existing field by the expected amount for a string value', async () => {
        const sortedSetName = v4();
        const value = 'foo';
        await Momento.sortedSetPutElement(
          IntegrationTestCacheName,
          sortedSetName,
          value,
          90210
        );

        const incrementRespone = await Momento.sortedSetIncrementScore(
          IntegrationTestCacheName,
          sortedSetName,
          value,
          -10
        );
        expectWithMessage(() => {
          expect(incrementRespone).toBeInstanceOf(
            CacheSortedSetIncrementScore.Success
          );
        }, `expected SUCCESS but got ${incrementRespone.toString()}`);
        const successResponse =
          incrementRespone as CacheSortedSetIncrementScore.Success;
        expect(successResponse.score()).toEqual(90200);

        const fetchResponse = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${fetchResponse.toString()}`);
        const hitResponse = fetchResponse as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArray()).toEqual([
          {value: value, score: 90200},
        ]);
      });

      it('increments an existing field by the expected amount for a bytes value', async () => {
        const sortedSetName = v4();
        const value = uint8ArrayForTest('foo');
        await Momento.sortedSetPutElement(
          IntegrationTestCacheName,
          sortedSetName,
          value,
          90210
        );

        const incrementResponse = await Momento.sortedSetIncrementScore(
          IntegrationTestCacheName,
          sortedSetName,
          value,
          -10
        );
        expectWithMessage(() => {
          expect(incrementResponse).toBeInstanceOf(
            CacheSortedSetIncrementScore.Success
          );
        }, `expected SUCCESS but got ${incrementResponse.toString()}`);
        const successResponse =
          incrementResponse as CacheSortedSetIncrementScore.Success;
        expect(successResponse.score()).toEqual(90200);

        const fetchResponse = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${fetchResponse.toString()}`);
        const hitResponse = fetchResponse as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArrayUint8Elements()).toEqual([
          {value: value, score: 90200},
        ]);
      });

      it('should support happy path for sortedSetIncrementScore via curried cache via ICache interface', async () => {
        const sortedSetName = v4();
        const cache = Momento.cache(IntegrationTestCacheName);
        await cache.sortedSetPutElements(sortedSetName, {
          foo: 42,
          bar: 84,
          baz: 90210,
        });

        const result = await cache.sortedSetIncrementScore(
          sortedSetName,
          'bar'
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetIncrementScore.Success);
        }, `expected HIT but got ${result.toString()}`);
        const success = result as CacheSortedSetIncrementScore.Success;
        expect(success.score()).toEqual(85);
      });

      it('should support accessing value for SortedSetIncrementScore.Success without instanceof check', async () => {
        const sortedSetName = v4();
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          {
            foo: 42,
            bar: 84,
            baz: 90210,
          }
        );

        const result = await Momento.sortedSetIncrementScore(
          IntegrationTestCacheName,
          sortedSetName,
          'bar'
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetIncrementScore.Success);
        }, `expected HIT but got ${result.toString()}`);

        expect(result.score()).toEqual(85);

        const success = result as CacheSortedSetIncrementScore.Success;
        expect(success.score()).toEqual(85);
      });
    });

    describe('#sortedSetRemoveElement', () => {
      const responder = (props: ValidateSortedSetProps) => {
        return Momento.sortedSetRemoveElement(
          props.cacheName,
          props.sortedSetName,
          props.value
        );
      };

      itBehavesLikeItValidates(responder);

      it('should remove a string value', async () => {
        const sortedSetName = v4();
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          {
            foo: 21,
            bar: 42,
          }
        );

        let response = await Momento.sortedSetRemoveElement(
          IntegrationTestCacheName,
          sortedSetName,
          'foo'
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetRemoveElement.Success);
        }, `expected SUCCESS but got ${response.toString()}`);

        response = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        const hitResponse = response as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArray()).toEqual([{value: 'bar', score: 42}]);
      });

      it('should remove a bytes value', async () => {
        const sortedSetName = v4();
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          new Map([
            [uint8ArrayForTest('foo'), 21],
            [uint8ArrayForTest('bar'), 42],
          ])
        );

        let response = await Momento.sortedSetRemoveElement(
          IntegrationTestCacheName,
          sortedSetName,
          uint8ArrayForTest('foo')
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetRemoveElement.Success);
        }, `expected SUCCESS but got ${response.toString()}`);

        response = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        const hitResponse = response as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArrayUint8Elements()).toEqual([
          {value: uint8ArrayForTest('bar'), score: 42},
        ]);
      });

      it("should do nothing for a value that doesn't exist", async () => {
        const sortedSetName = v4();
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          {
            foo: 21,
            bar: 42,
          }
        );

        let response = await Momento.sortedSetRemoveElement(
          IntegrationTestCacheName,
          sortedSetName,
          'taco'
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetRemoveElement.Success);
        }, `expected SUCCESS but got ${response.toString()}`);

        response = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        const hitResponse = response as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArray()).toEqual([
          {value: 'foo', score: 21},
          {value: 'bar', score: 42},
        ]);
      });

      it('should support happy path for sortedSetRemoveElement via curried cache via ICache interface', async () => {
        const sortedSetName = v4();
        const cache = Momento.cache(IntegrationTestCacheName);
        await cache.sortedSetPutElements(sortedSetName, {
          foo: 42,
          bar: 84,
          baz: 90210,
        });

        const result = await cache.sortedSetRemoveElement(sortedSetName, 'bar');
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetRemoveElement.Success);
        }, `expected HIT but got ${result.toString()}`);

        const fetchResult = await cache.sortedSetFetchByRank(sortedSetName);
        expectWithMessage(() => {
          expect(fetchResult).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${result.toString()}`);
        expect((fetchResult as CacheSortedSetFetch.Hit).valueArray()).toEqual([
          {value: 'foo', score: 42},
          {value: 'baz', score: 90210},
        ]);
      });
    });

    describe('#sortedSetRemoveElements', () => {
      const responder = (props: ValidateSortedSetProps) => {
        return Momento.sortedSetRemoveElements(
          props.cacheName,
          props.sortedSetName,
          ['foo']
        );
      };

      itBehavesLikeItValidates(responder);

      it('should remove string values', async () => {
        const sortedSetName = v4();
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          {
            foo: 21,
            bar: 42,
            baz: 84,
          }
        );

        let response = await Momento.sortedSetRemoveElements(
          IntegrationTestCacheName,
          sortedSetName,
          ['foo', 'baz']
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetRemoveElements.Success);
        }, `expected SUCCESS but got ${response.toString()}`);

        response = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        const hitResponse = response as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArray()).toEqual([{value: 'bar', score: 42}]);
      });

      it('should remove bytes values', async () => {
        const sortedSetName = v4();
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          new Map([
            [uint8ArrayForTest('foo'), 21],
            [uint8ArrayForTest('bar'), 42],
            [uint8ArrayForTest('baz'), 84],
          ])
        );

        let response = await Momento.sortedSetRemoveElements(
          IntegrationTestCacheName,
          sortedSetName,
          [uint8ArrayForTest('foo'), uint8ArrayForTest('baz')]
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetRemoveElements.Success);
        }, `expected SUCCESS but got ${response.toString()}`);

        response = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        const hitResponse = response as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArrayUint8Elements()).toEqual([
          {value: uint8ArrayForTest('bar'), score: 42},
        ]);
      });

      it("should do nothing for values that don't exist", async () => {
        const sortedSetName = v4();
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          {
            foo: 21,
            bar: 42,
            baz: 84,
          }
        );

        let response = await Momento.sortedSetRemoveElements(
          IntegrationTestCacheName,
          sortedSetName,
          ['taco', 'habanero']
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetRemoveElements.Success);
        }, `expected SUCCESS but got ${response.toString()}`);

        response = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        const hitResponse = response as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArray()).toEqual([
          {value: 'foo', score: 21},
          {value: 'bar', score: 42},
          {value: 'baz', score: 84},
        ]);
      });

      it('should support happy path for sortedSetRemoveElements via curried cache via ICache interface', async () => {
        const sortedSetName = v4();
        const cache = Momento.cache(IntegrationTestCacheName);
        await cache.sortedSetPutElements(sortedSetName, {
          foo: 42,
          bar: 84,
          baz: 90210,
        });

        const result = await cache.sortedSetRemoveElements(sortedSetName, [
          'bar',
          'baz',
        ]);
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetRemoveElements.Success);
        }, `expected HIT but got ${result.toString()}`);

        const fetchResult = await cache.sortedSetFetchByRank(sortedSetName);
        expectWithMessage(() => {
          expect(fetchResult).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${result.toString()}`);
        expect((fetchResult as CacheSortedSetFetch.Hit).valueArray()).toEqual([
          {value: 'foo', score: 42},
        ]);
      });
    });

    describe('#sortedSetPutElement', () => {
      const responder = (props: ValidateSortedSetProps) => {
        return Momento.sortedSetPutElement(
          props.cacheName,
          props.sortedSetName,
          props.value,
          42
        );
      };

      const changeResponder = (props: ValidateSortedSetChangerProps) => {
        return Momento.sortedSetPutElement(
          props.cacheName,
          props.sortedSetName,
          props.value,
          props.score,
          {ttl: props.ttl}
        );
      };

      itBehavesLikeItValidates(responder);
      itBehavesLikeItHasACollectionTtl(changeResponder);

      it('should store an element with a string value', async () => {
        const sortedSetName = v4();
        let response = await Momento.sortedSetPutElement(
          IntegrationTestCacheName,
          sortedSetName,
          'foo',
          42
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetPutElement.Success);
        }, `expected SUCCESS but got ${response.toString()}`);

        response = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        const hitResponse = response as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArray()).toEqual([{value: 'foo', score: 42}]);
      });

      it('should store an element with a bytes value', async () => {
        const sortedSetName = v4();
        let response = await Momento.sortedSetPutElement(
          IntegrationTestCacheName,
          sortedSetName,
          uint8ArrayForTest('foo'),
          42
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetPutElement.Success);
        }, `expected SUCCESS but got ${response.toString()}`);

        response = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        const hitResponse = response as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArrayUint8Elements()).toEqual([
          {value: uint8ArrayForTest('foo'), score: 42},
        ]);
      });

      it('should support happy path for sortedSetPutElement via curried cache via ICache interface', async () => {
        const sortedSetName = v4();
        const cache = Momento.cache(IntegrationTestCacheName);
        await cache.sortedSetPutElements(sortedSetName, {
          foo: 42,
          bar: 84,
          baz: 90210,
        });

        const result = await cache.sortedSetPutElement(
          sortedSetName,
          'bam',
          9000
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetPutElement.Success);
        }, `expected HIT but got ${result.toString()}`);

        const fetchResult = await cache.sortedSetFetchByRank(sortedSetName);
        expectWithMessage(() => {
          expect(fetchResult).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${result.toString()}`);
        expect((fetchResult as CacheSortedSetFetch.Hit).valueArray()).toEqual([
          {value: 'foo', score: 42},
          {value: 'bar', score: 84},
          {value: 'bam', score: 9000},
          {value: 'baz', score: 90210},
        ]);
      });
    });

    describe('#sortedSetPutElements', () => {
      const responder = (props: ValidateSortedSetProps) => {
        return Momento.sortedSetPutElements(
          props.cacheName,
          props.sortedSetName,
          new Map([[props.value, 42]])
        );
      };

      const changeResponder = (props: ValidateSortedSetChangerProps) => {
        return Momento.sortedSetPutElements(
          props.cacheName,
          props.sortedSetName,
          new Map([[props.value, props.score]]),
          {ttl: props.ttl}
        );
      };

      itBehavesLikeItValidates(responder);
      itBehavesLikeItHasACollectionTtl(changeResponder);

      it('should store elements with a string values passed via Map', async () => {
        const sortedSetName = v4();
        let response = await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          new Map([
            ['foo', 42],
            ['bar', 84],
          ])
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetPutElements.Success);
        }, `expected SUCCESS but got ${response.toString()}`);

        response = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        const hitResponse = response as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArray()).toEqual([
          {value: 'foo', score: 42},
          {value: 'bar', score: 84},
        ]);
      });

      it('should store elements with a string values passed via Record', async () => {
        const sortedSetName = v4();
        let response = await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          {foo: 42, bar: 84}
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetPutElements.Success);
        }, `expected SUCCESS but got ${response.toString()}`);

        response = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        const hitResponse = response as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArray()).toEqual([
          {value: 'foo', score: 42},
          {value: 'bar', score: 84},
        ]);
      });

      it('should store elements with a bytes values passed via Map', async () => {
        const sortedSetName = v4();
        let response = await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          new Map([
            [uint8ArrayForTest('foo'), 42],
            [uint8ArrayForTest('bar'), 84],
          ])
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetPutElements.Success);
        }, `expected SUCCESS but got ${response.toString()}`);

        response = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        const hitResponse = response as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArrayUint8Elements()).toEqual([
          {value: uint8ArrayForTest('foo'), score: 42},
          {value: uint8ArrayForTest('bar'), score: 84},
        ]);
      });

      it('should support happy path for sortedSetPutElements via curried cache via ICache interface', async () => {
        const sortedSetName = v4();
        const cache = Momento.cache(IntegrationTestCacheName);
        await cache.sortedSetPutElements(sortedSetName, {
          foo: 42,
          bar: 84,
          baz: 90210,
        });

        const result = await cache.sortedSetPutElements(sortedSetName, {
          bam: 9000,
          taco: 1_000_000,
        });
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetPutElements.Success);
        }, `expected HIT but got ${result.toString()}`);

        const fetchResult = await cache.sortedSetFetchByRank(sortedSetName);
        expectWithMessage(() => {
          expect(fetchResult).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${result.toString()}`);
        expect((fetchResult as CacheSortedSetFetch.Hit).valueArray()).toEqual([
          {value: 'foo', score: 42},
          {value: 'bar', score: 84},
          {value: 'bam', score: 9000},
          {value: 'baz', score: 90210},
          {value: 'taco', score: 1_000_000},
        ]);
      });
    });

    describe('#sortedSetLength', () => {
      const responder = (props: ValidateSortedSetProps) => {
        return Momento.sortedSetLength(props.cacheName, props.sortedSetName);
      };

      itBehavesLikeItValidates(responder);
      itBehavesLikeItMissesWhenSortedSetDoesNotExist(responder);

      it('returns the length if the sorted set exists', async () => {
        const sortedSetName = v4();
        const setValues = {foo: 42, bar: 84, baz: 90210};
        const numElements = Object.keys(setValues).length;
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          setValues
        );

        const result = await Momento.sortedSetLength(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetLength.Hit);
        }, `expected HIT but got ${result.toString()}`);
        expect((result as CacheSortedSetLength.Hit).length()).toEqual(
          numElements
        );
      });

      it('should support happy path for sortedSetLength via curried cache via ICache interface', async () => {
        const sortedSetName = v4();
        const cache = Momento.cache(IntegrationTestCacheName);
        await cache.sortedSetPutElements(sortedSetName, {
          foo: 42,
          bar: 84,
          baz: 90210,
        });

        const result = await cache.sortedSetLength(sortedSetName);
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetLength.Hit);
        }, `expected HIT but got ${result.toString()}`);

        expect((result as CacheSortedSetLength.Hit).length()).toEqual(3);
      });
    });

    describe('#sortedSetLengthByScore', () => {
      const responder = (props: ValidateSortedSetProps) => {
        return Momento.sortedSetLength(props.cacheName, props.sortedSetName);
      };

      itBehavesLikeItValidates(responder);
      itBehavesLikeItMissesWhenSortedSetDoesNotExist(responder);

      it('gets the length when each score has only one element', async () => {
        const sortedSetName = v4();
        const setValues = {foo: 42, bar: 84, baz: 90210};
        const numElements = Object.keys(setValues).length;
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          setValues
        );

        const result = await Momento.sortedSetLengthByScore(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetLengthByScore.Hit);
        }, `expected HIT but got ${result.toString()}`);
        expect((result as CacheSortedSetLengthByScore.Hit).length()).toEqual(
          numElements
        );
      });

      it('gets the length when only one score has multiple elements', async () => {
        const sortedSetName = v4();
        const setValues = {foo: 42, bar: 42, baz: 42};
        const numElements = Object.keys(setValues).length;
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          setValues
        );

        const result = await Momento.sortedSetLengthByScore(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetLengthByScore.Hit);
        }, `expected HIT but got ${result.toString()}`);
        expect((result as CacheSortedSetLengthByScore.Hit).length()).toEqual(
          numElements
        );
      });

      it('gets the length when multiple scores have varying number of elements', async () => {
        const sortedSetName = v4();
        const setValues = {
          foo: 42,
          bar: 42,
          baz: 42,
          apple: 1,
          banana: 1,
          water: 555,
          air: 555,
          earth: 555,
          fire: 555,
        };
        const numElements = Object.keys(setValues).length;
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          setValues
        );

        const result = await Momento.sortedSetLengthByScore(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetLengthByScore.Hit);
        }, `expected HIT but got ${result.toString()}`);
        expect((result as CacheSortedSetLengthByScore.Hit).length()).toEqual(
          numElements
        );
      });

      it('gets the length for scores between a lower bound and undefined upper bound', async () => {
        const sortedSetName = v4();
        const setValues = {
          foo: 42,
          bar: 42,
          baz: 42,
          apple: 1,
          banana: 1,
          water: 555,
          air: 555,
          earth: 555,
          fire: 555,
        };
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          setValues
        );

        const scoreRange = {
          minScore: 42,
          maxScore: undefined,
        };
        const result = await Momento.sortedSetLengthByScore(
          IntegrationTestCacheName,
          sortedSetName,
          scoreRange
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetLengthByScore.Hit);
        }, `expected HIT but got ${result.toString()}`);
        expect((result as CacheSortedSetLengthByScore.Hit).length()).toEqual(7);
      });

      it('gets the length for scores between undefined lower bound and an upper bound', async () => {
        const sortedSetName = v4();
        const setValues = {
          foo: 42,
          bar: 42,
          baz: 42,
          apple: 1,
          banana: 1,
          water: 555,
          air: 555,
          earth: 555,
          fire: 555,
        };
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          setValues
        );

        const scoreRange = {
          minScore: undefined,
          maxScore: 42,
        };
        const result = await Momento.sortedSetLengthByScore(
          IntegrationTestCacheName,
          sortedSetName,
          scoreRange
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetLengthByScore.Hit);
        }, `expected HIT but got ${result.toString()}`);
        expect((result as CacheSortedSetLengthByScore.Hit).length()).toEqual(5);
      });

      it('gets the length for scores between zero lower bound and an upper bound', async () => {
        const sortedSetName = v4();
        const setValues = {
          foo: 42,
          bar: 42,
          baz: 42,
          apple: 1,
          banana: 1,
          water: 555,
          air: 555,
          earth: 555,
          fire: 555,
        };
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          setValues
        );

        const scoreRange = {
          minScore: 0,
          maxScore: 100,
        };
        const result = await Momento.sortedSetLengthByScore(
          IntegrationTestCacheName,
          sortedSetName,
          scoreRange
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetLengthByScore.Hit);
        }, `expected HIT but got ${result.toString()}`);
        expect((result as CacheSortedSetLengthByScore.Hit).length()).toEqual(5);
      });

      it('gets the length for scores between a lower bound and a zero upper bound', async () => {
        const sortedSetName = v4();
        const setValues = {
          foo: -42,
          bar: -42,
          baz: -42,
          apple: -1,
          banana: -1,
          water: -555,
          air: -555,
          earth: -555,
          fire: -555,
        };
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          setValues
        );

        const scoreRange = {
          minScore: -100,
          maxScore: 0,
        };
        const result = await Momento.sortedSetLengthByScore(
          IntegrationTestCacheName,
          sortedSetName,
          scoreRange
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetLengthByScore.Hit);
        }, `expected HIT but got ${result.toString()}`);
        expect((result as CacheSortedSetLengthByScore.Hit).length()).toEqual(5);
      });

      it('gets the length for scores between lower and upper bound', async () => {
        const sortedSetName = v4();
        const setValues = {
          foo: 42,
          bar: 42,
          baz: 42,
          apple: 1,
          banana: 1,
          water: 555,
          air: 555,
          earth: 555,
          fire: 555,
        };
        await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          setValues
        );

        const scoreRange = {
          minScore: 1,
          maxScore: 42,
        };
        const result = await Momento.sortedSetLengthByScore(
          IntegrationTestCacheName,
          sortedSetName,
          scoreRange
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetLengthByScore.Hit);
        }, `expected HIT but got ${result.toString()}`);
        expect((result as CacheSortedSetLengthByScore.Hit).length()).toEqual(5);
      });

      it('should support happy path for sortedSetLengthByScore via curried cache via ICache interface', async () => {
        const sortedSetName = v4();
        const cache = Momento.cache(IntegrationTestCacheName);
        await cache.sortedSetPutElements(sortedSetName, {
          foo: 42,
          bar: 84,
          baz: 90210,
        });

        const result = await cache.sortedSetLengthByScore(sortedSetName, {
          minScore: 50,
          maxScore: 1000,
        });
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetLengthByScore.Hit);
        }, `expected HIT but got ${result.toString()}`);

        expect((result as CacheSortedSetLengthByScore.Hit).length()).toEqual(1);
      });
    });

    describe('test deleting sorted set', () => {
      it('returns a miss for a deleted sorted set', async () => {
        const sortedSetName = v4();
        let response = await Momento.sortedSetPutElements(
          IntegrationTestCacheName,
          sortedSetName,
          new Map([
            ['foo', 42],
            ['bar', 84],
          ])
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetPutElements.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
        response = await Momento.delete(
          IntegrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDelete.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
        response = await Momento.sortedSetGetScore(
          IntegrationTestCacheName,
          sortedSetName,
          'foo'
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetGetScore.Miss);
        }, `expected MISS but got ${response.toString()}`);
      });
    });
  });
}
