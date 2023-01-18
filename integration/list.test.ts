import {v4} from 'uuid';
import {sleep} from '../src/utils/sleep';
import {
  CollectionTtl,
  CacheListFetch,
  CacheListPushFront,
  MomentoErrorCode,
} from '../src';
import {
  ResponseBase,
  IResponseError,
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

    it('pushes to to the front', async () => {
      const listName = v4();
      const values = ['one', 'two', 'three'];

      for (const value of values) {
        await Momento.listPushFront(IntegrationTestCacheName, listName, value);
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
        await Momento.listPushFront(
          IntegrationTestCacheName,
          listName,
          value,
          undefined,
          2
        );
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
        await Momento.listPushFront(
          IntegrationTestCacheName,
          listName,
          value,
          ttl
        );
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
        await Momento.listPushFront(
          IntegrationTestCacheName,
          listName,
          value,
          ttl
        );
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
        const resp = <CacheListPushFront.Success>(
          await Momento.listPushFront(IntegrationTestCacheName, listName, value)
        );
        length++;
        expect(resp.listLength()).toEqual(length);
      }
    });
  });
});
