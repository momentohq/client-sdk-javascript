import {v4} from 'uuid';
import {sleep} from '../src/utils/sleep';
import {
  CollectionTtl,
  CacheListConcatenateBack,
  CacheListConcatenateFront,
  CacheListFetch,
  CacheListLength,
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
  const sharedListValidationSpecs = (
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

  const sharedListCollectionTtlSpecs = (
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

  const sharedListAddSpecs = (
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

  const sharedListAddToBackSpecs = (
    addValue: (props: addValueProps) => Promise<ResponseBase>
  ) => {
    sharedListCollectionTtlSpecs(addValue);
    sharedListAddSpecs(addValue);

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

  const sharedListAddToFrontSpecs = (
    addValue: (props: addValueProps) => Promise<ResponseBase>
  ) => {
    sharedListCollectionTtlSpecs(addValue);
    sharedListAddSpecs(addValue);

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
    sharedListValidationSpecs((cacheName: string, listName: string) => {
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
    sharedListValidationSpecs((cacheName: string, listName: string) => {
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

  describe('#listPushFront', () => {
    sharedListValidationSpecs((cacheName: string, listName: string) => {
      return Momento.listPushFront(cacheName, listName, v4());
    });

    sharedListAddToFrontSpecs((props: addValueProps) => {
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
    sharedListValidationSpecs((cacheName: string, listName: string) => {
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
    sharedListValidationSpecs((cacheName: string, listName: string) => {
      return Momento.listConcatenateBack(cacheName, listName, [v4()]);
    });

    sharedListAddToBackSpecs((props: addValueProps) => {
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
    sharedListValidationSpecs((cacheName: string, listName: string) => {
      return Momento.listConcatenateFront(cacheName, listName, [v4()]);
    });

    sharedListAddToFrontSpecs((props: addValueProps) => {
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
