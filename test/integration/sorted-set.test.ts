import {v4} from 'uuid';
import {sleep} from '../../src/internal/utils/sleep';
import {
  CacheDelete,
  CacheSortedSetFetch,
  CacheSortedSetIncrementScore,
  CollectionTtl,
  MomentoErrorCode,
  SortedSetOrder,
} from '../../src';
import {
  ItBehavesLikeItValidatesCacheName,
  SetupIntegrationTest,
  ValidateCacheProps,
  ValidateSortedSetChangerProps,
  ValidateSortedSetProps,
} from './integration-setup';
import {
  IResponseError,
  IResponseMiss,
  IResponseSuccess,
  ResponseBase,
} from '../../src/messages/responses/response-base';

const {Momento, IntegrationTestCacheName} = SetupIntegrationTest();

const textEncoder = new TextEncoder();

describe('Integration tests for sorted set operations', () => {
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

  /*
  const itBehavesLikeItMissesWhenFieldDoesNotExist = (
    responder: (props: ValidateDictionaryProps) => Promise<ResponseBase>
  ) => {
    it('misses when a string field does not exist', async () => {
      const dictionaryName = v4();

      // Make sure the dictionary exists.
      const setResponse = await Momento.dictionarySetField(
        IntegrationTestCacheName,
        dictionaryName,
        v4(),
        v4()
      );
      expect(setResponse).toBeInstanceOf(CacheDictionarySetField.Success);

      const response = await responder({
        cacheName: IntegrationTestCacheName,
        dictionaryName: dictionaryName,
        field: v4(),
      });

      expect((response as IResponseMiss).is_miss).toBeTrue();
    });

    it('misses when a byte field does not exist', async () => {
      const dictionaryName = v4();
      const fieldName = new TextEncoder().encode(v4());

      // Make sure the dictionary exists.
      const setResponse = await Momento.dictionarySetField(
        IntegrationTestCacheName,
        dictionaryName,
        v4(),
        v4()
      );
      expect(setResponse).toBeInstanceOf(CacheDictionarySetField.Success);

      const response = await responder({
        cacheName: IntegrationTestCacheName,
        dictionaryName: dictionaryName,
        field: fieldName,
      });

      expect((response as IResponseMiss).is_miss).toBeTrue();
    });
  };*/

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
      expect(getResponse).toBeInstanceOf(CacheSortedSetFetch.Miss);
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
      expect(getResponse).toBeInstanceOf(CacheSortedSetFetch.Hit);
      /* TODO
      const getResponse = await Momento.sortedSetGetRank(
        IntegrationTestCacheName,
        sortedSetName,
        value
      );
      expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
      */
    });
  };

  describe('#sortedSetFetchByRank', () => {
    const responder = (props: ValidateSortedSetProps) => {
      return Momento.dictionaryFetch(props.cacheName, props.sortedSetName);
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
      expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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
      expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
      const hitResponse = response as CacheSortedSetFetch.Hit;

      const expectedStringElements = [
        {value: 'bar', score: 42},
        {value: 'foo', score: 90210},
      ];

      const expectedUint8Elements = [
        {value: textEncoder.encode('bar'), score: 42},
        {value: textEncoder.encode('foo'), score: 90210},
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        const hitResponse = response as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArray()).toEqual([
          {value: 'bar', score: 2},
          {value: 'baz', score: 42},
          {value: 'habanero', score: 68},
          {value: 'bam', score: 1000},
        ]);
      });

      // Skipping this for now; need to re-enable:
      // https://github.com/momentohq/client-sdk-nodejs/issues/330
      // https://github.com/momentohq/storage-store/issues/168
      it.skip('should return an empty list if start rank is out of bounds', async () => {
        const response = await Momento.sortedSetFetchByRank(
          IntegrationTestCacheName,
          sortedSetName,
          {
            startRank: 10,
          }
        );

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Error);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Error);
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
      let response = await Momento.sortedSetFetchByRank(
        IntegrationTestCacheName,
        sortedSetName
      );
      expect(response).toBeInstanceOf(CacheSortedSetFetch.Miss);

      await Momento.sortedSetPutElements(
        IntegrationTestCacheName,
        sortedSetName,
        new Map([
          [v4(), 1],
          [v4(), 2],
          [v4(), 3],
        ])
      );

      response = await Momento.sortedSetFetchByRank(
        IntegrationTestCacheName,
        sortedSetName
      );
      expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);

      response = await Momento.delete(IntegrationTestCacheName, sortedSetName);
      expect(response).toBeInstanceOf(CacheDelete.Success);

      response = await Momento.sortedSetFetchByRank(
        IntegrationTestCacheName,
        sortedSetName
      );
      expect(response).toBeInstanceOf(CacheSortedSetFetch.Miss);
    });
  });

  describe('#sortedSetFetchByScore', () => {
    const responder = (props: ValidateSortedSetProps) => {
      return Momento.dictionaryFetch(props.cacheName, props.sortedSetName);
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
      expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

      const response = await Momento.sortedSetFetchByScore(
        IntegrationTestCacheName,
        sortedSetName
      );
      expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
      const hitResponse = response as CacheSortedSetFetch.Hit;

      const expectedStringElements = [
        {value: 'bar', score: 42},
        {value: 'foo', score: 90210},
      ];

      const expectedUint8Elements = [
        {value: textEncoder.encode('bar'), score: 42},
        {value: textEncoder.encode('foo'), score: 90210},
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        const hitResponse = response as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArray()).toEqual([
          {value: 'bam', score: 1000},
          {value: 'burrito', score: 9000},
        ]);
      });

      // Skipping this for now; need to re-enable:
      // https://github.com/momentohq/client-sdk-nodejs/issues/330
      // https://github.com/momentohq/storage-store/issues/168
      it.skip('should fetch an empty list if minScore is out of range', async () => {
        const response = await Momento.sortedSetFetchByScore(
          IntegrationTestCacheName,
          sortedSetName,
          {
            minScore: 2_000_000,
          }
        );

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        const hitResponse = response as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArray()).toEqual([]);
      });

      // Skipping this for now; need to re-enable:
      // https://github.com/momentohq/client-sdk-nodejs/issues/330
      // https://github.com/momentohq/storage-store/issues/168
      it.skip('should fetch an empty list if maxScore is out of range', async () => {
        const response = await Momento.sortedSetFetchByScore(
          IntegrationTestCacheName,
          sortedSetName,
          {
            maxScore: 0,
          }
        );

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Error);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        const hitResponse = response as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArray()).toEqual([
          {value: 'bam', score: 1000},
          {value: 'burrito', score: 9000},
          {value: 'taco', score: 90210},
        ]);
      });

      // Skipping this for now; need to re-enable:
      // https://github.com/momentohq/client-sdk-nodejs/issues/330
      // https://github.com/momentohq/storage-store/issues/168
      it.skip('should return an empty list if offset is greater than the size of the results', async () => {
        const response = await Momento.sortedSetFetchByScore(
          IntegrationTestCacheName,
          sortedSetName,
          {
            minScore: 100,
            offset: 5,
          }
        );

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Error);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Error);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
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

        expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        const hitResponse = response as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArray()).toEqual([
          {value: 'bam', score: 1000},
          {value: 'habanero', score: 68},
        ]);
      });
    });

    it('should return a miss if the sorted set does not exist', async () => {
      const sortedSetName = v4();
      let response = await Momento.sortedSetFetchByRank(
        IntegrationTestCacheName,
        sortedSetName
      );
      expect(response).toBeInstanceOf(CacheSortedSetFetch.Miss);

      await Momento.sortedSetPutElements(
        IntegrationTestCacheName,
        sortedSetName,
        new Map([
          [v4(), 1],
          [v4(), 2],
          [v4(), 3],
        ])
      );

      response = await Momento.sortedSetFetchByRank(
        IntegrationTestCacheName,
        sortedSetName
      );
      expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);

      response = await Momento.delete(IntegrationTestCacheName, sortedSetName);
      expect(response).toBeInstanceOf(CacheDelete.Success);

      response = await Momento.sortedSetFetchByRank(
        IntegrationTestCacheName,
        sortedSetName
      );
      expect(response).toBeInstanceOf(CacheSortedSetFetch.Miss);
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  describe('#sortedSetGetRank', () => {});

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  describe('#sortedSetGetScore', () => {});

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  describe('#sortedSetGetScores', () => {});

  /*
  describe('#dictionaryGetField', () => {
    const responder = (props: ValidateDictionaryProps) => {
      return Momento.dictionaryGetField(
        props.cacheName,
        props.dictionaryName,
        v4()
      );
    };

    itBehavesLikeItValidates(responder);
    itBehavesLikeItMissesWhenDictionaryDoesNotExist(responder);
    itBehavesLikeItMissesWhenFieldDoesNotExist(responder);

    it('returns the expected toString value', async () => {
      const dictionaryName = v4();
      const field = v4();
      const value = v4();

      const response = await Momento.dictionarySetField(
        IntegrationTestCacheName,
        dictionaryName,
        field,
        value
      );
      expect(response).toBeInstanceOf(CacheDictionarySetField.Success);

      const getResponse = await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field
      );
      expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
      expect((getResponse as CacheDictionaryGetField.Hit).toString()).toEqual(
        `Hit: ${value.substring(0, 32)}...`
      );
    });
  });

  describe('#dictionaryGetFields', () => {
    const responder = (props: ValidateDictionaryProps) => {
      return Momento.dictionaryGetFields(
        props.cacheName,
        props.dictionaryName,
        [props.field] as string[] | Uint8Array[]
      );
    };

    itBehavesLikeItValidates(responder);
    itBehavesLikeItMissesWhenDictionaryDoesNotExist(responder);

    it('return expected toString value', async () => {
      const dictionaryName = v4();
      await Momento.dictionarySetField(
        IntegrationTestCacheName,
        dictionaryName,
        'a',
        'b'
      );
      await Momento.dictionarySetField(
        IntegrationTestCacheName,
        dictionaryName,
        'c',
        'd'
      );
      const getResponse = await Momento.dictionaryGetFields(
        IntegrationTestCacheName,
        dictionaryName,
        ['a', 'c']
      );
      expect(getResponse).toBeInstanceOf(CacheDictionaryGetFields.Hit);
      expect((getResponse as CacheDictionaryGetFields.Hit).toString()).toEqual(
        'Hit: valueDictionaryStringString: a: b, c: d'
      );
    });

    it('should dictionarySetField/dictionaryGetFields with string fields/values', async () => {
      const textEncoder = new TextEncoder();

      const dictionaryName = v4();
      const field1 = 'foo';
      const value1 = v4();
      const field2 = 'bar';
      const value2 = v4();
      const field3 = 'baz';
      let response = await Momento.dictionarySetField(
        IntegrationTestCacheName,
        dictionaryName,
        field1,
        value1
      );
      expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
      response = await Momento.dictionarySetField(
        IntegrationTestCacheName,
        dictionaryName,
        field2,
        value2
      );
      expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
      const getResponse = await Momento.dictionaryGetFields(
        IntegrationTestCacheName,
        dictionaryName,
        [field1, field2, field3]
      );
      expect(getResponse).toBeInstanceOf(CacheDictionaryGetFields.Hit);
      const hitResponse = getResponse as CacheDictionaryGetFields.Hit;
      expect(hitResponse.responses).toHaveLength(3);
      expect(hitResponse.responses[0]).toBeInstanceOf(
        CacheDictionaryGetField.Hit
      );
      const hitResponse1 = hitResponse
        .responses[0] as CacheDictionaryGetField.Hit;
      expect(hitResponse1.fieldString()).toEqual(field1);

      expect(hitResponse.responses[1]).toBeInstanceOf(
        CacheDictionaryGetField.Hit
      );
      const hitResponse2 = hitResponse
        .responses[1] as CacheDictionaryGetField.Hit;
      expect(hitResponse2.fieldString()).toEqual(field2);

      expect(hitResponse.responses[2]).toBeInstanceOf(
        CacheDictionaryGetField.Miss
      );
      const missResponse = hitResponse
        .responses[2] as CacheDictionaryGetField.Miss;
      expect(missResponse.fieldString()).toEqual(field3);

      const expectedMapStringString = new Map<string, string>([
        [field1, value1],
        [field2, value2],
      ]);
      expect(expectedMapStringString).toEqual(
        hitResponse.valueMapStringString()
      );
      expect(expectedMapStringString).toEqual(hitResponse.valueMap());

      const expectedMapStringBytes = new Map<string, Uint8Array>([
        [field1, textEncoder.encode(value1)],
        [field2, textEncoder.encode(value2)],
      ]);
      expect(expectedMapStringBytes).toEqual(
        hitResponse.valueMapStringUint8Array()
      );

      const expectedRecordStringString = {
        foo: value1,
        bar: value2,
      };
      expect(expectedRecordStringString).toEqual(
        hitResponse.valueRecordStringString()
      );
      expect(expectedRecordStringString).toEqual(hitResponse.valueRecord());

      const expectedRecordStringBytes = {
        foo: textEncoder.encode(value1),
        bar: textEncoder.encode(value2),
      };
      expect(expectedRecordStringBytes).toEqual(
        hitResponse.valueRecordStringUint8Array()
      );
    });

    it('should dictionarySetField/dictionaryGetFields with Uint8Array fields/values', async () => {
      const dictionaryName = v4();
      const field1 = new TextEncoder().encode(v4());
      const value1 = new TextEncoder().encode(v4());
      const field2 = new TextEncoder().encode(v4());
      const value2 = new TextEncoder().encode(v4());
      const field3 = new TextEncoder().encode(v4());
      let response = await Momento.dictionarySetField(
        IntegrationTestCacheName,
        dictionaryName,
        field1,
        value1
      );
      expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
      response = await Momento.dictionarySetField(
        IntegrationTestCacheName,
        dictionaryName,
        field2,
        value2
      );
      expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
      const getResponse = await Momento.dictionaryGetFields(
        IntegrationTestCacheName,
        dictionaryName,
        [field1, field2, field3]
      );

      expect(getResponse).toBeInstanceOf(CacheDictionaryGetFields.Hit);
      const hitResponse = getResponse as CacheDictionaryGetFields.Hit;
      expect(hitResponse.responses).toHaveLength(3);
      expect(hitResponse.responses[0]).toBeInstanceOf(
        CacheDictionaryGetField.Hit
      );
      const hitResponse1 = hitResponse
        .responses[0] as CacheDictionaryGetField.Hit;
      expect(hitResponse1.fieldUint8Array()).toEqual(field1);

      expect(hitResponse.responses[1]).toBeInstanceOf(
        CacheDictionaryGetField.Hit
      );
      const hitResponse2 = hitResponse
        .responses[1] as CacheDictionaryGetField.Hit;
      expect(hitResponse2.fieldUint8Array()).toEqual(field2);

      expect(hitResponse.responses[2]).toBeInstanceOf(
        CacheDictionaryGetField.Miss
      );
      const missResponse = hitResponse
        .responses[2] as CacheDictionaryGetField.Miss;
      expect(missResponse.fieldUint8Array()).toEqual(field3);

      const expectedMap = new Map<Uint8Array, Uint8Array>([
        [field1, value1],
        [field2, value2],
      ]);
      expect(expectedMap).toEqual(hitResponse.valueMapUint8ArrayUint8Array());
    });
  });
  */

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
      let response = await Momento.sortedSetFetchByRank(
        IntegrationTestCacheName,
        sortedSetName
      );
      expect(response).toBeInstanceOf(CacheSortedSetFetch.Miss);

      response = await Momento.sortedSetIncrementScore(
        IntegrationTestCacheName,
        sortedSetName,
        'foo'
      );
      expect(response).toBeInstanceOf(CacheSortedSetIncrementScore.Success);
      const incrementResponse =
        response as CacheSortedSetIncrementScore.Success;
      expect(incrementResponse.score()).toEqual(1);

      response = await Momento.sortedSetFetchByRank(
        IntegrationTestCacheName,
        sortedSetName
      );
      expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
      const hitResponse = response as CacheSortedSetFetch.Hit;
      expect(hitResponse.valueArray()).toEqual([
        {
          value: 'foo',
          score: 1,
        },
      ]);

      response = await Momento.sortedSetIncrementScore(
        IntegrationTestCacheName,
        sortedSetName,
        'bar',
        42
      );

      expect(response).toBeInstanceOf(CacheSortedSetIncrementScore.Success);
      const incrementResponse2 =
        response as CacheSortedSetIncrementScore.Success;
      expect(incrementResponse2.score()).toEqual(42);

      response = await Momento.sortedSetFetchByRank(
        IntegrationTestCacheName,
        sortedSetName
      );

      expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
      const hitResponse2 = response as CacheSortedSetFetch.Hit;
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

      let response = await Momento.sortedSetIncrementScore(
        IntegrationTestCacheName,
        sortedSetName,
        value,
        10
      );
      expect(response).toBeInstanceOf(CacheSortedSetIncrementScore.Success);
      const incrementResponse =
        response as CacheSortedSetIncrementScore.Success;
      expect(incrementResponse.score()).toEqual(90220);

      response = await Momento.sortedSetFetchByRank(
        IntegrationTestCacheName,
        sortedSetName
      );
      expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
      const hitResponse = response as CacheSortedSetFetch.Hit;
      expect(hitResponse.valueArray()).toEqual([{value: value, score: 90220}]);
    });

    it('increments an existing field by the expected amount for a bytes value', async () => {
      const sortedSetName = v4();
      const value = textEncoder.encode('foo');
      await Momento.sortedSetPutElement(
        IntegrationTestCacheName,
        sortedSetName,
        value,
        90210
      );

      let response = await Momento.sortedSetIncrementScore(
        IntegrationTestCacheName,
        sortedSetName,
        value,
        10
      );
      expect(response).toBeInstanceOf(CacheSortedSetIncrementScore.Success);
      const incrementResponse =
        response as CacheSortedSetIncrementScore.Success;
      expect(incrementResponse.score()).toEqual(90220);

      response = await Momento.sortedSetFetchByRank(
        IntegrationTestCacheName,
        sortedSetName
      );
      expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
      const hitResponse = response as CacheSortedSetFetch.Hit;
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

      let response = await Momento.sortedSetIncrementScore(
        IntegrationTestCacheName,
        sortedSetName,
        value,
        -10
      );
      expect(response).toBeInstanceOf(CacheSortedSetIncrementScore.Success);
      const incrementResponse =
        response as CacheSortedSetIncrementScore.Success;
      expect(incrementResponse.score()).toEqual(90200);

      response = await Momento.sortedSetFetchByRank(
        IntegrationTestCacheName,
        sortedSetName
      );
      expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
      const hitResponse = response as CacheSortedSetFetch.Hit;
      expect(hitResponse.valueArray()).toEqual([{value: value, score: 90200}]);
    });

    it('increments an existing field by the expected amount for a bytes value', async () => {
      const sortedSetName = v4();
      const value = textEncoder.encode('foo');
      await Momento.sortedSetPutElement(
        IntegrationTestCacheName,
        sortedSetName,
        value,
        90210
      );

      let response = await Momento.sortedSetIncrementScore(
        IntegrationTestCacheName,
        sortedSetName,
        value,
        -10
      );
      expect(response).toBeInstanceOf(CacheSortedSetIncrementScore.Success);
      const incrementResponse =
        response as CacheSortedSetIncrementScore.Success;
      expect(incrementResponse.score()).toEqual(90200);

      response = await Momento.sortedSetFetchByRank(
        IntegrationTestCacheName,
        sortedSetName
      );
      expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
      const hitResponse = response as CacheSortedSetFetch.Hit;
      expect(hitResponse.valueArrayUint8Elements()).toEqual([
        {value: value, score: 90200},
      ]);
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  describe('#sortedSetRemoveElement', () => {});

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  describe('#sortedSetRemoveElements', () => {});

  /*
  describe('#dictionaryRemoveField', () => {
    const responder = (props: ValidateDictionaryProps) => {
      return Momento.dictionaryRemoveField(
        props.cacheName,
        props.dictionaryName,
        props.field
      );
    };

    itBehavesLikeItValidates(responder);

    it('should remove a Uint8Array field', async () => {
      const dictionaryName = v4();
      const field = new TextEncoder().encode(v4());
      const value = new TextEncoder().encode(v4());

      // When the field does not exist.
      expect(
        await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryGetField.Miss);
      expect(
        await Momento.dictionaryRemoveField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryRemoveField.Success);
      expect(
        await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryGetField.Miss);

      // When the field exists.
      expect(
        await Momento.dictionarySetField(
          IntegrationTestCacheName,
          dictionaryName,
          field,
          value
        )
      ).toBeInstanceOf(CacheDictionarySetField.Success);
      expect(
        await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryGetField.Hit);
      expect(
        await Momento.dictionaryRemoveField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryRemoveField.Success);
      expect(
        await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryGetField.Miss);
    });

    it('should remove a string field', async () => {
      const dictionaryName = v4();
      const field = v4();
      const value = v4();

      // When the field does not exist.
      expect(
        await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryGetField.Miss);
      expect(
        await Momento.dictionaryRemoveField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryRemoveField.Success);
      expect(
        await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryGetField.Miss);

      // When the field exists.
      expect(
        await Momento.dictionarySetField(
          IntegrationTestCacheName,
          dictionaryName,
          field,
          value
        )
      ).toBeInstanceOf(CacheDictionarySetField.Success);
      expect(
        await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryGetField.Hit);
      expect(
        await Momento.dictionaryRemoveField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryRemoveField.Success);
      expect(
        await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryGetField.Miss);
    });
  });

  describe('#dictionaryRemoveFields', () => {
    const responder = (props: ValidateDictionaryProps) => {
      return Momento.dictionaryRemoveFields(
        props.cacheName,
        props.dictionaryName,
        [props.field] as string[] | Uint8Array[]
      );
    };

    itBehavesLikeItValidates(responder);

    it('should remove Uint8Array fields', async () => {
      const dictionaryName = v4();
      const fields = [
        new TextEncoder().encode(v4()),
        new TextEncoder().encode(v4()),
      ];
      const setFields = new Map([
        [fields[0], v4()],
        [fields[1], v4()],
      ]);

      // When the fields do not exist.
      expect(
        await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryGetFields.Miss);
      expect(
        await Momento.dictionaryRemoveFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryRemoveFields.Success);
      expect(
        await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryGetFields.Miss);

      // When the fields exist.
      expect(
        await Momento.dictionarySetFields(
          IntegrationTestCacheName,
          dictionaryName,
          setFields
        )
      ).toBeInstanceOf(CacheDictionarySetFields.Success);
      expect(
        await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryGetFields.Hit);
      expect(
        await Momento.dictionaryRemoveFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryRemoveFields.Success);
      expect(
        await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryGetFields.Miss);
    });

    it('should remove string fields', async () => {
      const dictionaryName = v4();
      const fields = [v4(), v4()];
      const setFields = new Map([
        [fields[0], v4()],
        [fields[1], v4()],
      ]);

      // When the fields do not exist.
      expect(
        await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryGetFields.Miss);
      expect(
        await Momento.dictionaryRemoveFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryRemoveFields.Success);
      expect(
        await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryGetFields.Miss);

      // When the fields exist.
      expect(
        await Momento.dictionarySetFields(
          IntegrationTestCacheName,
          dictionaryName,
          setFields
        )
      ).toBeInstanceOf(CacheDictionarySetFields.Success);
      expect(
        await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryGetFields.Hit);
      expect(
        await Momento.dictionaryRemoveFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryRemoveFields.Success);
      expect(
        await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryGetFields.Miss);
    });
  });
  */

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

    /*
    it('should set/get a dictionary with Uint8Array field/value', async () => {
      const dictionaryName = v4();
      const field = new TextEncoder().encode(v4());
      const value = new TextEncoder().encode(v4());
      const response = await Momento.dictionarySetField(
        IntegrationTestCacheName,
        dictionaryName,
        field,
        value
      );
      expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
      const getResponse = await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field
      );
      expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
      if (getResponse instanceof CacheDictionaryGetField.Hit) {
        expect(getResponse.valueUint8Array()).toEqual(value);
      }
    });

    it('should set/get a dictionary with string field/value', async () => {
      const dictionaryName = v4();
      const field = v4();
      const value = v4();
      const response = await Momento.dictionarySetField(
        IntegrationTestCacheName,
        dictionaryName,
        field,
        value
      );
      expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
      const getResponse = await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field
      );
      expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
      if (getResponse instanceof CacheDictionaryGetField.Hit) {
        expect(getResponse.valueString()).toEqual(value);
      }
    });

    it('should set/get a dictionary with string field and Uint8Array value', async () => {
      const dictionaryName = v4();
      const field = v4();
      const value = new TextEncoder().encode(v4());
      const response = await Momento.dictionarySetField(
        IntegrationTestCacheName,
        dictionaryName,
        field,
        value
      );
      expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
      const getResponse = await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field
      );
      expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
      expect(
        (getResponse as CacheDictionaryGetField.Hit).valueUint8Array()
      ).toEqual(value);
    });
    */
  });

  /*
  describe('#dictionarySetFields', () => {
    const responder = (props: ValidateDictionaryProps) => {
      return Momento.dictionarySetFields(
        props.cacheName,
        props.dictionaryName,
        new Map([[props.field, v4()]])
      );
    };

    const changeResponder = (props: ValidateDictionaryChangerProps) => {
      return Momento.dictionarySetFields(
        props.cacheName,
        props.dictionaryName,
        new Map([[props.field, props.value]]),
        {ttl: props.ttl}
      );
    };

    itBehavesLikeItValidates(responder);
    itBehavesLikeItHasACollectionTtl(changeResponder);

    it('should set fields with Uint8Array items', async () => {
      const dictionaryName = v4();
      const field1 = new TextEncoder().encode(v4());
      const value1 = new TextEncoder().encode(v4());
      const field2 = new TextEncoder().encode(v4());
      const value2 = new TextEncoder().encode(v4());
      const response = await Momento.dictionarySetFields(
        IntegrationTestCacheName,
        dictionaryName,
        new Map([
          [field1, value1],
          [field2, value2],
        ]),
        {ttl: CollectionTtl.of(10)}
      );
      expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
      let getResponse = await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field1
      );
      expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
      if (getResponse instanceof CacheDictionaryGetField.Hit) {
        expect(getResponse.valueUint8Array()).toEqual(value1);
      }
      getResponse = await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field2
      );
      expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
      if (getResponse instanceof CacheDictionaryGetField.Hit) {
        expect(getResponse.valueUint8Array()).toEqual(value2);
      }
    });

    it('should set fields with string items Map', async () => {
      const dictionaryName = v4();
      const field1 = v4();
      const value1 = v4();
      const field2 = v4();
      const value2 = v4();
      const response = await Momento.dictionarySetFields(
        IntegrationTestCacheName,
        dictionaryName,
        new Map([
          [field1, value1],
          [field2, value2],
        ]),
        {ttl: CollectionTtl.of(10)}
      );
      expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
      let getResponse = await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field1
      );
      expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
      if (getResponse instanceof CacheDictionaryGetField.Hit) {
        expect(getResponse.valueString()).toEqual(value1);
      }
      getResponse = await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field2
      );
      expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
      if (getResponse instanceof CacheDictionaryGetField.Hit) {
        expect(getResponse.valueString()).toEqual(value2);
      }
    });

    it('should set fields with string items Record', async () => {
      const dictionaryName = v4();
      const field1 = 'foo';
      const value1 = v4();
      const field2 = 'bar';
      const value2 = v4();
      const response = await Momento.dictionarySetFields(
        IntegrationTestCacheName,
        dictionaryName,
        {foo: value1, bar: value2},
        {ttl: CollectionTtl.of(10)}
      );
      expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
      let getResponse = await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field1
      );
      expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
      if (getResponse instanceof CacheDictionaryGetField.Hit) {
        expect(getResponse.valueString()).toEqual(value1);
      }
      getResponse = await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field2
      );
      expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
      if (getResponse instanceof CacheDictionaryGetField.Hit) {
        expect(getResponse.valueString()).toEqual(value2);
      }
    });

    it('should set fields with string field/Uint8Array value items', async () => {
      const dictionaryName = v4();
      const field1 = v4();
      const value1 = new TextEncoder().encode(v4());
      const field2 = v4();
      const value2 = new TextEncoder().encode(v4());
      const response = await Momento.dictionarySetFields(
        IntegrationTestCacheName,
        dictionaryName,
        new Map([
          [field1, value1],
          [field2, value2],
        ]),
        {ttl: CollectionTtl.of(10)}
      );
      expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
      let getResponse = await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field1
      );
      expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
      if (getResponse instanceof CacheDictionaryGetField.Hit) {
        expect(getResponse.valueUint8Array()).toEqual(value1);
      }
      getResponse = await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field2
      );
      expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
      if (getResponse instanceof CacheDictionaryGetField.Hit) {
        expect(getResponse.valueUint8Array()).toEqual(value2);
      }
    });

    it('should set fields with string fields / Uint8Array Record', async () => {
      const textEncoder = new TextEncoder();
      const dictionaryName = v4();
      const field1 = 'foo';
      const value1 = v4();
      const field2 = 'bar';
      const value2 = v4();
      const response = await Momento.dictionarySetFields(
        IntegrationTestCacheName,
        dictionaryName,
        {foo: textEncoder.encode(value1), bar: textEncoder.encode(value2)},
        {ttl: CollectionTtl.of(10)}
      );
      expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
      let getResponse = await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field1
      );
      expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
      if (getResponse instanceof CacheDictionaryGetField.Hit) {
        expect(getResponse.valueString()).toEqual(value1);
      }
      getResponse = await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field2
      );
      expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
      if (getResponse instanceof CacheDictionaryGetField.Hit) {
        expect(getResponse.valueString()).toEqual(value2);
      }
    });
  });
  */
});
