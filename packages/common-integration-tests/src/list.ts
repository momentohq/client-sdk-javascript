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
        expect(respFetch).toBeInstanceOf(CacheListFetch.Miss);
      });

      it('refreshes ttl', async () => {
        const listName = v4();
        const values = ['one', 'two', 'three'];
        const timeout = 1;
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
        expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
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
        expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
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
        expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
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
        expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
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
        expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
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
        expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
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
        expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);

        const deleteResp = await Momento.delete(
          IntegrationTestCacheName,
          listName
        );
        expect(deleteResp).toBeInstanceOf(CacheDelete.Success);

        const respFetch2 = await Momento.listFetch(
          IntegrationTestCacheName,
          listName
        );
        expect(respFetch2).toBeInstanceOf(CacheListFetch.Miss);
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

        expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
          valueStringExpected
        );
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
        expect(resp).toBeInstanceOf(CacheListLength.Hit);
        expect((resp as CacheListLength.Hit).length()).toEqual(values.length);
      });
    });

    describe('#listPopBack', () => {
      itBehavesLikeItValidates((props: ValidateListProps) => {
        return Momento.listPopBack(props.cacheName, props.listName);
      });

      it('misses when the list does not exist', async () => {
        const resp = await Momento.listPopBack(IntegrationTestCacheName, v4());
        expect(resp).toBeInstanceOf(CacheListPopBack.Miss);
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
        expect(resp).toBeInstanceOf(CacheListPopBack.Hit);
        expect((resp as CacheListPopBack.Hit).valueString()).toEqual(
          poppedValue
        );
        expect((resp as CacheListPopBack.Hit).valueUint8Array()).toEqual(
          poppedBinary
        );
      });
    });

    describe('#listPopFront', () => {
      itBehavesLikeItValidates((props: ValidateListProps) => {
        return Momento.listPopFront(props.cacheName, props.listName);
      });

      it('misses when the list does not exist', async () => {
        const resp = await Momento.listPopFront(IntegrationTestCacheName, v4());
        expect(resp).toBeInstanceOf(CacheListPopFront.Miss);
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
        expect(resp).toBeInstanceOf(CacheListPopFront.Hit);
        expect((resp as CacheListPopFront.Hit).valueString()).toEqual(
          poppedValue
        );
        expect((resp as CacheListPopFront.Hit).valueUint8Array()).toEqual(
          poppedBinary
        );
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
        expect(resp).toBeInstanceOf(CacheListPushBack.Success);
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
        expect(resp).toBeInstanceOf(CacheListPushFront.Success);
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
        expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
          expectedValues
        );
      });
    });

    describe('#listRetain', () => {
      itBehavesLikeItValidates((props: ValidateListProps) => {
        return Momento.listRetain(props.cacheName, props.listName);
      });

      it('returns Success if the list does not exist', async () => {
        const respFetch = await Momento.listRetain(
          IntegrationTestCacheName,
          v4()
        );
        expect(respFetch).toBeInstanceOf(CacheListRetain.Success);
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

        expect(listPushResponse).toBeInstanceOf(
          CacheListConcatenateBack.Success
        );

        const retainOptions = {
          startIndex: 1,
          endIndex: 2,
        };

        const respRetain = <CacheListRetain.Success>(
          await Momento.listRetain(
            IntegrationTestCacheName,
            listName,
            retainOptions
          )
        );

        expect(respRetain).toBeInstanceOf(CacheListRetain.Success);

        const respFetch = <CacheListFetch.Hit>(
          await Momento.listFetch(IntegrationTestCacheName, listName)
        );

        expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        expect(respFetch.valueListString()).toEqual(valueStringExpected);
        expect(respFetch.valueList()).toEqual(valueStringExpected);
        expect(respFetch.valueListUint8Array()).toEqual([valueBytesExpected]);
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
        expect(respConcat).toBeInstanceOf(CacheListConcatenateBack.Success);
        expect(
          (respConcat as CacheListConcatenateBack.Success).listLength()
        ).toEqual(values1.length);

        let respFetch = await Momento.listFetch(
          IntegrationTestCacheName,
          listName
        );
        expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
          values1
        );

        respConcat = await Momento.listConcatenateBack(
          IntegrationTestCacheName,
          listName,
          values2
        );
        expect(respConcat).toBeInstanceOf(CacheListConcatenateBack.Success);
        expect(
          (respConcat as CacheListConcatenateBack.Success).listLength()
        ).toEqual(values1.length + values2.length);

        respFetch = await Momento.listFetch(IntegrationTestCacheName, listName);
        expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
          values1.concat(values2)
        );
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
        expect(respConcat).toBeInstanceOf(CacheListConcatenateFront.Success);
        expect(
          (respConcat as CacheListConcatenateFront.Success).listLength()
        ).toEqual(values1.length);

        let respFetch = await Momento.listFetch(
          IntegrationTestCacheName,
          listName
        );
        expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
          values1
        );

        respConcat = await Momento.listConcatenateFront(
          IntegrationTestCacheName,
          listName,
          values2
        );
        expect(respConcat).toBeInstanceOf(CacheListConcatenateFront.Success);
        expect(
          (respConcat as CacheListConcatenateFront.Success).listLength()
        ).toEqual(values1.length + values2.length);

        respFetch = await Momento.listFetch(IntegrationTestCacheName, listName);
        expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
          values2.concat(values1)
        );
      });
    });
  });
}
