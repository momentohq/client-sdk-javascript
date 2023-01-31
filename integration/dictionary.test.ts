import {v4} from 'uuid';
import {sleep} from '../src/utils/sleep';
import {
  CollectionTtl,
  CacheDelete,
  MomentoErrorCode,
  CacheDictionaryFetch,
  CacheDictionaryRemoveField,
  CacheDictionaryRemoveFields,
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
  ValidateDictionaryChangerProps,
  SetupIntegrationTest,
} from './integration-setup';
import {
  IResponseError,
  IResponseMiss,
  IResponseSuccess,
  ResponseBase,
} from '../src/messages/responses/response-base';

const {Momento, IntegrationTestCacheName} = SetupIntegrationTest();

describe('Integration tests for dictionary operations', () => {
  const itBehavesLikeItValidates = (
    responder: (props: ValidateDictionaryProps) => Promise<ResponseBase>
  ) => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return responder({
        cacheName: props.cacheName,
        dictionaryName: v4(),
        field: v4(),
      });
    });

    it('validates its dictionary name', async () => {
      const response = await responder({
        cacheName: IntegrationTestCacheName,
        dictionaryName: '  ',
        field: v4(),
      });

      expect((response as IResponseError).errorCode()).toEqual(
        MomentoErrorCode.INVALID_ARGUMENT_ERROR
      );
    });
  };

  const itBehavesLikeItMissesWhenDictionaryDoesNotExist = (
    responder: (props: ValidateDictionaryProps) => Promise<ResponseBase>
  ) => {
    it('misses when the dictionary does not exist', async () => {
      const response = await responder({
        cacheName: IntegrationTestCacheName,
        dictionaryName: v4(),
        field: v4(),
      });

      expect((response as IResponseMiss).is_miss).toBeTrue();
    });
  };

  const itBehavesLikeItMissesWhenFieldDoesNotExist = (
    responder: (props: ValidateDictionaryProps) => Promise<ResponseBase>
  ) => {
    it('misses when a string field does not exist', async () => {
      const dictionaryName = v4();

      // Make sure the dictionary exists.
      const setResponse = await Momento.dictionarySetField(
        IntegrationTestCacheName,
        dictionaryName,
        v4(),
        v4()
      );
      expect(setResponse).toBeInstanceOf(CacheDictionarySetField.Success);

      const response = await responder({
        cacheName: IntegrationTestCacheName,
        dictionaryName: dictionaryName,
        field: v4(),
      });

      expect((response as IResponseMiss).is_miss).toBeTrue();
    });

    it('misses when a byte field does not exist', async () => {
      const dictionaryName = v4();
      const fieldName = new TextEncoder().encode(v4());

      // Make sure the dictionary exists.
      const setResponse = await Momento.dictionarySetField(
        IntegrationTestCacheName,
        dictionaryName,
        v4(),
        v4()
      );
      expect(setResponse).toBeInstanceOf(CacheDictionarySetField.Success);

      const response = await responder({
        cacheName: IntegrationTestCacheName,
        dictionaryName: dictionaryName,
        field: fieldName,
      });

      expect((response as IResponseMiss).is_miss).toBeTrue();
    });
  };

  const itBehavesLikeItHasACollectionTtl = (
    changeResponder: (
      props: ValidateDictionaryChangerProps
    ) => Promise<ResponseBase>
  ) => {
    it('does not refresh with no refresh ttl', async () => {
      const dictionaryName = v4();
      const field = v4();
      const timeout = 1;

      let changeResponse = await changeResponder({
        cacheName: IntegrationTestCacheName,
        dictionaryName: dictionaryName,
        field: field,
        value: 'value1',
        ttl: CollectionTtl.of(timeout).withNoRefreshTtlOnUpdates(),
      });
      expect((changeResponse as IResponseSuccess).is_success).toBeTrue();

      changeResponse = await changeResponder({
        cacheName: IntegrationTestCacheName,
        dictionaryName: dictionaryName,
        field: field,
        value: 'value2',
        ttl: CollectionTtl.of(timeout * 10).withNoRefreshTtlOnUpdates(),
      });
      expect((changeResponse as IResponseSuccess).is_success).toBeTrue();
      await sleep(timeout * 1000);

      const getResponse = await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field
      );
      expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Miss);
    });

    it('refreshes with refresh ttl', async () => {
      const dictionaryName = v4();
      const field = v4();
      const timeout = 1;

      let changeResponse = await changeResponder({
        cacheName: IntegrationTestCacheName,
        dictionaryName: dictionaryName,
        field: field,
        value: 'value1',
        ttl: CollectionTtl.of(timeout).withRefreshTtlOnUpdates(),
      });
      expect((changeResponse as IResponseSuccess).is_success).toBeTrue();

      changeResponse = await changeResponder({
        cacheName: IntegrationTestCacheName,
        dictionaryName: dictionaryName,
        field: field,
        value: 'value2',
        ttl: CollectionTtl.of(timeout * 10).withRefreshTtlOnUpdates(),
      });
      expect((changeResponse as IResponseSuccess).is_success).toBeTrue();
      await sleep(timeout * 1000);

      const getResponse = await Momento.dictionaryGetField(
        IntegrationTestCacheName,
        dictionaryName,
        field
      );
      expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
    });
  };

  describe('#dictionaryFetch', () => {
    const responder = (props: ValidateDictionaryProps) => {
      return Momento.dictionaryFetch(props.cacheName, props.dictionaryName);
    };

    itBehavesLikeItValidates(responder);
    itBehavesLikeItMissesWhenDictionaryDoesNotExist(responder);

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
      await Momento.dictionarySetFields(
        IntegrationTestCacheName,
        dictionaryName,
        [
          {field: field1, value: value1},
          {field: field2, value: value2},
        ]
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

      await Momento.dictionarySetFields(
        IntegrationTestCacheName,
        dictionaryName,
        [
          {field: field1, value: value1},
          {field: field2, value: value2},
        ]
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

      const setResponse = await Momento.dictionarySetFields(
        IntegrationTestCacheName,
        dictionaryName,
        [
          {field: field1, value: value1},
          {field: field2, value: value2},
        ]
      );
      expect(setResponse).toBeInstanceOf(CacheDictionarySetFields.Success);

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
      await Momento.dictionarySetFields(
        IntegrationTestCacheName,
        dictionaryName,
        [
          {field: v4(), value: v4()},
          {field: v4(), value: v4()},
          {field: v4(), value: v4()},
        ]
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
  });

  describe('#dictionaryGetField', () => {
    const responder = (props: ValidateDictionaryProps) => {
      return Momento.dictionaryGetField(
        props.cacheName,
        props.dictionaryName,
        v4()
      );
    };

    itBehavesLikeItValidates(responder);
    itBehavesLikeItMissesWhenDictionaryDoesNotExist(responder);
    itBehavesLikeItMissesWhenFieldDoesNotExist(responder);

    it('returns the expected toString value', async () => {
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
  });

  describe('#dictionaryGetFields', () => {
    const responder = (props: ValidateDictionaryProps) => {
      return Momento.dictionaryGetFields(
        props.cacheName,
        props.dictionaryName,
        [props.field] as string[] | Uint8Array[]
      );
    };

    itBehavesLikeItValidates(responder);
    itBehavesLikeItMissesWhenDictionaryDoesNotExist(responder);

    it('return expected toString value', async () => {
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
  });

  describe('#dictionaryIncrement', () => {
    const responder = (props: ValidateDictionaryProps) => {
      return Momento.dictionaryIncrement(
        props.cacheName,
        props.dictionaryName,
        props.field
      );
    };

    const changeResponder = (props: ValidateDictionaryChangerProps) => {
      return Momento.dictionaryIncrement(
        props.cacheName,
        props.dictionaryName,
        props.field,
        5,
        props.ttl
      );
    };

    itBehavesLikeItValidates(responder);
    itBehavesLikeItHasACollectionTtl(changeResponder);

    it('increments from 0 to expected amount with string field', async () => {
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

    it('increments from 0 to expected amount with Uint8Array field', async () => {
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

    it('increments with setting and resetting field', async () => {
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

    it('fails with precondition with a bad amount', async () => {
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

  describe('#dictionaryRemoveField', () => {
    const responder = (props: ValidateDictionaryProps) => {
      return Momento.dictionaryRemoveField(
        props.cacheName,
        props.dictionaryName,
        props.field
      );
    };

    itBehavesLikeItValidates(responder);

    it('should remove a Uint8Array field', async () => {
      const dictionaryName = v4();
      const field = new TextEncoder().encode(v4());
      const value = new TextEncoder().encode(v4());

      // When the field does not exist.
      expect(
        await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryGetField.Miss);
      expect(
        await Momento.dictionaryRemoveField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryRemoveField.Success);
      expect(
        await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryGetField.Miss);

      // When the field exists.
      expect(
        await Momento.dictionarySetField(
          IntegrationTestCacheName,
          dictionaryName,
          field,
          value
        )
      ).toBeInstanceOf(CacheDictionarySetField.Success);
      expect(
        await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryGetField.Hit);
      expect(
        await Momento.dictionaryRemoveField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryRemoveField.Success);
      expect(
        await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryGetField.Miss);
    });

    it('should remove a string field', async () => {
      const dictionaryName = v4();
      const field = v4();
      const value = v4();

      // When the field does not exist.
      expect(
        await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryGetField.Miss);
      expect(
        await Momento.dictionaryRemoveField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryRemoveField.Success);
      expect(
        await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryGetField.Miss);

      // When the field exists.
      expect(
        await Momento.dictionarySetField(
          IntegrationTestCacheName,
          dictionaryName,
          field,
          value
        )
      ).toBeInstanceOf(CacheDictionarySetField.Success);
      expect(
        await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryGetField.Hit);
      expect(
        await Momento.dictionaryRemoveField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryRemoveField.Success);
      expect(
        await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        )
      ).toBeInstanceOf(CacheDictionaryGetField.Miss);
    });
  });

  describe('#dictionaryRemoveFields', () => {
    const responder = (props: ValidateDictionaryProps) => {
      return Momento.dictionaryRemoveFields(
        props.cacheName,
        props.dictionaryName,
        [props.field] as string[] | Uint8Array[]
      );
    };

    itBehavesLikeItValidates(responder);

    it('should remove Uint8Array fields', async () => {
      const dictionaryName = v4();
      const fields = [
        new TextEncoder().encode(v4()),
        new TextEncoder().encode(v4()),
      ];
      const setFields = [
        {field: fields[0], value: v4()},
        {field: fields[1], value: v4()},
      ];

      // When the fields do not exist.
      expect(
        await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryGetFields.Miss);
      expect(
        await Momento.dictionaryRemoveFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryRemoveFields.Success);
      expect(
        await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryGetFields.Miss);

      // When the fields exist.
      expect(
        await Momento.dictionarySetFields(
          IntegrationTestCacheName,
          dictionaryName,
          setFields
        )
      ).toBeInstanceOf(CacheDictionarySetFields.Success);
      expect(
        await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryGetFields.Hit);
      expect(
        await Momento.dictionaryRemoveFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryRemoveFields.Success);
      expect(
        await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryGetFields.Miss);
    });

    it('should remove string fields', async () => {
      const dictionaryName = v4();
      const fields = [v4(), v4()];
      const setFields = [
        {field: fields[0], value: v4()},
        {field: fields[1], value: v4()},
      ];

      // When the fields do not exist.
      expect(
        await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryGetFields.Miss);
      expect(
        await Momento.dictionaryRemoveFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryRemoveFields.Success);
      expect(
        await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryGetFields.Miss);

      // When the fields exist.
      expect(
        await Momento.dictionarySetFields(
          IntegrationTestCacheName,
          dictionaryName,
          setFields
        )
      ).toBeInstanceOf(CacheDictionarySetFields.Success);
      expect(
        await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryGetFields.Hit);
      expect(
        await Momento.dictionaryRemoveFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryRemoveFields.Success);
      expect(
        await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        )
      ).toBeInstanceOf(CacheDictionaryGetFields.Miss);
    });
  });

  describe('#dictionarySetField', () => {
    const responder = (props: ValidateDictionaryProps) => {
      return Momento.dictionarySetField(
        props.cacheName,
        props.dictionaryName,
        props.field,
        v4()
      );
    };

    const changeResponder = (props: ValidateDictionaryChangerProps) => {
      return Momento.dictionarySetField(
        props.cacheName,
        props.dictionaryName,
        props.field,
        props.value,
        props.ttl
      );
    };

    itBehavesLikeItValidates(responder);
    itBehavesLikeItHasACollectionTtl(changeResponder);

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
  });

  describe('#dictionarySetFields', () => {
    const responder = (props: ValidateDictionaryProps) => {
      return Momento.dictionarySetFields(
        props.cacheName,
        props.dictionaryName,
        [{field: props.field, value: v4()}]
      );
    };

    const changeResponder = (props: ValidateDictionaryChangerProps) => {
      return Momento.dictionarySetFields(
        props.cacheName,
        props.dictionaryName,
        [{field: props.field, value: props.value}],
        props.ttl
      );
    };

    itBehavesLikeItValidates(responder);
    itBehavesLikeItHasACollectionTtl(changeResponder);

    it('should set fields with Uint8Array items', async () => {
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

    it('should set fields with string items', async () => {
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

    it('should set fields with string field/Uint8Array value items', async () => {
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
  });
});
