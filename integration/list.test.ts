import {v4} from 'uuid';
import {sleep} from '../src/utils/sleep';
import {
  CollectionTtl,
  CacheListConcatenateFront,
  CacheListFetch,
  CacheListPushFront,
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
    truncateBackToSize?: number;
  }

  const sharedListAddToFrontSpecs = (
    addValue: (props: addValueProps) => Promise<ResponseBase>
  ) => {
    it('pushes to to the front', async () => {
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

    it('truncates', async () => {
      const listName = v4();
      const values = ['one', 'two', 'three'];

      for (const value of values) {
        await addValue({
          cacheName: IntegrationTestCacheName,
          listName: listName,
          value: value,
          truncateBackToSize: 2,
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
      expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
        values.reverse()
      );
    });

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

  describe('#listFetch', () => {
    sharedListValidationSpecs((cacheName: string, listName: string) => {
      return Momento.listFetch(cacheName, listName);
    });

    it('returns a miss if the list does not exist', async () => {
      const respFetch = await Momento.listFetch(
        IntegrationTestCacheName,
        'does-not-exist'
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

      const respFetch = <CacheListFetch.Hit>(
        await Momento.listFetch(IntegrationTestCacheName, listName)
      );
      expect(respFetch.valueListString()).toEqual([valueString]);
      expect(respFetch.valueListUint8Array()).toEqual([valueBytes]);
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
        props.truncateBackToSize
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
        props.truncateBackToSize
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
