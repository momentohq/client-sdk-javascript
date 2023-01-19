import {v4} from 'uuid';
import {sleep} from '../src/utils/sleep';
import {
  CollectionTtl,
  CacheListConcatenateBack,
  CacheListConcatenateFront,
  CacheListFetch,
  CacheListLength,
  CacheListPopBack,
  CacheListPopFront,
  CacheListPushBack,
  CacheListPushFront,
  CacheListRemoveValue,
  MomentoErrorCode,
} from '../src';
import {
  ResponseBase,
  IResponseError,
  IListResponseSuccess,
} from '../src/messages/responses/response-base';
import {SetupIntegrationTest} from './integration-setup';

const {Momento, IntegrationTestCacheName} = SetupIntegrationTest();

describe('lists', () => {
  const itBehavesLikeItValidates = (
    getResponse: (cacheName: string, listName: string) => Promise<ResponseBase>
  ) => {
    it('validates its cache name', async () => {
      const response = await getResponse('   ', v4());

      expect((response as IResponseError).errorCode()).toEqual(
        MomentoErrorCode.INVALID_ARGUMENT_ERROR
      );
    });

    it('validates its list name', async () => {
      const response = await getResponse(IntegrationTestCacheName, '  ');

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
      expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual([
        'three',
        'two',
      ]);
    });
  };

  describe('#listFetch', () => {
    itBehavesLikeItValidates((cacheName: string, listName: string) => {
      return Momento.listFetch(cacheName, listName);
    });

    it('returns a miss if the list does not exist', async () => {
      const respFetch = await Momento.listFetch(IntegrationTestCacheName, v4());
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

      const respFetch = <CacheListFetch.Hit>(
        await Momento.listFetch(IntegrationTestCacheName, listName)
      );
      expect(respFetch.valueListString()).toEqual([valueString]);
      expect(respFetch.valueListUint8Array()).toEqual([valueBytes]);
    });
  });

  describe('#listLength', () => {
    itBehavesLikeItValidates((cacheName: string, listName: string) => {
      return Momento.listLength(cacheName, listName);
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

      const resp = await Momento.listLength(IntegrationTestCacheName, listName);
      expect(resp).toBeInstanceOf(CacheListLength.Hit);
      expect((resp as CacheListLength.Hit).length()).toEqual(values.length);
    });
  });

  describe('#listPopBack', () => {
    itBehavesLikeItValidates((cacheName: string, listName: string) => {
      return Momento.listPopBack(cacheName, listName);
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
      expect((resp as CacheListPopBack.Hit).valueString()).toEqual(poppedValue);
      expect((resp as CacheListPopBack.Hit).valueUint8Array()).toEqual(
        poppedBinary
      );
    });
  });

  describe('#listPopFront', () => {
    itBehavesLikeItValidates((cacheName: string, listName: string) => {
      return Momento.listPopFront(cacheName, listName);
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
    itBehavesLikeItValidates((cacheName: string, listName: string) => {
      return Momento.listPushBack(cacheName, listName, v4());
    });

    itBehavesLikeItAddsValuesToTheBack((props: addValueProps) => {
      return Momento.listPushBack(
        props.cacheName,
        props.listName,
        props.value,
        props.ttl,
        props.truncateToSize
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
    itBehavesLikeItValidates((cacheName: string, listName: string) => {
      return Momento.listPushFront(cacheName, listName, v4());
    });

    itBehavesLikeItAddsValuesToTheFront((props: addValueProps) => {
      return Momento.listPushFront(
        props.cacheName,
        props.listName,
        props.value,
        props.ttl,
        props.truncateToSize
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
    itBehavesLikeItValidates((cacheName: string, listName: string) => {
      return Momento.listRemoveValue(cacheName, listName, v4());
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
      expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
        expectedValues
      );
    });
  });

  describe('#listConcatenateBack', () => {
    itBehavesLikeItValidates((cacheName: string, listName: string) => {
      return Momento.listConcatenateBack(cacheName, listName, [v4()]);
    });

    itBehavesLikeItAddsValuesToTheBack((props: addValueProps) => {
      return Momento.listConcatenateBack(
        props.cacheName,
        props.listName,
        [props.value] as string[] | Uint8Array[],
        props.ttl,
        props.truncateToSize
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
      expect(
        (respConcat as CacheListConcatenateBack.Success).listLength()
      ).toEqual(values1.length);

      let respFetch = await Momento.listFetch(
        IntegrationTestCacheName,
        listName
      );
      expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
        values1
      );

      respConcat = await Momento.listConcatenateBack(
        IntegrationTestCacheName,
        listName,
        values2
      );
      expect(
        (respConcat as CacheListConcatenateBack.Success).listLength()
      ).toEqual(values1.length + values2.length);

      respFetch = await Momento.listFetch(IntegrationTestCacheName, listName);
      expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
        values1.concat(values2)
      );
    });
  });

  describe('#listConcatenateFront', () => {
    itBehavesLikeItValidates((cacheName: string, listName: string) => {
      return Momento.listConcatenateFront(cacheName, listName, [v4()]);
    });

    itBehavesLikeItAddsValuesToTheFront((props: addValueProps) => {
      return Momento.listConcatenateFront(
        props.cacheName,
        props.listName,
        [props.value] as string[] | Uint8Array[],
        props.ttl,
        props.truncateToSize
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
      expect(
        (respConcat as CacheListConcatenateFront.Success).listLength()
      ).toEqual(values1.length);

      let respFetch = await Momento.listFetch(
        IntegrationTestCacheName,
        listName
      );
      expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
        values1
      );

      respConcat = await Momento.listConcatenateFront(
        IntegrationTestCacheName,
        listName,
        values2
      );
      expect(
        (respConcat as CacheListConcatenateFront.Success).listLength()
      ).toEqual(values1.length + values2.length);

      respFetch = await Momento.listFetch(IntegrationTestCacheName, listName);
      expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
        values2.concat(values1)
      );
    });
  });
});
