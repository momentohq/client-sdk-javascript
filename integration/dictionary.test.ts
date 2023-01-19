import {v4} from 'uuid';
import {
  CollectionTtl,
  CacheDelete,
  MomentoErrorCode,
  CacheDictionaryFetch,
  CacheDictionarySetField,
  CacheDictionarySetFields,
  CacheDictionaryGetField,
  CacheDictionaryGetFields,
  CacheDictionaryIncrement,
} from '../src';
import {TextEncoder} from 'util';
import {
  ItBehavesLikeItValidatesCacheName,
  ValidateCacheProps,
  ValidateDictionaryProps,
  SetupIntegrationTest,
} from './integration-setup';
import {
  IResponseError,
  ResponseBase,
} from '../src/messages/responses/response-base';

const {Momento, IntegrationTestCacheName} = SetupIntegrationTest();

describe('Integration tests for dictionary operations', () => {
  const itBehavesLikeItValidates = (
    getResponse: (props: ValidateDictionaryProps) => Promise<ResponseBase>
  ) => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return getResponse({cacheName: props.cacheName, dictionaryName: v4()});
    });

    it('validates its dictionary name', async () => {
      const response = await getResponse({
        cacheName: IntegrationTestCacheName,
        dictionaryName: '  ',
      });

      expect((response as IResponseError).errorCode()).toEqual(
        MomentoErrorCode.INVALID_ARGUMENT_ERROR
      );
    });
  };

  itBehavesLikeItValidates((props: ValidateDictionaryProps) => {
    return Momento.dictionaryFetch(props.cacheName, props.dictionaryName);
  });
  itBehavesLikeItValidates((props: ValidateDictionaryProps) => {
    return Momento.dictionaryGetField(
      props.cacheName,
      props.dictionaryName,
      v4()
    );
  });
  itBehavesLikeItValidates((props: ValidateDictionaryProps) => {
    return Momento.dictionaryGetFields(props.cacheName, props.dictionaryName, [
      v4(),
    ]);
  });
  itBehavesLikeItValidates((props: ValidateDictionaryProps) => {
    return Momento.dictionaryIncrement(
      props.cacheName,
      props.dictionaryName,
      v4()
    );
  });
  itBehavesLikeItValidates((props: ValidateDictionaryProps) => {
    return Momento.dictionaryRemoveField(
      props.cacheName,
      props.dictionaryName,
      v4()
    );
  });
  itBehavesLikeItValidates((props: ValidateDictionaryProps) => {
    return Momento.dictionaryRemoveFields(
      props.cacheName,
      props.dictionaryName,
      [v4()]
    );
  });
  itBehavesLikeItValidates((props: ValidateDictionaryProps) => {
    return Momento.dictionarySetField(
      props.cacheName,
      props.dictionaryName,
      v4(),
      v4()
    );
  });
  itBehavesLikeItValidates((props: ValidateDictionaryProps) => {
    const items = [{field: v4(), value: v4()}];
    return Momento.dictionarySetFields(
      props.cacheName,
      props.dictionaryName,
      items
    );
  });

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

  it('should return MISS when field does not present for dictionaryGetField with Uint8Array field/value', async () => {
    const dictionaryName = v4();
    const field = new TextEncoder().encode(v4());
    const value = new TextEncoder().encode(v4());
    const otherField = new TextEncoder().encode(v4());
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
      otherField
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Miss);
  });

  it('should dictionarySet/GetField with Uint8Array field/value with no refresh ttl', async () => {
    const dictionaryName = v4();
    const field = new TextEncoder().encode(v4());
    const value = new TextEncoder().encode(v4());
    let response = await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(5).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    await new Promise(r => setTimeout(r, 100));

    response = await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(10).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    await new Promise(r => setTimeout(r, 4900));

    response = await Momento.dictionaryGetField(
      IntegrationTestCacheName,
      dictionaryName,
      field
    );
    const getResponse = await Momento.dictionaryGetField(
      IntegrationTestCacheName,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Miss);
  });

  it('should dictionarySet/GetField with Uint8Array field/value with refresh ttl', async () => {
    const dictionaryName = v4();
    const field = new TextEncoder().encode(v4());
    const value = new TextEncoder().encode(v4());
    let response = await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(2)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);

    response = await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(10)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    await new Promise(r => setTimeout(r, 2000));

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

  it('should return MISS if dictionary does not exist for dictionaryGetField', async () => {
    const dictionaryName = v4();
    const field = new TextEncoder().encode(v4());
    const response = await Momento.dictionaryGetField(
      IntegrationTestCacheName,
      dictionaryName,
      field
    );
    expect(response).toBeInstanceOf(CacheDictionaryGetField.Miss);
    if (response instanceof CacheDictionaryGetField.Hit) {
      expect(response.valueUint8Array()).toEqual(field);
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

  it('should set/get a dictionary with string field/value and return expected toString value', async () => {
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

  it('should return MISS when field does not present for dictionaryGetField with string field/value', async () => {
    const dictionaryName = v4();
    const field = v4();
    const value = v4();
    const otherField = v4();
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
      otherField
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Miss);
  });

  it('should dictionarySet/GetField with string field/value with no refresh ttl', async () => {
    const dictionaryName = v4();
    const field = v4();
    const value = v4();
    let response = await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(5).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    await new Promise(r => setTimeout(r, 100));

    response = await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(10).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    await new Promise(r => setTimeout(r, 4900));

    response = await Momento.dictionaryGetField(
      IntegrationTestCacheName,
      dictionaryName,
      field
    );
    const getResponse = await Momento.dictionaryGetField(
      IntegrationTestCacheName,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Miss);
  });

  it('should dictionarySet/GetField with string field/value with refresh ttl', async () => {
    const dictionaryName = v4();
    const field = v4();
    const value = v4();
    let response = await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(2)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);

    response = await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(10)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    await new Promise(r => setTimeout(r, 2000));

    const getResponse = await Momento.dictionaryGetField(
      IntegrationTestCacheName,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
    expect((getResponse as CacheDictionaryGetField.Hit).valueString()).toEqual(
      value
    );
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

  it('should dictionarySet/GetField with string field, Uint8Array value with no refresh ttl', async () => {
    const dictionaryName = v4();
    const field = v4();
    const value = new TextEncoder().encode(v4());
    let response = await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(5).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    await new Promise(r => setTimeout(r, 100));

    response = await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(10).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    await new Promise(r => setTimeout(r, 4900));

    response = await Momento.dictionaryGetField(
      IntegrationTestCacheName,
      dictionaryName,
      field
    );
    const getResponse = await Momento.dictionaryGetField(
      IntegrationTestCacheName,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Miss);
  });

  it('should dictionarySet/GetField with string field, Uint8Array value with refresh ttl', async () => {
    const dictionaryName = v4();
    const field = v4();
    const value = new TextEncoder().encode(v4());
    let response = await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(2)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);

    response = await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(10)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    await new Promise(r => setTimeout(r, 2000));

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

  it('should dictionarySetFields/dictionaryGetField with Uint8Array items', async () => {
    const dictionaryName = v4();
    const field1 = new TextEncoder().encode(v4());
    const value1 = new TextEncoder().encode(v4());
    const field2 = new TextEncoder().encode(v4());
    const value2 = new TextEncoder().encode(v4());
    const response = await Momento.dictionarySetFields(
      IntegrationTestCacheName,
      dictionaryName,
      [
        {field: field1, value: value1},
        {field: field2, value: value2},
      ],
      CollectionTtl.of(10)
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

  it('should dictionarySetFields/dictionaryGetField with Uint8Array items with no refresh ttl', async () => {
    const dictionaryName = v4();
    const field = new TextEncoder().encode(v4());
    const value = new TextEncoder().encode(v4());
    const content = [{field, value}];
    let response = await Momento.dictionarySetFields(
      IntegrationTestCacheName,
      dictionaryName,
      content,
      CollectionTtl.of(5).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
    await new Promise(r => setTimeout(r, 100));

    response = await Momento.dictionarySetFields(
      IntegrationTestCacheName,
      dictionaryName,
      content,
      CollectionTtl.of(10).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
    await new Promise(r => setTimeout(r, 4900));

    response = await Momento.dictionaryGetField(
      IntegrationTestCacheName,
      dictionaryName,
      field
    );
    const getResponse = await Momento.dictionaryGetField(
      IntegrationTestCacheName,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Miss);
  });

  it('should dictionarySetFields/dictionaryGetField with Uint8Array field/value with refresh ttl', async () => {
    const dictionaryName = v4();
    const field = new TextEncoder().encode(v4());
    const value = new TextEncoder().encode(v4());
    const content = [{field, value}];
    let response = await Momento.dictionarySetFields(
      IntegrationTestCacheName,
      dictionaryName,
      content,
      CollectionTtl.of(2)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);

    response = await Momento.dictionarySetFields(
      IntegrationTestCacheName,
      dictionaryName,
      content,
      CollectionTtl.of(10)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
    await new Promise(r => setTimeout(r, 2000));

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

  it('should dictionarySetFields/dictionaryGetField with string items', async () => {
    const dictionaryName = v4();
    const field1 = v4();
    const value1 = v4();
    const field2 = v4();
    const value2 = v4();
    const response = await Momento.dictionarySetFields(
      IntegrationTestCacheName,
      dictionaryName,
      [
        {field: field1, value: value1},
        {field: field2, value: value2},
      ],
      CollectionTtl.of(10)
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

  it('should dictionarySetFields/dictionaryGetField with string items with no refresh ttl', async () => {
    const dictionaryName = v4();
    const field = v4();
    const value = v4();
    const content = [{field, value}];
    let response = await Momento.dictionarySetFields(
      IntegrationTestCacheName,
      dictionaryName,
      content,
      CollectionTtl.of(5).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
    await new Promise(r => setTimeout(r, 100));

    response = await Momento.dictionarySetFields(
      IntegrationTestCacheName,
      dictionaryName,
      content,
      CollectionTtl.of(10).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
    await new Promise(r => setTimeout(r, 4900));

    response = await Momento.dictionaryGetField(
      IntegrationTestCacheName,
      dictionaryName,
      field
    );
    const getResponse = await Momento.dictionaryGetField(
      IntegrationTestCacheName,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Miss);
  });

  it('should dictionarySetFields/dictionaryGetField with string field/value with refresh ttl', async () => {
    const dictionaryName = v4();
    const field = v4();
    const value = v4();
    const content = [{field, value}];
    let response = await Momento.dictionarySetFields(
      IntegrationTestCacheName,
      dictionaryName,
      content,
      CollectionTtl.of(2)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);

    response = await Momento.dictionarySetFields(
      IntegrationTestCacheName,
      dictionaryName,
      content,
      CollectionTtl.of(10)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
    await new Promise(r => setTimeout(r, 2000));

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

  it('should dictionarySetFields/dictionaryGetField with string field/Uint8Array value items', async () => {
    const dictionaryName = v4();
    const field1 = v4();
    const value1 = new TextEncoder().encode(v4());
    const field2 = v4();
    const value2 = new TextEncoder().encode(v4());
    const response = await Momento.dictionarySetFields(
      IntegrationTestCacheName,
      dictionaryName,
      [
        {field: field1, value: value1},
        {field: field2, value: value2},
      ],
      CollectionTtl.of(10)
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

  it('should dictionarySetFields/dictionaryGetField with string field/Uint8Array value with no refresh ttl', async () => {
    const dictionaryName = v4();
    const field = v4();
    const value = new TextEncoder().encode(v4());
    const content = [{field, value}];
    let response = await Momento.dictionarySetFields(
      IntegrationTestCacheName,
      dictionaryName,
      content,
      CollectionTtl.of(5).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
    await new Promise(r => setTimeout(r, 100));

    response = await Momento.dictionarySetFields(
      IntegrationTestCacheName,
      dictionaryName,
      content,
      CollectionTtl.of(10).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
    await new Promise(r => setTimeout(r, 4900));

    response = await Momento.dictionaryGetField(
      IntegrationTestCacheName,
      dictionaryName,
      field
    );
    const getResponse = await Momento.dictionaryGetField(
      IntegrationTestCacheName,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Miss);
  });

  it('should dictionarySetFields/dictionaryGetField with string field/Uint8Array value with refresh ttl', async () => {
    const dictionaryName = v4();
    const field = v4();
    const value = new TextEncoder().encode(v4());
    const content = [{field, value}];
    let response = await Momento.dictionarySetFields(
      IntegrationTestCacheName,
      dictionaryName,
      content,
      CollectionTtl.of(2)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);

    response = await Momento.dictionarySetFields(
      IntegrationTestCacheName,
      dictionaryName,
      content,
      CollectionTtl.of(10)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
    await new Promise(r => setTimeout(r, 2000));

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
    expect(hitResponse.responsesList).toHaveLength(3);
    expect(hitResponse.responsesList[0]).toBeInstanceOf(
      CacheDictionaryGetField.Hit
    );
    const hitResponse1 = hitResponse
      .responsesList[0] as CacheDictionaryGetField.Hit;
    expect(hitResponse1.fieldUint8Array()).toEqual(field1);

    expect(hitResponse.responsesList[1]).toBeInstanceOf(
      CacheDictionaryGetField.Hit
    );
    const hitResponse2 = hitResponse
      .responsesList[1] as CacheDictionaryGetField.Hit;
    expect(hitResponse2.fieldUint8Array()).toEqual(field2);

    expect(hitResponse.responsesList[2]).toBeInstanceOf(
      CacheDictionaryGetField.Miss
    );
    const missResponse = hitResponse
      .responsesList[2] as CacheDictionaryGetField.Miss;
    expect(missResponse.fieldUint8Array()).toEqual(field3);

    const expectedMap = new Map<Uint8Array, Uint8Array>([
      [field1, value1],
      [field2, value2],
    ]);
    expect(expectedMap).toEqual(
      hitResponse.valueDictionaryUint8ArrayUint8Array()
    );
  });

  it('should return MISS if dictionary does not exist for dictionaryGetFields', async () => {
    const dictionaryName = v4();
    const field1 = new TextEncoder().encode(v4());
    const field2 = new TextEncoder().encode(v4());
    const field3 = new TextEncoder().encode(v4());
    const response = await Momento.dictionaryGetFields(
      IntegrationTestCacheName,
      dictionaryName,
      [field1, field2, field3]
    );
    expect(response).toBeInstanceOf(CacheDictionaryGetFields.Miss);
  });

  it('should dictionarySetField/dictionaryGetFields with string fields/values', async () => {
    const dictionaryName = v4();
    const field1 = v4();
    const value1 = v4();
    const field2 = v4();
    const value2 = v4();
    const field3 = v4();
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
    expect(hitResponse.responsesList).toHaveLength(3);
    expect(hitResponse.responsesList[0]).toBeInstanceOf(
      CacheDictionaryGetField.Hit
    );
    const hitResponse1 = hitResponse
      .responsesList[0] as CacheDictionaryGetField.Hit;
    expect(hitResponse1.fieldString()).toEqual(field1);

    expect(hitResponse.responsesList[1]).toBeInstanceOf(
      CacheDictionaryGetField.Hit
    );
    const hitResponse2 = hitResponse
      .responsesList[1] as CacheDictionaryGetField.Hit;
    expect(hitResponse2.fieldString()).toEqual(field2);

    expect(hitResponse.responsesList[2]).toBeInstanceOf(
      CacheDictionaryGetField.Miss
    );
    const missResponse = hitResponse
      .responsesList[2] as CacheDictionaryGetField.Miss;
    expect(missResponse.fieldString()).toEqual(field3);

    const expectedMap = new Map<string, string>([
      [field1, value1],
      [field2, value2],
    ]);
    expect(expectedMap).toEqual(hitResponse.valueDictionaryStringString());

    const otherDictionary = hitResponse.valueDictionaryStringUint8Array();
    expect(otherDictionary.size).toEqual(2);
    expect(otherDictionary.get(field1)).toEqual(
      new TextEncoder().encode(value1)
    );
    expect(otherDictionary.get(field2)).toEqual(
      new TextEncoder().encode(value2)
    );
  });

  it('should dictionarySetField/dictionaryGetFields with string field/value and return expected toString value', async () => {
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

  it('should return a map of string field and string value with dictionaryFetch', async () => {
    const dictionaryName = v4();
    const field1 = v4();
    const value1 = v4();
    const field2 = v4();
    const value2 = v4();
    const contentDictionary = new Map<string, string>([
      [field1, value1],
      [field2, value2],
    ]);
    await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      field1,
      value1
    );
    await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      field2,
      value2
    );
    const response = await Momento.dictionaryFetch(
      IntegrationTestCacheName,
      dictionaryName
    );
    expect(response).toBeInstanceOf(CacheDictionaryFetch.Hit);
    const hitResponse = response as CacheDictionaryFetch.Hit;
    expect(hitResponse.valueDictionaryStringString()).toEqual(
      contentDictionary
    );
  });

  it('should return expected toString value with dictionaryFetch', async () => {
    const dictionaryName = v4();
    await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      'a',
      'b'
    );
    const response = await Momento.dictionaryFetch(
      IntegrationTestCacheName,
      dictionaryName
    );
    expect(response).toBeInstanceOf(CacheDictionaryFetch.Hit);
    expect((response as CacheDictionaryFetch.Hit).toString()).toEqual(
      'Hit: valueDictionaryStringString: a: b'
    );
  });

  it('should return a map of Uint8Array field and Uint8Array value with dictionaryFetch', async () => {
    const dictionaryName = v4();
    const field1 = new TextEncoder().encode(v4());
    const value1 = new TextEncoder().encode(v4());
    const field2 = new TextEncoder().encode(v4());
    const value2 = new TextEncoder().encode(v4());
    const contentDictionary = new Map<Uint8Array, Uint8Array>([
      [field1, value1],
      [field2, value2],
    ]);
    await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      field1,
      value1
    );
    await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      field2,
      value2
    );
    const response = await Momento.dictionaryFetch(
      IntegrationTestCacheName,
      dictionaryName
    );
    expect(response).toBeInstanceOf(CacheDictionaryFetch.Hit);
    const hitResponse = response as CacheDictionaryFetch.Hit;
    expect(hitResponse.valueDictionaryUint8ArrayUint8Array()).toEqual(
      contentDictionary
    );
  });

  it('should return a map of string field and Uint8Array value with dictionaryFetch', async () => {
    const dictionaryName = v4();
    const field1 = v4();
    const value1 = new TextEncoder().encode(v4());
    const field2 = v4();
    const value2 = new TextEncoder().encode(v4());
    const contentDictionary = new Map<string, Uint8Array>([
      [field1, value1],
      [field2, value2],
    ]);
    await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      field1,
      value1
    );
    await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      field2,
      value2
    );
    const response = await Momento.dictionaryFetch(
      IntegrationTestCacheName,
      dictionaryName
    );
    expect(response).toBeInstanceOf(CacheDictionaryFetch.Hit);
    const hitResponse = response as CacheDictionaryFetch.Hit;
    expect(hitResponse.valueDictionaryStringUint8Array()).toEqual(
      contentDictionary
    );
  });

  it('should return MISS if dictionary does not exist for dictionaryFetch', async () => {
    const fetchResponse = await Momento.dictionaryFetch(
      IntegrationTestCacheName,
      'nonExistingDictionary'
    );
    expect(fetchResponse).toBeInstanceOf(CacheDictionaryFetch.Miss);
  });

  it('should do nothing with dictionaryFetch if dictionary does not exist', async () => {
    const dictionaryName = v4();
    let response = await Momento.dictionaryFetch(
      IntegrationTestCacheName,
      dictionaryName
    );
    expect(response).toBeInstanceOf(CacheDictionaryFetch.Miss);
    response = await Momento.delete(IntegrationTestCacheName, dictionaryName);
    expect(response).toBeInstanceOf(CacheDelete.Success);
    response = await Momento.dictionaryFetch(
      IntegrationTestCacheName,
      dictionaryName
    );
    expect(response).toBeInstanceOf(CacheDictionaryFetch.Miss);
  });

  it('should delete with dictionaryFetch if dictionary exists', async () => {
    const dictionaryName = v4();
    await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      v4(),
      v4()
    );
    await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      v4(),
      v4()
    );
    await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      v4(),
      v4()
    );

    let response = await Momento.dictionaryFetch(
      IntegrationTestCacheName,
      dictionaryName
    );
    expect(response).toBeInstanceOf(CacheDictionaryFetch.Hit);
    response = await Momento.delete(IntegrationTestCacheName, dictionaryName);
    expect(response).toBeInstanceOf(CacheDelete.Success);
    response = await Momento.dictionaryFetch(
      IntegrationTestCacheName,
      dictionaryName
    );
    expect(response).toBeInstanceOf(CacheDictionaryFetch.Miss);
  });

  it('should remove a dictionary with dictionaryRemoveField with Uint8Array field', async () => {
    const dictionaryName = v4();
    const field1 = new TextEncoder().encode(v4());
    const value1 = new TextEncoder().encode(v4());
    const field2 = new TextEncoder().encode(v4());

    expect(
      await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field1
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Miss);
    await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      field1,
      value1
    );
    expect(
      await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field1
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Hit);

    await Momento.dictionaryRemoveField(
      IntegrationTestCacheName,
      dictionaryName,
      field1
    );
    expect(
      await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field1
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Miss);

    // Test no-op
    expect(
      await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field2
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Miss);
    await Momento.dictionaryRemoveField(
      IntegrationTestCacheName,
      dictionaryName,
      field2
    );
    expect(
      await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field2
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Miss);
  });

  it('should remove a dictionary with dictionaryRemoveField with string field', async () => {
    const dictionaryName = v4();
    const field1 = v4();
    const value1 = v4();
    const field2 = v4();

    expect(
      await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field1
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Miss);
    await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      field1,
      value1
    );
    expect(
      await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field1
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Hit);

    await Momento.dictionaryRemoveField(
      IntegrationTestCacheName,
      dictionaryName,
      field1
    );
    expect(
      await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field1
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Miss);

    // Test no-op
    expect(
      await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field2
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Miss);
    await Momento.dictionaryRemoveField(
      IntegrationTestCacheName,
      dictionaryName,
      field2
    );
    expect(
      await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field2
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Miss);
  });

  it('should remove a dictionary with dictionaryRemoveFields with string field', async () => {
    const dictionaryName = v4();
    const fields = [v4(), v4()];
    const otherField = v4();

    await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      fields[0],
      v4()
    );
    await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      fields[1],
      v4()
    );
    await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      otherField,
      v4()
    );

    await Momento.dictionaryRemoveFields(
      IntegrationTestCacheName,
      dictionaryName,
      fields
    );
    expect(
      await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        fields[0]
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Miss);
    expect(
      await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        fields[1]
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Miss);
    expect(
      await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        otherField
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Hit);
  });

  it('should increment from 0 to expected amount with dictionaryIncrement with string field', async () => {
    const dictionaryName = v4();
    const field = v4();
    let response = await Momento.dictionaryIncrement(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      1
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
    let successResponse = response as CacheDictionaryIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(1);

    response = await Momento.dictionaryIncrement(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      41
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
    successResponse = response as CacheDictionaryIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(42);
    expect(successResponse.toString()).toEqual('Success: value: 42');

    response = await Momento.dictionaryIncrement(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      -1042
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
    successResponse = response as CacheDictionaryIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(-1000);

    response = await Momento.dictionaryGetField(
      IntegrationTestCacheName,
      dictionaryName,
      field
    );
    expect(response).toBeInstanceOf(CacheDictionaryGetField.Hit);
    const hitResponse = response as CacheDictionaryGetField.Hit;
    expect(hitResponse.valueString()).toEqual('-1000');
  });

  it('should increment from 0 to expected amount with dictionaryIncrement with Uint8Array field', async () => {
    const dictionaryName = v4();
    const field = new TextEncoder().encode(v4());
    let response = await Momento.dictionaryIncrement(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      1
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
    let successResponse = response as CacheDictionaryIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(1);

    response = await Momento.dictionaryIncrement(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      41
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
    successResponse = response as CacheDictionaryIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(42);
    expect(successResponse.toString()).toEqual('Success: value: 42');

    response = await Momento.dictionaryIncrement(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      -1042
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
    successResponse = response as CacheDictionaryIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(-1000);

    response = await Momento.dictionaryGetField(
      IntegrationTestCacheName,
      dictionaryName,
      field
    );
    expect(response).toBeInstanceOf(CacheDictionaryGetField.Hit);
    const hitResponse = response as CacheDictionaryGetField.Hit;
    expect(hitResponse.valueString()).toEqual('-1000');
  });

  it('should dictionaryIncrement with no refresh ttl', async () => {
    const dictionaryName = v4();
    const field = v4();
    let response = await Momento.dictionaryIncrement(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      undefined,
      CollectionTtl.of(5).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
    await new Promise(r => setTimeout(r, 100));

    response = await Momento.dictionaryIncrement(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      undefined,
      CollectionTtl.of(10).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
    await new Promise(r => setTimeout(r, 4900));

    response = await Momento.dictionaryGetField(
      IntegrationTestCacheName,
      dictionaryName,
      field
    );
    const getResponse = await Momento.dictionaryGetField(
      IntegrationTestCacheName,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Miss);
  });

  it('should dictionaryIncrement with refresh ttl', async () => {
    const dictionaryName = v4();
    const field = v4();
    let response = await Momento.dictionaryIncrement(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      undefined,
      CollectionTtl.of(2)
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);

    response = await Momento.dictionaryIncrement(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      undefined,
      CollectionTtl.of(10)
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
    await new Promise(r => setTimeout(r, 2000));

    const getResponse = await Momento.dictionaryGetField(
      IntegrationTestCacheName,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
    if (getResponse instanceof CacheDictionaryGetField.Hit) {
      expect(getResponse.valueString()).toEqual('2');
    }
  });

  it('should dictionaryIncrement successfully with setting and resetting field', async () => {
    const dictionaryName = v4();
    const field = v4();

    await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      '10'
    );
    let response = await Momento.dictionaryIncrement(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      0
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
    let successResponse = response as CacheDictionaryIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(10);

    response = await Momento.dictionaryIncrement(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      90
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
    successResponse = response as CacheDictionaryIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(100);

    // Reset field
    await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      '0'
    );
    response = await Momento.dictionaryIncrement(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      0
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
    successResponse = response as CacheDictionaryIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(0);
  });

  it('should fail with precondition with dictionaryIncrement', async () => {
    const dictionaryName = v4();
    const field = v4();

    await Momento.dictionarySetField(
      IntegrationTestCacheName,
      dictionaryName,
      field,
      'abcxyz'
    );
    const response = await Momento.dictionaryIncrement(
      IntegrationTestCacheName,
      dictionaryName,
      field
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Error);
    const errorResponse = response as CacheDictionaryIncrement.Error;
    expect(errorResponse.errorCode()).toEqual(
      MomentoErrorCode.FAILED_PRECONDITION_ERROR
    );
  });
});
