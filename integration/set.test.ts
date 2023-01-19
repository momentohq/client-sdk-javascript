import {v4} from 'uuid';
import {sleep} from '../src/utils/sleep';
import {
  CacheSetAddElements,
  CacheSetAddElement,
  CacheSetFetch,
  CacheSetRemoveElements,
  CacheSetRemoveElement,
  CollectionTtl,
} from '../src';
import {SetupIntegrationTest} from './integration-setup';

const {Momento, IntegrationTestCacheName} = SetupIntegrationTest();

const LOL_BYTE_ARRAY = Uint8Array.of(108, 111, 108);
const FOO_BYTE_ARRAY = Uint8Array.of(102, 111, 111);

describe('Integration tests for convenience operations on sets datastructure', () => {
  it('should succeed for addElement with a byte array happy path', async () => {
    const setName = v4();
    const addResponse = await Momento.setAddElement(
      IntegrationTestCacheName,
      setName,
      LOL_BYTE_ARRAY
    );
    expect(addResponse).toBeInstanceOf(CacheSetAddElement.Success);

    const fetchResponse = await Momento.setFetch(
      IntegrationTestCacheName,
      setName
    );
    expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
    expect((fetchResponse as CacheSetFetch.Hit).valueSetUint8Array()).toEqual(
      new Set([LOL_BYTE_ARRAY])
    );
  });
  it('should succeed for addElement with a string happy path', async () => {
    const setName = v4();
    const addResponse = await Momento.setAddElement(
      IntegrationTestCacheName,
      setName,
      'lol'
    );
    expect(addResponse).toBeInstanceOf(CacheSetAddElement.Success);

    const fetchResponse = await Momento.setFetch(
      IntegrationTestCacheName,
      setName
    );
    expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
    expect((fetchResponse as CacheSetFetch.Hit).valueSetUint8Array()).toEqual(
      new Set([LOL_BYTE_ARRAY])
    );
  });

  it('should succeed for removeElement with a byte array happy path', async () => {
    const setName = v4();
    const addResponse = await Momento.setAddElements(
      IntegrationTestCacheName,
      setName,
      [FOO_BYTE_ARRAY, LOL_BYTE_ARRAY]
    );
    expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);

    const removeResponse = await Momento.setRemoveElement(
      IntegrationTestCacheName,
      setName,
      FOO_BYTE_ARRAY
    );
    expect(removeResponse).toBeInstanceOf(CacheSetRemoveElement.Success);

    const fetchResponse = await Momento.setFetch(
      IntegrationTestCacheName,
      setName
    );
    expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
    expect((fetchResponse as CacheSetFetch.Hit).valueSetUint8Array()).toEqual(
      new Set([LOL_BYTE_ARRAY])
    );
  });

  it('should succeed for removeElement with a string array happy path', async () => {
    const setName = v4();
    const addResponse = await Momento.setAddElements(
      IntegrationTestCacheName,
      setName,
      [FOO_BYTE_ARRAY, LOL_BYTE_ARRAY]
    );
    expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);

    const removeResponse = await Momento.setRemoveElement(
      IntegrationTestCacheName,
      setName,
      'foo'
    );
    expect(removeResponse).toBeInstanceOf(CacheSetRemoveElement.Success);

    const fetchResponse = await Momento.setFetch(
      IntegrationTestCacheName,
      setName
    );
    expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
    expect((fetchResponse as CacheSetFetch.Hit).valueSetUint8Array()).toEqual(
      new Set([LOL_BYTE_ARRAY])
    );
  });
});

describe('Integration Tests for operations on sets datastructure', () => {
  it('should succeed for addElements with byte arrays happy path', async () => {
    const setName = v4();
    const addResponse = await Momento.setAddElements(
      IntegrationTestCacheName,
      setName,
      [LOL_BYTE_ARRAY, FOO_BYTE_ARRAY]
    );
    expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);

    const fetchResponse = await Momento.setFetch(
      IntegrationTestCacheName,
      setName
    );
    expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
    expect((fetchResponse as CacheSetFetch.Hit).valueSetUint8Array()).toEqual(
      new Set([LOL_BYTE_ARRAY, FOO_BYTE_ARRAY])
    );
  });
  it('should succeed for addElements with byte arrays happy path with no refresh ttl', async () => {
    const setName = v4();
    let addResponse = await Momento.setAddElements(
      IntegrationTestCacheName,
      setName,
      [LOL_BYTE_ARRAY, FOO_BYTE_ARRAY],
      new CollectionTtl(2, false)
    );
    expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);

    addResponse = await Momento.setAddElements(
      IntegrationTestCacheName,
      setName,
      [LOL_BYTE_ARRAY, FOO_BYTE_ARRAY],
      new CollectionTtl(10, false)
    );
    expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);

    await sleep(2_000);

    const fetchResponse = await Momento.setFetch(
      IntegrationTestCacheName,
      setName
    );
    expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Miss);
  });
  it('should succeed for addElements with byte arrays happy path with refresh ttl', async () => {
    const setName = v4();
    let addResponse = await Momento.setAddElements(
      IntegrationTestCacheName,
      setName,
      [LOL_BYTE_ARRAY, FOO_BYTE_ARRAY],
      new CollectionTtl(2, false)
    );
    expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);

    addResponse = await Momento.setAddElements(
      IntegrationTestCacheName,
      setName,
      [LOL_BYTE_ARRAY, FOO_BYTE_ARRAY],
      new CollectionTtl(10, true)
    );
    expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);

    await sleep(2_000);

    const fetchResponse = await Momento.setFetch(
      IntegrationTestCacheName,
      setName
    );
    expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
    expect((fetchResponse as CacheSetFetch.Hit).valueSetUint8Array()).toEqual(
      new Set([LOL_BYTE_ARRAY, FOO_BYTE_ARRAY])
    );
  });
  it('should succeed for addElements for string arrays happy path', async () => {
    const setName = v4();
    const addResponse = await Momento.setAddElements(
      IntegrationTestCacheName,
      setName,
      ['lol', 'foo']
    );
    expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);

    const fetchResponse = await Momento.setFetch(
      IntegrationTestCacheName,
      setName
    );
    expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
    expect((fetchResponse as CacheSetFetch.Hit).valueSetString()).toEqual(
      new Set(['lol', 'foo'])
    );
  });
  it('should succeed for addElements with duplicate elements', async () => {
    const setName = v4();
    let addResponse = await Momento.setAddElements(
      IntegrationTestCacheName,
      setName,
      [LOL_BYTE_ARRAY, FOO_BYTE_ARRAY]
    );
    expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);
    addResponse = await Momento.setAddElements(
      IntegrationTestCacheName,
      setName,
      [LOL_BYTE_ARRAY]
    );
    expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);

    const fetchResponse = await Momento.setFetch(
      IntegrationTestCacheName,
      setName
    );
    expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
    expect((fetchResponse as CacheSetFetch.Hit).valueSetUint8Array()).toEqual(
      new Set([LOL_BYTE_ARRAY, FOO_BYTE_ARRAY])
    );
  });
  it('should succeed for removeElements byte arrays happy path', async () => {
    const setName = v4();
    const addResponse = await Momento.setAddElements(
      IntegrationTestCacheName,
      setName,
      [LOL_BYTE_ARRAY, FOO_BYTE_ARRAY]
    );
    expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);

    const removeResponse = await Momento.setRemoveElements(
      IntegrationTestCacheName,
      setName,
      [FOO_BYTE_ARRAY]
    );
    expect(removeResponse).toBeInstanceOf(CacheSetRemoveElements.Success);

    const fetchResponse = await Momento.setFetch(
      IntegrationTestCacheName,
      setName
    );
    expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
    expect((fetchResponse as CacheSetFetch.Hit).valueSetUint8Array()).toEqual(
      new Set([LOL_BYTE_ARRAY])
    );
  });
  it('should succeed for removeElements string arrays happy path', async () => {
    const setName = v4();
    const addResponse = await Momento.setAddElements(
      IntegrationTestCacheName,
      setName,
      ['lol', 'foo']
    );
    expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);

    const removeResponse = await Momento.setRemoveElements(
      IntegrationTestCacheName,
      setName,
      ['foo']
    );
    expect(removeResponse).toBeInstanceOf(CacheSetRemoveElements.Success);

    const fetchResponse = await Momento.setFetch(
      IntegrationTestCacheName,
      setName
    );
    expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
    expect((fetchResponse as CacheSetFetch.Hit).valueSetString()).toEqual(
      new Set(['lol'])
    );
  });
  it('should succeed for removeElements when the element does not exist', async () => {
    const setName = v4();
    const addResponse = await Momento.setAddElements(
      IntegrationTestCacheName,
      setName,
      [LOL_BYTE_ARRAY]
    );
    expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);

    const removeResponse = await Momento.setRemoveElements(
      IntegrationTestCacheName,
      setName,
      [FOO_BYTE_ARRAY]
    );
    expect(removeResponse).toBeInstanceOf(CacheSetRemoveElements.Success);

    const fetchResponse = await Momento.setFetch(
      IntegrationTestCacheName,
      setName
    );
    expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
    expect((fetchResponse as CacheSetFetch.Hit).valueSetUint8Array()).toEqual(
      new Set([LOL_BYTE_ARRAY])
    );
  });
  it('should succeed for removeElements when bytes/strings are used together', async () => {
    const setName = v4();
    const addResponse = await Momento.setAddElements(
      IntegrationTestCacheName,
      setName,
      [LOL_BYTE_ARRAY, FOO_BYTE_ARRAY]
    );
    expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);

    const removeResponse = await Momento.setRemoveElements(
      IntegrationTestCacheName,
      setName,
      ['lol']
    );
    expect(removeResponse).toBeInstanceOf(CacheSetRemoveElements.Success);

    const fetchResponse = await Momento.setFetch(
      IntegrationTestCacheName,
      setName
    );
    expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
    expect((fetchResponse as CacheSetFetch.Hit).valueSetUint8Array()).toEqual(
      new Set([FOO_BYTE_ARRAY])
    );
  });
  it('should return MISS if set does not exist', async () => {
    const noKeyGetResponse = await Momento.setFetch(
      IntegrationTestCacheName,
      'this-set-doesnt-exist'
    );
    expect(noKeyGetResponse).toBeInstanceOf(CacheSetFetch.Miss);
  });
});
