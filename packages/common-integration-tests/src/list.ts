import {v4} from 'uuid';
import {
  CollectionTtl,
  CacheDelete,
  CacheListConcatenateBack,
  CacheListConcatenateFront,
  CacheListFetch,
  CacheListLength,
  CacheListPopBack,
  CacheListPopFront,
  CacheListPushBack,
  CacheListPushFront,
  CacheListRemoveValue,
  CacheListRetain,
  MomentoErrorCode,
} from '@gomomento/sdk-core';

import {
  expectWithMessage,
  ValidateCacheProps,
  ValidateListProps,
  ItBehavesLikeItValidatesCacheName,
} from './common-int-test-utils';
import {
  IListResponseSuccess,
  IResponseError,
  ResponseBase,
} from '@gomomento/sdk-core/dist/src/messages/responses/response-base';
import {sleep} from '@gomomento/sdk-core/dist/src/internal/utils';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/internal/clients/cache';

export function runListTests(
  Momento: ICacheClient,
  IntegrationTestCacheName: string
) {
  describe('lists', () => {
    const itBehavesLikeItValidates = (
      getResponse: (props: ValidateListProps) => Promise<ResponseBase>
    ) => {
      ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
        return getResponse({cacheName: props.cacheName, listName: v4()});
      });

      it('validates its list name', async () => {
        const response = await getResponse({
          cacheName: IntegrationTestCacheName,
          listName: '  ',
        });

        expect((response as IResponseError).errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      });
    };

    interface addValueProps {
      cacheName: string;
      listName: string;
      value: string | Uint8Array;
      ttl?: CollectionTtl;
      truncateToSize?: number;
    }

    const itBehavesLikeItHasACollectionTtl = (
      addValue: (props: addValueProps) => Promise<ResponseBase>
    ) => {
      it('sets ttl', async () => {
        const listName = v4();
        const values = ['one', 'two', 'three'];
        const ttl = new CollectionTtl(0.5, false);

        for (const value of values) {
          await addValue({
            cacheName: IntegrationTestCacheName,
            listName: listName,
            value: value,
            ttl: ttl,
          });
        }
        await sleep(1000);

        const respFetch = await Momento.listFetch(
          IntegrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(respFetch).toBeInstanceOf(CacheListFetch.Miss);
        }, `expected a MISS but got ${respFetch.toString()}`);
      });

      it('refreshes ttl', async () => {
        const listName = v4();
        const values = ['one', 'two', 'three'];
        const timeout = 3;
        const ttl = new CollectionTtl(timeout, true);

        for (const value of values) {
          await addValue({
            cacheName: IntegrationTestCacheName,
            listName: listName,
            value: value,
            ttl: ttl,
          });
          // Sleep for half the ttl each loop. If we don't refresh they
          // won't all live.
          await sleep((timeout / 2) * 1000);
        }

        const respFetch = await Momento.listFetch(
          IntegrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${respFetch.toString()}`);
        expect(
          (respFetch as CacheListFetch.Hit).valueListString()
        ).toIncludeAllMembers(values);
      });
    };

    const itBehavesLikeItAddsValues = (
      addValue: (props: addValueProps) => Promise<ResponseBase>
    ) => {
      it('returns the new list length', async () => {
        const listName = v4();
        const values = ['one', 'two', 'three'];

        let length = 0;
        for (const value of values) {
          const resp = await addValue({
            cacheName: IntegrationTestCacheName,
            listName: listName,
            value: value,
          });
          length += 1;
          expect((resp as IListResponseSuccess).listLength()).toEqual(length);
        }
      });
    };

    const itBehavesLikeItAddsValuesToTheBack = (
      addValue: (props: addValueProps) => Promise<ResponseBase>
    ) => {
      itBehavesLikeItHasACollectionTtl(addValue);
      itBehavesLikeItAddsValues(addValue);

      it('adds to the back', async () => {
        const listName = v4();
        const values = ['one', 'two', 'three'];

        for (const value of values) {
          await addValue({
            cacheName: IntegrationTestCacheName,
            listName: listName,
            value: value,
          });
        }

        const respFetch = await Momento.listFetch(
          IntegrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${respFetch.toString()}`);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
          values
        );
      });

      it('truncates the front', async () => {
        const listName = v4();
        const values = ['one', 'two', 'three'];

        for (const value of values) {
          await addValue({
            cacheName: IntegrationTestCacheName,
            listName: listName,
            value: value,
            truncateToSize: 2,
          });
        }

        const respFetch = await Momento.listFetch(
          IntegrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${respFetch.toString()}`);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual([
          'two',
          'three',
        ]);
      });
    };

    const itBehavesLikeItAddsValuesToTheFront = (
      addValue: (props: addValueProps) => Promise<ResponseBase>
    ) => {
      itBehavesLikeItHasACollectionTtl(addValue);
      itBehavesLikeItAddsValues(addValue);

      it('adds to the front', async () => {
        const listName = v4();
        const values = ['one', 'two', 'three'];

        for (const value of values) {
          await addValue({
            cacheName: IntegrationTestCacheName,
            listName: listName,
            value: value,
          });
        }

        const respFetch = await Momento.listFetch(
          IntegrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${respFetch.toString()}`);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
          values.reverse()
        );
      });

      it('truncates the back', async () => {
        const listName = v4();
        const values = ['one', 'two', 'three'];

        for (const value of values) {
          await addValue({
            cacheName: IntegrationTestCacheName,
            listName: listName,
            value: value,
            truncateToSize: 2,
          });
        }

        const respFetch = await Momento.listFetch(
          IntegrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${respFetch.toString()}`);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual([
          'three',
          'two',
        ]);
      });
    };

    describe('#listFetch', () => {
      itBehavesLikeItValidates((props: ValidateListProps) => {
        return Momento.listFetch(props.cacheName, props.listName);
      });

      it('returns a miss if the list does not exist', async () => {
        const respFetch = await Momento.listFetch(
          IntegrationTestCacheName,
          v4()
        );
        expect(respFetch).toBeInstanceOf(CacheListFetch.Miss);
      });

      it('returns a hit if the list exists', async () => {
        const listName = v4();
        const valueString = 'abc123';
        const valueBytes = new Uint8Array([97, 98, 99, 49, 50, 51]);

        await Momento.listPushFront(
          IntegrationTestCacheName,
          listName,
          valueString
        );

        const respFetch = await Momento.listFetch(
          IntegrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${respFetch.toString()}`);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual([
          valueString,
        ]);
        expect((respFetch as CacheListFetch.Hit).valueList()).toEqual([
          valueString,
        ]);
        expect((respFetch as CacheListFetch.Hit).valueListUint8Array()).toEqual(
          [valueBytes]
        );
      });

      it('returns a miss if the list is deleted', async () => {
        const listName = v4();
        await Momento.listPushFront(IntegrationTestCacheName, listName, '123');
        const respFetch = await Momento.listFetch(
          IntegrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${respFetch.toString()}`);

        const deleteResp = await Momento.delete(
          IntegrationTestCacheName,
          listName
        );
        expect(deleteResp).toBeInstanceOf(CacheDelete.Success);

        const respFetch2 = await Momento.listFetch(
          IntegrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(respFetch2).toBeInstanceOf(CacheListFetch.Miss);
        }, `expected a MISS but got ${respFetch.toString()}`);
      });

      it('returns a sliced hit if the list exists', async () => {
        const listName = v4();
        const valueArray = ['a', 'b', 'c', '1', '2', '3'];
        const valueStringExpected = ['c', '1'];

        await Momento.listConcatenateBack(
          IntegrationTestCacheName,
          listName,
          valueArray
        );

        const respFetch = await Momento.listFetch(
          IntegrationTestCacheName,
          listName,
          {
            startIndex: 2,
            endIndex: 4,
          }
        );

        expectWithMessage(() => {
          expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${respFetch.toString()}`);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
          valueStringExpected
        );
      });

      it('should support happy path for listFetch via curried cache via ICache interface', async () => {
        const listName = v4();

        const cache = Momento.cache(IntegrationTestCacheName);

        await cache.listConcatenateFront(listName, ['foo', 'bar']);

        const respFetch = await cache.listFetch(listName);
        expectWithMessage(() => {
          expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${respFetch.toString()}`);
        expect((respFetch as CacheListFetch.Hit).valueList()).toEqual([
          'foo',
          'bar',
        ]);
      });

      it('should support accessing value for CacheListFetch.Hit without instanceof check', async () => {
        const listName = v4();

        await Momento.listConcatenateFront(IntegrationTestCacheName, listName, [
          'foo',
          'bar',
        ]);

        let fetchResponse = await Momento.listFetch(
          IntegrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${fetchResponse.toString()}`);

        const expectedResult = ['foo', 'bar'];

        expect(fetchResponse.value()).toEqual(expectedResult);

        const hitResponse = fetchResponse as CacheListFetch.Hit;
        expect(hitResponse.value()).toEqual(expectedResult);
        expect(hitResponse.valueList()).toEqual(expectedResult);

        fetchResponse = await Momento.listFetch(IntegrationTestCacheName, v4());
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheListFetch.Miss);
        }, `expected a MISS but got ${fetchResponse.toString()}`);
        expect(fetchResponse.value()).toEqual(undefined);
      });
    });

    describe('#listLength', () => {
      itBehavesLikeItValidates((props: ValidateListProps) => {
        return Momento.listLength(props.cacheName, props.listName);
      });

      it('returns a miss if the list does not exist', async () => {
        const resp = await Momento.listLength(IntegrationTestCacheName, v4());
        expect(resp).toBeInstanceOf(CacheListLength.Miss);
      });

      it('returns the length if the list exists', async () => {
        const listName = v4();
        const values = ['one', 'two', 'three'];

        await Momento.listConcatenateFront(
          IntegrationTestCacheName,
          listName,
          values
        );

        const resp = await Momento.listLength(
          IntegrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheListLength.Hit);
        }, `expected a HIT but got ${resp.toString()}`);
        expect((resp as CacheListLength.Hit).length()).toEqual(values.length);
      });

      it('should support happy path for listLength via curried cache via ICache interface', async () => {
        const listName = v4();

        const cache = Momento.cache(IntegrationTestCacheName);

        await cache.listConcatenateFront(listName, ['foo', 'bar']);

        const response = await cache.listLength(listName);
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheListLength.Hit);
        }, `expected a HIT but got ${response.toString()}`);
        expect((response as CacheListLength.Hit).length()).toEqual(2);
      });
    });

    describe('#listPopBack', () => {
      itBehavesLikeItValidates((props: ValidateListProps) => {
        return Momento.listPopBack(props.cacheName, props.listName);
      });

      it('misses when the list does not exist', async () => {
        const resp = await Momento.listPopBack(IntegrationTestCacheName, v4());
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheListPopBack.Miss);
        }, `expected a MISS but got ${resp.toString()}`);
      });

      it('hits when the list exists', async () => {
        const listName = v4();
        const values = ['one', 'two', 'lol'];
        const poppedValue = values[values.length - 1];
        const poppedBinary = Uint8Array.of(108, 111, 108);

        await Momento.listConcatenateFront(
          IntegrationTestCacheName,
          listName,
          values
        );

        const resp = await Momento.listPopBack(
          IntegrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheListPopBack.Hit);
        }, `expected a HIT but got ${resp.toString()}`);
        expect((resp as CacheListPopBack.Hit).valueString()).toEqual(
          poppedValue
        );
        expect((resp as CacheListPopBack.Hit).valueUint8Array()).toEqual(
          poppedBinary
        );
      });

      it('should support happy path for listPopBack via curried cache via ICache interface', async () => {
        const listName = v4();

        const cache = Momento.cache(IntegrationTestCacheName);

        await cache.listConcatenateFront(listName, ['foo', 'bar']);

        const response = await cache.listPopBack(listName);
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheListPopBack.Hit);
        }, `expected a HIT but got ${response.toString()}`);
        expect((response as CacheListPopBack.Hit).valueString()).toEqual('bar');
      });

      it('should support accessing value for CacheListPopBack.Hit without instanceof check', async () => {
        const listName = v4();

        await Momento.listConcatenateFront(IntegrationTestCacheName, listName, [
          'foo',
          'bar',
        ]);

        let popResponse = await Momento.listPopBack(
          IntegrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(popResponse).toBeInstanceOf(CacheListPopBack.Hit);
        }, `expected a HIT but got ${popResponse.toString()}`);

        expect(popResponse.value()).toEqual('bar');

        const hitResponse = popResponse as CacheListPopBack.Hit;
        expect(hitResponse.value()).toEqual('bar');
        expect(hitResponse.valueString()).toEqual('bar');

        popResponse = await Momento.listPopBack(IntegrationTestCacheName, v4());
        expectWithMessage(() => {
          expect(popResponse).toBeInstanceOf(CacheListPopBack.Miss);
        }, `expected a MISS but got ${popResponse.toString()}`);
        expect(popResponse.value()).toEqual(undefined);
      });
    });

    describe('#listPopFront', () => {
      itBehavesLikeItValidates((props: ValidateListProps) => {
        return Momento.listPopFront(props.cacheName, props.listName);
      });

      it('misses when the list does not exist', async () => {
        const resp = await Momento.listPopFront(IntegrationTestCacheName, v4());
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheListPopFront.Miss);
        }, `expected a MISS but got ${resp.toString()}`);
      });

      it('hits when the list exists', async () => {
        const listName = v4();
        const values = ['lol', 'two', 'three'];
        const poppedValue = values[0];
        const poppedBinary = Uint8Array.of(108, 111, 108);

        await Momento.listConcatenateFront(
          IntegrationTestCacheName,
          listName,
          values
        );

        const resp = await Momento.listPopFront(
          IntegrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheListPopFront.Hit);
        }, `expected a HIT but got ${resp.toString()}`);
        expect((resp as CacheListPopFront.Hit).valueString()).toEqual(
          poppedValue
        );
        expect((resp as CacheListPopFront.Hit).valueUint8Array()).toEqual(
          poppedBinary
        );
      });

      it('should support happy path for listPopFront via curried cache via ICache interface', async () => {
        const listName = v4();

        const cache = Momento.cache(IntegrationTestCacheName);

        await cache.listConcatenateFront(listName, ['foo', 'bar']);

        const response = await cache.listPopFront(listName);
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheListPopFront.Hit);
        }, `expected a HIT but got ${response.toString()}`);
        expect((response as CacheListPopBack.Hit).valueString()).toEqual('foo');
      });

      it('should support accessing value for CacheListPopFront.Hit without instanceof check', async () => {
        const listName = v4();

        await Momento.listConcatenateFront(IntegrationTestCacheName, listName, [
          'foo',
          'bar',
        ]);

        let popResponse = await Momento.listPopFront(
          IntegrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(popResponse).toBeInstanceOf(CacheListPopFront.Hit);
        }, `expected a HIT but got ${popResponse.toString()}`);

        expect(popResponse.value()).toEqual('foo');

        const hitResponse = popResponse as CacheListPopBack.Hit;
        expect(hitResponse.value()).toEqual('foo');
        expect(hitResponse.valueString()).toEqual('foo');

        popResponse = await Momento.listPopFront(
          IntegrationTestCacheName,
          v4()
        );
        expectWithMessage(() => {
          expect(popResponse).toBeInstanceOf(CacheListPopFront.Miss);
        }, `expected a MISS but got ${popResponse.toString()}`);
        expect(popResponse.value()).toEqual(undefined);
      });
    });

    describe('#listPushBack', () => {
      itBehavesLikeItValidates((props: ValidateListProps) => {
        return Momento.listPushBack(props.cacheName, props.listName, v4());
      });

      itBehavesLikeItAddsValuesToTheBack((props: addValueProps) => {
        return Momento.listPushBack(
          props.cacheName,
          props.listName,
          props.value,
          {
            truncateFrontToSize: props.truncateToSize,
            ttl: props.ttl,
          }
        );
      });

      it('returns a CacheListPushBack response', async () => {
        const resp = await Momento.listPushBack(
          IntegrationTestCacheName,
          v4(),
          'test'
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheListPushBack.Success);
        }, `expected a SUCCESS but got ${resp.toString()}`);
      });

      it('should support happy path for listPushBack via curried cache via ICache interface', async () => {
        const listName = v4();

        const cache = Momento.cache(IntegrationTestCacheName);

        await cache.listConcatenateFront(listName, ['foo', 'bar']);

        const response = await cache.listPushBack(listName, 'baz');
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheListPushBack.Success);
        }, `expected a SUCCESS but got ${response.toString()}`);

        const fetchResponse = await cache.listFetch(listName);
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${fetchResponse.toString()}`);
        expect((fetchResponse as CacheListFetch.Hit).valueList()).toEqual([
          'foo',
          'bar',
          'baz',
        ]);
      });
    });

    describe('#listPushFront', () => {
      itBehavesLikeItValidates((props: ValidateListProps) => {
        return Momento.listPushFront(props.cacheName, props.listName, v4());
      });

      itBehavesLikeItAddsValuesToTheFront((props: addValueProps) => {
        return Momento.listPushFront(
          props.cacheName,
          props.listName,
          props.value,
          {
            truncateBackToSize: props.truncateToSize,
            ttl: props.ttl,
          }
        );
      });

      it('returns a CacheListPushFront response', async () => {
        const resp = await Momento.listPushFront(
          IntegrationTestCacheName,
          v4(),
          'test'
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheListPushFront.Success);
        }, `expected a SUCCESS but got ${resp.toString()}`);
      });

      it('should support happy path for listPushFront via curried cache via ICache interface', async () => {
        const listName = v4();

        const cache = Momento.cache(IntegrationTestCacheName);

        await cache.listConcatenateFront(listName, ['foo', 'bar']);

        const response = await cache.listPushFront(listName, 'baz');
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheListPushFront.Success);
        }, `expected a SUCCESS but got ${response.toString()}`);

        const fetchResponse = await cache.listFetch(listName);
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${fetchResponse.toString()}`);
        expect((fetchResponse as CacheListFetch.Hit).valueList()).toEqual([
          'baz',
          'foo',
          'bar',
        ]);
      });
    });

    describe('#listRemoveValue', () => {
      itBehavesLikeItValidates((props: ValidateListProps) => {
        return Momento.listRemoveValue(props.cacheName, props.listName, v4());
      });

      it('removes values', async () => {
        const listName = v4();
        const values = [
          'number 9',
          'turn me on',
          'number 9',
          'dead man',
          'number 9',
        ];
        const expectedValues = ['turn me on', 'dead man'];
        const removeValue = 'number 9';

        await Momento.listConcatenateFront(
          IntegrationTestCacheName,
          listName,
          values
        );

        const respRemove = await Momento.listRemoveValue(
          IntegrationTestCacheName,
          listName,
          removeValue
        );
        expect(respRemove).toBeInstanceOf(CacheListRemoveValue.Success);

        const respFetch = await Momento.listFetch(
          IntegrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${respFetch.toString()}`);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
          expectedValues
        );
      });

      it('should support happy path for listRemoveValue via curried cache via ICache interface', async () => {
        const listName = v4();

        const cache = Momento.cache(IntegrationTestCacheName);

        await cache.listConcatenateFront(listName, ['foo', 'bar', 'baz']);

        const response = await cache.listRemoveValue(listName, 'bar');
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheListRemoveValue.Success);
        }, `expected a SUCCESS but got ${response.toString()}`);

        const fetchResponse = await cache.listFetch(listName);
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${fetchResponse.toString()}`);
        expect((fetchResponse as CacheListFetch.Hit).valueList()).toEqual([
          'foo',
          'baz',
        ]);
      });
    });

    describe('#listRetain', () => {
      itBehavesLikeItValidates((props: ValidateListProps) => {
        return Momento.listRetain(props.cacheName, props.listName);
      });

      it('returns Success if the list does not exist', async () => {
        const resp = await Momento.listRetain(IntegrationTestCacheName, v4());
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheListRetain.Success);
        }, `expected a SUCCESS but got ${resp.toString()}`);
      });

      it('returns Success if the list exists', async () => {
        const listName = v4();
        const valueString = ['a', 'b', 'c', '1', '2', '3'];
        const valueStringExpected = ['b'];
        const valueBytesExpected = new Uint8Array([98]);

        const listPushResponse = await Momento.listConcatenateBack(
          IntegrationTestCacheName,
          listName,
          valueString
        );

        expectWithMessage(() => {
          expect(listPushResponse).toBeInstanceOf(
            CacheListConcatenateBack.Success
          );
        }, `expected a SUCCESS but got ${listPushResponse.toString()}`);

        const retainOptions = {
          startIndex: 1,
          endIndex: 2,
        };

        const respRetain = await Momento.listRetain(
          IntegrationTestCacheName,
          listName,
          retainOptions
        );
        expectWithMessage(() => {
          expect(respRetain).toBeInstanceOf(CacheListRetain.Success);
        }, `expected a SUCCESS but got ${respRetain.toString()}`);

        const respFetch = await Momento.listFetch(
          IntegrationTestCacheName,
          listName
        );

        expectWithMessage(() => {
          expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${respFetch.toString()}`);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
          valueStringExpected
        );
        expect((respFetch as CacheListFetch.Hit).valueList()).toEqual(
          valueStringExpected
        );
        expect((respFetch as CacheListFetch.Hit).valueListUint8Array()).toEqual(
          [valueBytesExpected]
        );
      });

      it('should support happy path for listRetain via curried cache via ICache interface', async () => {
        const listName = v4();

        const cache = Momento.cache(IntegrationTestCacheName);

        await cache.listConcatenateFront(listName, [
          'foo',
          'bar',
          'baz',
          'bam',
        ]);

        const response = await cache.listRetain(listName, {
          startIndex: 1,
          endIndex: 3,
        });
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheListRetain.Success);
        }, `expected a SUCCESS but got ${response.toString()}`);

        const fetchResponse = await cache.listFetch(listName);
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${fetchResponse.toString()}`);
        expect((fetchResponse as CacheListFetch.Hit).valueList()).toEqual([
          'bar',
          'baz',
        ]);
      });
    });

    describe('#listConcatenateBack', () => {
      itBehavesLikeItValidates((props: ValidateListProps) => {
        return Momento.listConcatenateBack(props.cacheName, props.listName, [
          v4(),
        ]);
      });

      itBehavesLikeItAddsValuesToTheBack((props: addValueProps) => {
        return Momento.listConcatenateBack(
          props.cacheName,
          props.listName,
          [props.value] as string[] | Uint8Array[],
          {
            truncateFrontToSize: props.truncateToSize,
            ttl: props.ttl,
          }
        );
      });

      it('adds multiple values', async () => {
        const listName = v4();
        const values1 = ['1', '2', '3', '4'];
        const values2 = ['this', 'that'];

        let respConcat = await Momento.listConcatenateBack(
          IntegrationTestCacheName,
          listName,
          values1
        );
        expectWithMessage(() => {
          expect(respConcat).toBeInstanceOf(CacheListConcatenateBack.Success);
        }, `expected a SUCCESS but got ${respConcat.toString()}`);
        expect(
          (respConcat as CacheListConcatenateBack.Success).listLength()
        ).toEqual(values1.length);

        let respFetch = await Momento.listFetch(
          IntegrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${respFetch.toString()}`);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
          values1
        );

        respConcat = await Momento.listConcatenateBack(
          IntegrationTestCacheName,
          listName,
          values2
        );
        expectWithMessage(() => {
          expect(respConcat).toBeInstanceOf(CacheListConcatenateBack.Success);
        }, `expected a SUCCESS but got ${respConcat.toString()}`);
        expect(
          (respConcat as CacheListConcatenateBack.Success).listLength()
        ).toEqual(values1.length + values2.length);

        respFetch = await Momento.listFetch(IntegrationTestCacheName, listName);
        expectWithMessage(() => {
          expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${respFetch.toString()}`);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
          values1.concat(values2)
        );
      });

      it('should support happy path for listConcatenateBack via curried cache via ICache interface', async () => {
        const listName = v4();

        const cache = Momento.cache(IntegrationTestCacheName);

        await cache.listConcatenateFront(listName, ['foo', 'bar']);

        const response = await cache.listConcatenateBack(listName, [
          'baz',
          'bam',
        ]);
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheListConcatenateBack.Success);
        }, `expected a SUCCESS but got ${response.toString()}`);

        const fetchResponse = await cache.listFetch(listName);
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${fetchResponse.toString()}`);
        expect((fetchResponse as CacheListFetch.Hit).valueList()).toEqual([
          'foo',
          'bar',
          'baz',
          'bam',
        ]);
      });
    });

    describe('#listConcatenateFront', () => {
      itBehavesLikeItValidates((props: ValidateListProps) => {
        return Momento.listConcatenateFront(props.cacheName, props.listName, [
          v4(),
        ]);
      });

      itBehavesLikeItAddsValuesToTheFront((props: addValueProps) => {
        return Momento.listConcatenateFront(
          props.cacheName,
          props.listName,
          [props.value] as string[] | Uint8Array[],
          {
            truncateBackToSize: props.truncateToSize,
            ttl: props.ttl,
          }
        );
      });

      it('adds multiple values', async () => {
        const listName = v4();
        const values1 = ['1', '2', '3', '4'];
        const values2 = ['this', 'that'];

        let respConcat = await Momento.listConcatenateFront(
          IntegrationTestCacheName,
          listName,
          values1
        );
        expectWithMessage(() => {
          expect(respConcat).toBeInstanceOf(CacheListConcatenateFront.Success);
        }, `expected a SUCCESS but got ${respConcat.toString()}`);
        expect(
          (respConcat as CacheListConcatenateFront.Success).listLength()
        ).toEqual(values1.length);

        let respFetch = await Momento.listFetch(
          IntegrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${respFetch.toString()}`);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
          values1
        );

        respConcat = await Momento.listConcatenateFront(
          IntegrationTestCacheName,
          listName,
          values2
        );
        expectWithMessage(() => {
          expect(respConcat).toBeInstanceOf(CacheListConcatenateFront.Success);
        }, `expected a SUCCESS but got ${respConcat.toString()}`);
        expect(
          (respConcat as CacheListConcatenateFront.Success).listLength()
        ).toEqual(values1.length + values2.length);

        respFetch = await Momento.listFetch(IntegrationTestCacheName, listName);
        expectWithMessage(() => {
          expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${respFetch.toString()}`);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
          values2.concat(values1)
        );
      });

      it('should support happy path for listConcatenateFront via curried cache via ICache interface', async () => {
        const listName = v4();

        const cache = Momento.cache(IntegrationTestCacheName);

        await cache.listConcatenateFront(listName, ['foo', 'bar']);

        const response = await cache.listConcatenateFront(listName, [
          'baz',
          'bam',
        ]);
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheListConcatenateFront.Success);
        }, `expected a SUCCESS but got ${response.toString()}`);

        const fetchResponse = await cache.listFetch(listName);
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${fetchResponse.toString()}`);
        expect((fetchResponse as CacheListFetch.Hit).valueList()).toEqual([
          'baz',
          'bam',
          'foo',
          'bar',
        ]);
      });
    });
  });
}
