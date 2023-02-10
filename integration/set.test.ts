import {v4} from 'uuid';
import {sleep} from '../src/internal/utils/sleep';
import {
  CacheSetAddElements,
  CacheSetAddElement,
  CacheSetFetch,
  CacheSetRemoveElements,
  CacheSetRemoveElement,
  CollectionTtl,
  MomentoErrorCode,
} from '../src';
import {
  ValidateCacheProps,
  ItBehavesLikeItValidatesCacheName,
  ValidateSetProps,
  SetupIntegrationTest,
} from './integration-setup';
import {
  ResponseBase,
  IResponseError,
} from '../src/messages/responses/response-base';

const {Momento, IntegrationTestCacheName} = SetupIntegrationTest();

const LOL_BYTE_ARRAY = Uint8Array.of(108, 111, 108);
const FOO_BYTE_ARRAY = Uint8Array.of(102, 111, 111);

describe('Integration tests for convenience operations on sets datastructure', () => {
  const itBehavesLikeItValidates = (
    getResponse: (props: ValidateSetProps) => Promise<ResponseBase>
  ) => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return getResponse({cacheName: props.cacheName, setName: v4()});
    });

    it('validates its set name', async () => {
      const response = await getResponse({
        cacheName: IntegrationTestCacheName,
        setName: '  ',
      });

      expect((response as IResponseError).errorCode()).toEqual(
        MomentoErrorCode.INVALID_ARGUMENT_ERROR
      );
    });
  };

  itBehavesLikeItValidates((props: ValidateSetProps) => {
    return Momento.setAddElement(props.cacheName, props.setName, v4());
  });
  itBehavesLikeItValidates((props: ValidateSetProps) => {
    return Momento.setAddElements(props.cacheName, props.setName, [v4()]);
  });
  itBehavesLikeItValidates((props: ValidateSetProps) => {
    return Momento.setFetch(props.cacheName, props.setName);
  });
  itBehavesLikeItValidates((props: ValidateSetProps) => {
    return Momento.setRemoveElements(props.cacheName, props.setName, [v4()]);
  });

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
      {ttl: new CollectionTtl(2, false)}
    );
    expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);

    addResponse = await Momento.setAddElements(
      IntegrationTestCacheName,
      setName,
      [LOL_BYTE_ARRAY, FOO_BYTE_ARRAY],
      {ttl: new CollectionTtl(10, false)}
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
      {ttl: new CollectionTtl(2, false)}
    );
    expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);

    addResponse = await Momento.setAddElements(
      IntegrationTestCacheName,
      setName,
      [LOL_BYTE_ARRAY, FOO_BYTE_ARRAY],
      {ttl: new CollectionTtl(10, true)}
    );
    expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);

    await sleep(2_000);

    const fetchResponse = await Momento.setFetch(
      IntegrationTestCacheName,
      setName
    );
    expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
    const hit = fetchResponse as CacheSetFetch.Hit;
    expect(hit.valueSetUint8Array()).toEqual(
      new Set([LOL_BYTE_ARRAY, FOO_BYTE_ARRAY])
    );
    expect(hit.valueArrayUint8Array()).toBeArrayOfSize(2);
    expect(hit.valueArrayUint8Array()).toContainAllValues([
      LOL_BYTE_ARRAY,
      FOO_BYTE_ARRAY,
    ]);
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
    const hit = fetchResponse as CacheSetFetch.Hit;
    expect(hit.valueSet()).toEqual(new Set(['lol', 'foo']));
    expect(hit.valueSetString()).toEqual(new Set(['lol', 'foo']));
    expect(hit.valueArray()).toBeArrayOfSize(2);
    expect(hit.valueArray()).toContainAllValues(['lol', 'foo']);
    expect(hit.valueArrayString()).toBeArrayOfSize(2);
    expect(hit.valueArrayString()).toContainAllValues(['lol', 'foo']);

    const hitOrElseHitResult = fetchResponse.hitOrElse(
      h => h.valueArrayString(),
      () => ['FOO']
    );
    expect(hitOrElseHitResult).toBeArrayOfSize(2);
    expect(hitOrElseHitResult).toContainAllValues(['lol', 'foo']);

    const missResponse = await Momento.setFetch(
      IntegrationTestCacheName,
      'DoesNotExist'
    );
    expect(missResponse).toBeInstanceOf(CacheSetFetch.Miss);
    const hitOrElseMissResult = missResponse.hitOrElse(
      h => h.valueArrayString(),
      () => ['FOO']
    );
    expect(hitOrElseMissResult).toBeArrayOfSize(1);
    expect(hitOrElseMissResult).toContainAllValues(['FOO']);
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
