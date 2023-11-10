import {v4} from 'uuid';
import {
  CacheDelete,
  CacheSetAddElements,
  CacheSetAddElement,
  CacheSetFetch,
  CacheSetRemoveElements,
  CacheSetRemoveElement,
  CollectionTtl,
  MomentoErrorCode,
} from '@gomomento/sdk-core';
import {
  ValidateCacheProps,
  ValidateSetProps,
  ItBehavesLikeItValidatesCacheName,
  expectWithMessage,
} from './common-int-test-utils';
import {
  IResponseError,
  ResponseBase,
} from '@gomomento/sdk-core/dist/src/messages/responses/response-base';
import {sleep} from '@gomomento/sdk-core/dist/src/internal/utils';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {describe, it, expect} from 'vitest';

const LOL_BYTE_ARRAY = Uint8Array.of(108, 111, 108);
const FOO_BYTE_ARRAY = Uint8Array.of(102, 111, 111);

export function runSetTests(
  cacheClient: ICacheClient,
  integrationTestCacheName: string
) {
  describe('Integration tests for convenience operations on sets datastructure', () => {
    const itBehavesLikeItValidates = (
      getResponse: (props: ValidateSetProps) => Promise<ResponseBase>
    ) => {
      ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
        return getResponse({cacheName: props.cacheName, setName: v4()});
      });

      it('validates its set name', async () => {
        const response = await getResponse({
          cacheName: integrationTestCacheName,
          setName: '  ',
        });

        expect((response as IResponseError).errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      });
    };

    itBehavesLikeItValidates((props: ValidateSetProps) => {
      return cacheClient.setAddElement(props.cacheName, props.setName, v4());
    });
    itBehavesLikeItValidates((props: ValidateSetProps) => {
      return cacheClient.setAddElements(props.cacheName, props.setName, [v4()]);
    });
    itBehavesLikeItValidates((props: ValidateSetProps) => {
      return cacheClient.setFetch(props.cacheName, props.setName);
    });
    itBehavesLikeItValidates((props: ValidateSetProps) => {
      return cacheClient.setRemoveElements(props.cacheName, props.setName, [
        v4(),
      ]);
    });
  });

  describe('#addElement', () => {
    it('should succeed for addElement with a byte array happy path', async () => {
      const setName = v4();
      const addResponse = await cacheClient.setAddElement(
        integrationTestCacheName,
        setName,
        LOL_BYTE_ARRAY
      );
      expectWithMessage(() => {
        expect(addResponse).toBeInstanceOf(CacheSetAddElement.Success);
      }, `expected SUCCESS but got ${addResponse.toString()}`);

      const fetchResponse = await cacheClient.setFetch(
        integrationTestCacheName,
        setName
      );
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
      }, `expected HIT but got ${fetchResponse.toString()}`);
      expect((fetchResponse as CacheSetFetch.Hit).valueSetUint8Array()).toEqual(
        new Set([LOL_BYTE_ARRAY])
      );
    });

    it('should succeed for addElement with a string happy path', async () => {
      const setName = v4();
      const addResponse = await cacheClient.setAddElement(
        integrationTestCacheName,
        setName,
        'lol'
      );
      expectWithMessage(() => {
        expect(addResponse).toBeInstanceOf(CacheSetAddElement.Success);
      }, `expected SUCCESS but got ${addResponse.toString()}`);

      const fetchResponse = await cacheClient.setFetch(
        integrationTestCacheName,
        setName
      );
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
      }, `expected HIT but got ${fetchResponse.toString()}`);
      expect((fetchResponse as CacheSetFetch.Hit).valueSetUint8Array()).toEqual(
        new Set([LOL_BYTE_ARRAY])
      );
    });

    it('should support happy path for addElement via curried cache via ICache interface', async () => {
      const setName = v4();

      const cache = cacheClient.cache(integrationTestCacheName);

      await cache.setAddElements(setName, ['foo', 'bar']);

      const response = await cache.setAddElement(setName, 'baz');
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheSetAddElement.Success);
      }, `expected a SUCCESS but got ${response.toString()}`);

      const fetchResponse = await cache.setFetch(setName);
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
      }, `expected a HIT but got ${fetchResponse.toString()}`);
      expect((fetchResponse as CacheSetFetch.Hit).valueSet()).toEqual(
        new Set(['foo', 'bar', 'baz'])
      );
    });
  });

  describe('#removeElement', () => {
    it('should succeed for removeElement with a byte array happy path', async () => {
      const setName = v4();
      const addResponse = await cacheClient.setAddElements(
        integrationTestCacheName,
        setName,
        [FOO_BYTE_ARRAY, LOL_BYTE_ARRAY]
      );
      expectWithMessage(() => {
        expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);
      }, `expected SUCCESS but got ${addResponse.toString()}`);

      const removeResponse = await cacheClient.setRemoveElement(
        integrationTestCacheName,
        setName,
        FOO_BYTE_ARRAY
      );
      expect(removeResponse).toBeInstanceOf(CacheSetRemoveElement.Success);

      const fetchResponse = await cacheClient.setFetch(
        integrationTestCacheName,
        setName
      );
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
      }, `expected HIT but got ${fetchResponse.toString()}`);
      expect((fetchResponse as CacheSetFetch.Hit).valueSetUint8Array()).toEqual(
        new Set([LOL_BYTE_ARRAY])
      );
    });

    it('should succeed for removeElement with a string array happy path', async () => {
      const setName = v4();
      const addResponse = await cacheClient.setAddElements(
        integrationTestCacheName,
        setName,
        [FOO_BYTE_ARRAY, LOL_BYTE_ARRAY]
      );
      expectWithMessage(() => {
        expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);
      }, `expected SUCCESS but got ${addResponse.toString()}`);

      const removeResponse = await cacheClient.setRemoveElement(
        integrationTestCacheName,
        setName,
        'foo'
      );
      expectWithMessage(() => {
        expect(removeResponse).toBeInstanceOf(CacheSetRemoveElement.Success);
      }, `expected SUCCESS but got ${removeResponse.toString()}`);

      const fetchResponse = await cacheClient.setFetch(
        integrationTestCacheName,
        setName
      );
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
      }, `expected HIT but got ${fetchResponse.toString()}`);
      expect((fetchResponse as CacheSetFetch.Hit).valueSetUint8Array()).toEqual(
        new Set([LOL_BYTE_ARRAY])
      );
    });

    it('should support happy path for removeElement via curried cache via ICache interface', async () => {
      const setName = v4();

      const cache = cacheClient.cache(integrationTestCacheName);

      await cache.setAddElements(setName, ['foo', 'bar', 'baz']);

      const response = await cache.setRemoveElement(setName, 'bar');
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheSetRemoveElement.Success);
      }, `expected a SUCCESS but got ${response.toString()}`);

      const fetchResponse = await cache.setFetch(setName);
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
      }, `expected a HIT but got ${fetchResponse.toString()}`);
      expect((fetchResponse as CacheSetFetch.Hit).valueSet()).toEqual(
        new Set(['foo', 'baz'])
      );
    });
  });

  describe('#addElements', () => {
    it('should succeed for addElements with byte arrays happy path', async () => {
      const setName = v4();
      const addResponse = await cacheClient.setAddElements(
        integrationTestCacheName,
        setName,
        [LOL_BYTE_ARRAY, FOO_BYTE_ARRAY]
      );
      expectWithMessage(() => {
        expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);
      }, `expected SUCCESS but got ${addResponse.toString()}`);

      const fetchResponse = await cacheClient.setFetch(
        integrationTestCacheName,
        setName
      );
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
      }, `expected HIT but got ${fetchResponse.toString()}`);
      expect((fetchResponse as CacheSetFetch.Hit).valueSetUint8Array()).toEqual(
        new Set([LOL_BYTE_ARRAY, FOO_BYTE_ARRAY])
      );
    });

    it('should succeed for addElements with byte arrays happy path with no refresh ttl', async () => {
      const setName = v4();
      let addResponse = await cacheClient.setAddElements(
        integrationTestCacheName,
        setName,
        [LOL_BYTE_ARRAY, FOO_BYTE_ARRAY],
        {ttl: new CollectionTtl(2, false)}
      );
      expectWithMessage(() => {
        expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);
      }, `expected SUCCESS but got ${addResponse.toString()}`);

      addResponse = await cacheClient.setAddElements(
        integrationTestCacheName,
        setName,
        [LOL_BYTE_ARRAY, FOO_BYTE_ARRAY],
        {ttl: new CollectionTtl(10, false)}
      );
      expectWithMessage(() => {
        expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);
      }, `expected SUCCESS but got ${addResponse.toString()}`);

      await sleep(2_000);

      const fetchResponse = await cacheClient.setFetch(
        integrationTestCacheName,
        setName
      );
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Miss);
      }, `expected MISS but got ${fetchResponse.toString()}`);
    });

    it('should succeed for addElements with byte arrays happy path with refresh ttl', async () => {
      const setName = v4();
      let addResponse = await cacheClient.setAddElements(
        integrationTestCacheName,
        setName,
        [LOL_BYTE_ARRAY, FOO_BYTE_ARRAY],
        {ttl: new CollectionTtl(2, false)}
      );
      expectWithMessage(() => {
        expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);
      }, `expected SUCCESS but got ${addResponse.toString()}`);

      addResponse = await cacheClient.setAddElements(
        integrationTestCacheName,
        setName,
        [LOL_BYTE_ARRAY, FOO_BYTE_ARRAY],
        {ttl: new CollectionTtl(10, true)}
      );
      expectWithMessage(() => {
        expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);
      }, `expected SUCCESS but got ${addResponse.toString()}`);

      await sleep(2_000);

      const fetchResponse = await cacheClient.setFetch(
        integrationTestCacheName,
        setName
      );
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
      }, `expected HIT but got ${fetchResponse.toString()}`);
      const hit = fetchResponse as CacheSetFetch.Hit;
      expect(hit.valueSetUint8Array()).toEqual(
        new Set([LOL_BYTE_ARRAY, FOO_BYTE_ARRAY])
      );
      expect(hit.valueArrayUint8Array().length).toBe(2);
      expect(hit.valueArrayUint8Array()).toContainAllValues([
        LOL_BYTE_ARRAY,
        FOO_BYTE_ARRAY,
      ]);
    });

    it('should succeed for addElements for string arrays happy path', async () => {
      const setName = v4();
      const addResponse = await cacheClient.setAddElements(
        integrationTestCacheName,
        setName,
        ['lol', 'foo']
      );
      expectWithMessage(() => {
        expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);
      }, `expected SUCCESS but got ${addResponse.toString()}`);

      const fetchResponse = await cacheClient.setFetch(
        integrationTestCacheName,
        setName
      );
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
      }, `expected HIT but got ${fetchResponse.toString()}`);
      const hit = fetchResponse as CacheSetFetch.Hit;
      expect(hit.valueSet()).toEqual(new Set(['lol', 'foo']));
      expect(hit.valueSetString()).toEqual(new Set(['lol', 'foo']));
      expect(hit.valueArray()).toBeArrayOfSize(2);
      expect(hit.valueArray()).toContainAllValues(['lol', 'foo']);
      expect(hit.valueArrayString()).toBeArrayOfSize(2);
      expect(hit.valueArrayString()).toContainAllValues(['lol', 'foo']);
    });

    it('should succeed for addElements with duplicate elements', async () => {
      const setName = v4();
      let addResponse = await cacheClient.setAddElements(
        integrationTestCacheName,
        setName,
        [LOL_BYTE_ARRAY, FOO_BYTE_ARRAY]
      );
      expectWithMessage(() => {
        expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);
      }, `expected SUCCESS but got ${addResponse.toString()}`);
      addResponse = await cacheClient.setAddElements(
        integrationTestCacheName,
        setName,
        [LOL_BYTE_ARRAY]
      );
      expectWithMessage(() => {
        expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);
      }, `expected SUCCESS but got ${addResponse.toString()}`);

      const fetchResponse = await cacheClient.setFetch(
        integrationTestCacheName,
        setName
      );
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
      }, `expected HIT but got ${fetchResponse.toString()}`);
      expect((fetchResponse as CacheSetFetch.Hit).valueSetUint8Array()).toEqual(
        new Set([LOL_BYTE_ARRAY, FOO_BYTE_ARRAY])
      );
    });

    it('should support happy path for addElements via curried cache via ICache interface', async () => {
      const setName = v4();

      const cache = cacheClient.cache(integrationTestCacheName);

      await cache.setAddElements(setName, ['foo', 'bar']);

      const response = await cache.setAddElements(setName, ['baz', 'bam']);
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheSetAddElements.Success);
      }, `expected a SUCCESS but got ${response.toString()}`);

      const fetchResponse = await cache.setFetch(setName);
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
      }, `expected a HIT but got ${fetchResponse.toString()}`);
      expect((fetchResponse as CacheSetFetch.Hit).valueSet()).toEqual(
        new Set(['foo', 'bar', 'baz', 'bam'])
      );
    });
  });

  describe('#removeElements', () => {
    it('should succeed for removeElements byte arrays happy path', async () => {
      const setName = v4();
      const addResponse = await cacheClient.setAddElements(
        integrationTestCacheName,
        setName,
        [LOL_BYTE_ARRAY, FOO_BYTE_ARRAY]
      );
      expectWithMessage(() => {
        expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);
      }, `expected SUCCESS but got ${addResponse.toString()}`);

      const removeResponse = await cacheClient.setRemoveElements(
        integrationTestCacheName,
        setName,
        [FOO_BYTE_ARRAY]
      );
      expectWithMessage(() => {
        expect(removeResponse).toBeInstanceOf(CacheSetRemoveElements.Success);
      }, `expected SUCCESS but got ${removeResponse.toString()}`);

      const fetchResponse = await cacheClient.setFetch(
        integrationTestCacheName,
        setName
      );
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
      }, `expected HIT but got ${fetchResponse.toString()}`);
      expect((fetchResponse as CacheSetFetch.Hit).valueSetUint8Array()).toEqual(
        new Set([LOL_BYTE_ARRAY])
      );
    });

    it('should succeed for removeElements string arrays happy path', async () => {
      const setName = v4();
      const addResponse = await cacheClient.setAddElements(
        integrationTestCacheName,
        setName,
        ['lol', 'foo']
      );
      expectWithMessage(() => {
        expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);
      }, `expected SUCCESS but got ${addResponse.toString()}`);

      const removeResponse = await cacheClient.setRemoveElements(
        integrationTestCacheName,
        setName,
        ['foo']
      );
      expectWithMessage(() => {
        expect(removeResponse).toBeInstanceOf(CacheSetRemoveElements.Success);
      }, `expected SUCCESS but got ${removeResponse.toString()}`);

      const fetchResponse = await cacheClient.setFetch(
        integrationTestCacheName,
        setName
      );
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
      }, `expected HIT but got ${fetchResponse.toString()}`);
      expect((fetchResponse as CacheSetFetch.Hit).valueSetString()).toEqual(
        new Set(['lol'])
      );
    });

    it('should succeed for removeElements when the element does not exist', async () => {
      const setName = v4();
      const addResponse = await cacheClient.setAddElements(
        integrationTestCacheName,
        setName,
        [LOL_BYTE_ARRAY]
      );
      expectWithMessage(() => {
        expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);
      }, `expected SUCCESS but got ${addResponse.toString()}`);

      const removeResponse = await cacheClient.setRemoveElements(
        integrationTestCacheName,
        setName,
        [FOO_BYTE_ARRAY]
      );
      expectWithMessage(() => {
        expect(removeResponse).toBeInstanceOf(CacheSetRemoveElements.Success);
      }, `expected SUCCESS but got ${removeResponse.toString()}`);

      const fetchResponse = await cacheClient.setFetch(
        integrationTestCacheName,
        setName
      );
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
      }, `expected HIT but got ${fetchResponse.toString()}`);
      expect((fetchResponse as CacheSetFetch.Hit).valueSetUint8Array()).toEqual(
        new Set([LOL_BYTE_ARRAY])
      );
    });

    it('should succeed for removeElements when bytes/strings are used together', async () => {
      const setName = v4();
      const addResponse = await cacheClient.setAddElements(
        integrationTestCacheName,
        setName,
        [LOL_BYTE_ARRAY, FOO_BYTE_ARRAY]
      );
      expectWithMessage(() => {
        expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);
      }, `expected SUCCESS but got ${addResponse.toString()}`);

      const removeResponse = await cacheClient.setRemoveElements(
        integrationTestCacheName,
        setName,
        ['lol']
      );
      expectWithMessage(() => {
        expect(removeResponse).toBeInstanceOf(CacheSetRemoveElements.Success);
      }, `expected SUCCESS but got ${removeResponse.toString()}`);

      const fetchResponse = await cacheClient.setFetch(
        integrationTestCacheName,
        setName
      );
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
      }, `expected HIT but got ${fetchResponse.toString()}`);
      expect((fetchResponse as CacheSetFetch.Hit).valueSetUint8Array()).toEqual(
        new Set([FOO_BYTE_ARRAY])
      );
    });

    it('should support happy path for removeElements via curried cache via ICache interface', async () => {
      const setName = v4();

      const cache = cacheClient.cache(integrationTestCacheName);

      await cache.setAddElements(setName, ['foo', 'bar', 'baz', 'bam']);

      const response = await cache.setRemoveElements(setName, ['bar', 'baz']);
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheSetRemoveElements.Success);
      }, `expected a SUCCESS but got ${response.toString()}`);

      const fetchResponse = await cache.setFetch(setName);
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
      }, `expected a HIT but got ${fetchResponse.toString()}`);
      expect((fetchResponse as CacheSetFetch.Hit).valueSet()).toEqual(
        new Set(['foo', 'bam'])
      );
    });
  });

  describe('#setFetch', () => {
    it('should succeed for string arrays happy path', async () => {
      const setName = v4();
      const addResponse = await cacheClient.setAddElements(
        integrationTestCacheName,
        setName,
        ['how', 'ya', 'ding']
      );
      expectWithMessage(() => {
        expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);
      }, `expected SUCCESS but got ${addResponse.toString()}`);

      const fetchResponse = await cacheClient.setFetch(
        integrationTestCacheName,
        setName
      );
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
      }, `expected HIT but got ${fetchResponse.toString()}`);
      const hit = fetchResponse as CacheSetFetch.Hit;
      expect(hit.valueSet()).toEqual(new Set(['how', 'ya', 'ding']));
      expect(hit.valueSetString()).toEqual(new Set(['how', 'ya', 'ding']));
      expect(hit.valueArray()).toBeArrayOfSize(3);
      expect(hit.valueArray()).toContainAllValues(['how', 'ya', 'ding']);
      expect(hit.valueArrayString()).toBeArrayOfSize(3);
      expect(hit.valueArrayString()).toContainAllValues(['how', 'ya', 'ding']);
    });

    it('should return MISS if set does not exist', async () => {
      const noKeyGetResponse = await cacheClient.setFetch(
        integrationTestCacheName,
        'this-set-doesnt-exist'
      );
      expect(noKeyGetResponse).toBeInstanceOf(CacheSetFetch.Miss);
    });

    it('should return MISS if set has been deleted', async () => {
      const setName = v4();
      const addResponse = await cacheClient.setAddElements(
        integrationTestCacheName,
        setName,
        [LOL_BYTE_ARRAY, FOO_BYTE_ARRAY]
      );
      expectWithMessage(() => {
        expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);
      }, `expected SUCCESS but got ${addResponse.toString()}`);
      const deleteResponse = await cacheClient.delete(
        integrationTestCacheName,
        setName
      );
      expect(deleteResponse).toBeInstanceOf(CacheDelete.Success);
      const fetchResponse = await cacheClient.setFetch(
        integrationTestCacheName,
        setName
      );
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Miss);
      }, `expected MISS but got ${fetchResponse.toString()}`);
    });

    it('should support happy path for fetch via curried cache via ICache interface', async () => {
      const setName = v4();

      const cache = cacheClient.cache(integrationTestCacheName);

      await cache.setAddElements(setName, ['foo', 'bar']);

      const fetchResponse = await cache.setFetch(setName);
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
      }, `expected a HIT but got ${fetchResponse.toString()}`);
      expect((fetchResponse as CacheSetFetch.Hit).valueSet()).toEqual(
        new Set(['foo', 'bar'])
      );
    });

    it('should support accessing value for CacheSetFetch.Hit without instanceof check', async () => {
      const setName = v4();

      await cacheClient.setAddElements(integrationTestCacheName, setName, [
        'foo',
        'bar',
      ]);

      let fetchResponse = await cacheClient.setFetch(
        integrationTestCacheName,
        setName
      );
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
      }, `expected a HIT but got ${fetchResponse.toString()}`);

      const expectedResult = ['foo', 'bar'];

      expect(new Set(fetchResponse.value())).toEqual(new Set(expectedResult));

      const hit = fetchResponse as CacheSetFetch.Hit;
      expect(new Set(hit.value())).toEqual(new Set(expectedResult));
      expect(new Set(hit.valueArray())).toEqual(new Set(expectedResult));

      fetchResponse = await cacheClient.setFetch(
        integrationTestCacheName,
        v4()
      );
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Miss);
      }, `expected a MISS but got ${fetchResponse.toString()}`);

      expect(fetchResponse.value()).toEqual(undefined);
    });
  });
}
