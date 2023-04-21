import {v4} from 'uuid';
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
} from '@gomomento/core';
import {
  ValidateCacheProps,
  ItBehavesLikeItValidatesCacheName,
  ValidateDictionaryProps,
  ValidateDictionaryChangerProps,
} from './common-int-test-utils';
import {TextEncoder} from 'util';
import {
  IResponseError,
  IResponseMiss,
  IResponseSuccess,
  ResponseBase,
} from '@gomomento/core/dist/src/messages/responses/response-base';
import {sleep} from '@gomomento/core/dist/src/internal/utils';
import {ICacheClient} from '@gomomento/core/dist/src/internal/clients/cache';

export function runDictionaryTests(
  Momento: ICacheClient,
  IntegrationTestCacheName: string
) {
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

      it('should provide value accessors for string fields with dictionaryFetch', async () => {
        const textEncoder = new TextEncoder();

        const dictionaryName = v4();
        const field1 = 'foo';
        const value1 = v4();
        const field2 = 'bar';
        const value2 = v4();

        await Momento.dictionarySetFields(
          IntegrationTestCacheName,
          dictionaryName,
          new Map([
            [field1, value1],
            [field2, value2],
          ])
        );

        const response = await Momento.dictionaryFetch(
          IntegrationTestCacheName,
          dictionaryName
        );
        expect(response).toBeInstanceOf(CacheDictionaryFetch.Hit);
        const hitResponse = response as CacheDictionaryFetch.Hit;

        const expectedStringBytesMap = new Map<string, Uint8Array>([
          ['foo', textEncoder.encode(value1)],
          ['bar', textEncoder.encode(value2)],
        ]);

        const expectedStringStringMap = new Map<string, string>([
          ['foo', value1],
          ['bar', value2],
        ]);

        expect(hitResponse.valueMapStringUint8Array()).toEqual(
          expectedStringBytesMap
        );
        expect(hitResponse.valueMapStringString()).toEqual(
          expectedStringStringMap
        );
        expect(hitResponse.valueMap()).toEqual(expectedStringStringMap);

        const expectedStringBytesRecord = {
          foo: textEncoder.encode(value1),
          bar: textEncoder.encode(value2),
        };

        const expectedStringStringRecord = {
          foo: value1,
          bar: value2,
        };

        expect(hitResponse.valueRecordStringUint8Array()).toEqual(
          expectedStringBytesRecord
        );
        expect(hitResponse.valueRecordStringString()).toEqual(
          expectedStringStringRecord
        );
        expect(hitResponse.valueRecord()).toEqual(expectedStringStringRecord);
      });

      it('should provide value accessors for bytes fields with dictionaryFetch', async () => {
        const textEncoder = new TextEncoder();

        const dictionaryName = v4();
        const field1 = textEncoder.encode(v4());
        const value1 = v4();
        const field2 = textEncoder.encode(v4());
        const value2 = v4();

        await Momento.dictionarySetFields(
          IntegrationTestCacheName,
          dictionaryName,
          new Map([
            [field1, value1],
            [field2, value2],
          ])
        );

        const response = await Momento.dictionaryFetch(
          IntegrationTestCacheName,
          dictionaryName
        );
        expect(response).toBeInstanceOf(CacheDictionaryFetch.Hit);
        const hitResponse = response as CacheDictionaryFetch.Hit;

        const expectedBytesBytesMap = new Map<Uint8Array, Uint8Array>([
          [field1, textEncoder.encode(value1)],
          [field2, textEncoder.encode(value2)],
        ]);

        expect(hitResponse.valueMapUint8ArrayUint8Array()).toEqual(
          expectedBytesBytesMap
        );
      });

      it('should do nothing with dictionaryFetch if dictionary does not exist', async () => {
        const dictionaryName = v4();
        let response = await Momento.dictionaryFetch(
          IntegrationTestCacheName,
          dictionaryName
        );
        expect(response).toBeInstanceOf(CacheDictionaryFetch.Miss);
        response = await Momento.delete(
          IntegrationTestCacheName,
          dictionaryName
        );
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
          new Map([
            [v4(), v4()],
            [v4(), v4()],
            [v4(), v4()],
          ])
        );

        let response = await Momento.dictionaryFetch(
          IntegrationTestCacheName,
          dictionaryName
        );
        expect(response).toBeInstanceOf(CacheDictionaryFetch.Hit);

        response = await Momento.delete(
          IntegrationTestCacheName,
          dictionaryName
        );
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
        expect(
          (getResponse as CacheDictionaryGetFields.Hit).toString()
        ).toEqual('Hit: valueDictionaryStringString: a: b, c: d');
      });

      it('should dictionarySetField/dictionaryGetFields with string fields/values', async () => {
        const textEncoder = new TextEncoder();

        const dictionaryName = v4();
        const field1 = 'foo';
        const value1 = v4();
        const field2 = 'bar';
        const value2 = v4();
        const field3 = 'baz';
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
        expect(hitResponse.responses).toHaveLength(3);
        expect(hitResponse.responses[0]).toBeInstanceOf(
          CacheDictionaryGetField.Hit
        );
        const hitResponse1 = hitResponse
          .responses[0] as CacheDictionaryGetField.Hit;
        expect(hitResponse1.fieldString()).toEqual(field1);

        expect(hitResponse.responses[1]).toBeInstanceOf(
          CacheDictionaryGetField.Hit
        );
        const hitResponse2 = hitResponse
          .responses[1] as CacheDictionaryGetField.Hit;
        expect(hitResponse2.fieldString()).toEqual(field2);

        expect(hitResponse.responses[2]).toBeInstanceOf(
          CacheDictionaryGetField.Miss
        );
        const missResponse = hitResponse
          .responses[2] as CacheDictionaryGetField.Miss;
        expect(missResponse.fieldString()).toEqual(field3);

        const expectedMapStringString = new Map<string, string>([
          [field1, value1],
          [field2, value2],
        ]);
        expect(expectedMapStringString).toEqual(
          hitResponse.valueMapStringString()
        );
        expect(expectedMapStringString).toEqual(hitResponse.valueMap());

        const expectedMapStringBytes = new Map<string, Uint8Array>([
          [field1, textEncoder.encode(value1)],
          [field2, textEncoder.encode(value2)],
        ]);
        expect(expectedMapStringBytes).toEqual(
          hitResponse.valueMapStringUint8Array()
        );

        const expectedRecordStringString = {
          foo: value1,
          bar: value2,
        };
        expect(expectedRecordStringString).toEqual(
          hitResponse.valueRecordStringString()
        );
        expect(expectedRecordStringString).toEqual(hitResponse.valueRecord());

        const expectedRecordStringBytes = {
          foo: textEncoder.encode(value1),
          bar: textEncoder.encode(value2),
        };
        expect(expectedRecordStringBytes).toEqual(
          hitResponse.valueRecordStringUint8Array()
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
        expect(hitResponse.responses).toHaveLength(3);
        expect(hitResponse.responses[0]).toBeInstanceOf(
          CacheDictionaryGetField.Hit
        );
        const hitResponse1 = hitResponse
          .responses[0] as CacheDictionaryGetField.Hit;
        expect(hitResponse1.fieldUint8Array()).toEqual(field1);

        expect(hitResponse.responses[1]).toBeInstanceOf(
          CacheDictionaryGetField.Hit
        );
        const hitResponse2 = hitResponse
          .responses[1] as CacheDictionaryGetField.Hit;
        expect(hitResponse2.fieldUint8Array()).toEqual(field2);

        expect(hitResponse.responses[2]).toBeInstanceOf(
          CacheDictionaryGetField.Miss
        );
        const missResponse = hitResponse
          .responses[2] as CacheDictionaryGetField.Miss;
        expect(missResponse.fieldUint8Array()).toEqual(field3);

        const expectedMap = new Map<Uint8Array, Uint8Array>([
          [field1, value1],
          [field2, value2],
        ]);
        expect(expectedMap).toEqual(hitResponse.valueMapUint8ArrayUint8Array());
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
          {ttl: props.ttl}
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
        const setFields = new Map([
          [fields[0], v4()],
          [fields[1], v4()],
        ]);

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
        const setFields = new Map([
          [fields[0], v4()],
          [fields[1], v4()],
        ]);

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
          {ttl: props.ttl}
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
          new Map([[props.field, v4()]])
        );
      };

      const changeResponder = (props: ValidateDictionaryChangerProps) => {
        return Momento.dictionarySetFields(
          props.cacheName,
          props.dictionaryName,
          new Map([[props.field, props.value]]),
          {ttl: props.ttl}
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
          new Map([
            [field1, value1],
            [field2, value2],
          ]),
          {ttl: CollectionTtl.of(10)}
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

      it('should set fields with string items Map', async () => {
        const dictionaryName = v4();
        const field1 = v4();
        const value1 = v4();
        const field2 = v4();
        const value2 = v4();
        const response = await Momento.dictionarySetFields(
          IntegrationTestCacheName,
          dictionaryName,
          new Map([
            [field1, value1],
            [field2, value2],
          ]),
          {ttl: CollectionTtl.of(10)}
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

      it('should set fields with string items Record', async () => {
        const dictionaryName = v4();
        const field1 = 'foo';
        const value1 = v4();
        const field2 = 'bar';
        const value2 = v4();
        const response = await Momento.dictionarySetFields(
          IntegrationTestCacheName,
          dictionaryName,
          {foo: value1, bar: value2},
          {ttl: CollectionTtl.of(10)}
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
          new Map([
            [field1, value1],
            [field2, value2],
          ]),
          {ttl: CollectionTtl.of(10)}
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

      it('should set fields with string fields / Uint8Array Record', async () => {
        const textEncoder = new TextEncoder();
        const dictionaryName = v4();
        const field1 = 'foo';
        const value1 = v4();
        const field2 = 'bar';
        const value2 = v4();
        const response = await Momento.dictionarySetFields(
          IntegrationTestCacheName,
          dictionaryName,
          {foo: textEncoder.encode(value1), bar: textEncoder.encode(value2)},
          {ttl: CollectionTtl.of(10)}
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
    });
  });
}
