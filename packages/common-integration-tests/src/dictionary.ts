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
} from '@gomomento/sdk-core';
import {
  ValidateCacheProps,
  ItBehavesLikeItValidatesCacheName,
  ValidateDictionaryProps,
  ValidateDictionaryChangerProps,
  uint8ArrayForTest,
  expectWithMessage,
} from './common-int-test-utils';
import {TextEncoder} from 'util';
import {
  IResponseError,
  IResponseMiss,
  IResponseSuccess,
  ResponseBase,
} from '@gomomento/sdk-core/dist/src/messages/responses/response-base';
import {sleep} from '@gomomento/sdk-core/dist/src/internal/utils';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/internal/clients/cache';

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
        expectWithMessage(() => {
          expect(setResponse).toBeInstanceOf(CacheDictionarySetField.Success);
        }, `expected SUCCESS but got ${setResponse.toString()}`);

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
        expectWithMessage(() => {
          expect(setResponse).toBeInstanceOf(CacheDictionarySetField.Success);
        }, `expected SUCCESS but got ${setResponse.toString()}`);

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
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Miss);
        }, `expected MISS but got ${getResponse.toString()}`);
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
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
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
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        expect((response as CacheDictionaryFetch.Hit).toString()).toEqual(
          'Hit: valueDictionaryStringString: a: b'
        );
      });

      it('should provide value accessors for string fields with dictionaryFetch', async () => {
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
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        const hitResponse = response as CacheDictionaryFetch.Hit;

        const expectedStringBytesMap = new Map<string, Uint8Array>([
          ['foo', uint8ArrayForTest(value1)],
          ['bar', uint8ArrayForTest(value2)],
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
          foo: uint8ArrayForTest(value1),
          bar: uint8ArrayForTest(value2),
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
        const dictionaryName = v4();
        const field1 = uint8ArrayForTest(v4());
        const value1 = v4();
        const field2 = uint8ArrayForTest(v4());
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
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        const hitResponse = response as CacheDictionaryFetch.Hit;

        const expectedBytesBytesMap = new Map<Uint8Array, Uint8Array>([
          [field1, uint8ArrayForTest(value1)],
          [field2, uint8ArrayForTest(value2)],
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
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryFetch.Miss);
        }, `expected MISS but got ${response.toString()}`);
        response = await Momento.delete(
          IntegrationTestCacheName,
          dictionaryName
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDelete.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
        response = await Momento.dictionaryFetch(
          IntegrationTestCacheName,
          dictionaryName
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryFetch.Miss);
        }, `expected MISS but got ${response.toString()}`);
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
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);

        response = await Momento.delete(
          IntegrationTestCacheName,
          dictionaryName
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDelete.Success);
        }, `expected SUCCESS but got ${response.toString()}`);

        response = await Momento.dictionaryFetch(
          IntegrationTestCacheName,
          dictionaryName
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryFetch.Miss);
        }, `expected MISS but got ${response.toString()}`);
      });

      it('should support happy path for dictionaryFetch via curried cache via ICache interface', async () => {
        const dictionaryName = v4();
        const cache = Momento.cache(IntegrationTestCacheName);

        await cache.dictionarySetFields(dictionaryName, {a: 'A', b: 'B'});

        const response = await cache.dictionaryFetch(dictionaryName);
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        const hit = response as CacheDictionaryFetch.Hit;
        expect(hit.valueRecord()).toEqual({a: 'A', b: 'B'});
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
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
        }, `expected SUCCESS but got ${response.toString()}`);

        const getResponse = await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
        expect((getResponse as CacheDictionaryGetField.Hit).toString()).toEqual(
          `Hit: ${value.substring(0, 32)}...`
        );
      });

      it('should support happy path for dictionaryGetField via curried cache via ICache interface', async () => {
        const dictionaryName = v4();
        const cache = Momento.cache(IntegrationTestCacheName);

        await cache.dictionarySetFields(dictionaryName, {
          a: 'A',
          b: 'B',
        });

        const getResponse = await cache.dictionaryGetField(dictionaryName, 'b');
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
        const hit = getResponse as CacheDictionaryGetField.Hit;
        expect(hit.valueString()).toEqual('B');
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
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetFields.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
        expect(
          (getResponse as CacheDictionaryGetFields.Hit).toString()
        ).toEqual('Hit: valueDictionaryStringString: a: b, c: d');
      });

      it('should dictionarySetField/dictionaryGetFields with string fields/values', async () => {
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
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
        response = await Momento.dictionarySetField(
          IntegrationTestCacheName,
          dictionaryName,
          field2,
          value2
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
        const getResponse = await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          [field1, field2, field3]
        );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetFields.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
        const hitResponse = getResponse as CacheDictionaryGetFields.Hit;
        expect(hitResponse.responses).toHaveLength(3);
        expectWithMessage(() => {
          expect(hitResponse.responses[0]).toBeInstanceOf(
            CacheDictionaryGetField.Hit
          );
        }, `expected HIT but got ${hitResponse.responses[0].toString()}`);
        const hitResponse1 = hitResponse
          .responses[0] as CacheDictionaryGetField.Hit;
        expect(hitResponse1.fieldString()).toEqual(field1);

        expectWithMessage(() => {
          expect(hitResponse.responses[1]).toBeInstanceOf(
            CacheDictionaryGetField.Hit
          );
        }, `expected HIT but got ${hitResponse.responses[1].toString()}`);
        const hitResponse2 = hitResponse
          .responses[1] as CacheDictionaryGetField.Hit;
        expect(hitResponse2.fieldString()).toEqual(field2);

        expectWithMessage(() => {
          expect(hitResponse.responses[2]).toBeInstanceOf(
            CacheDictionaryGetField.Miss
          );
        }, `expected MISS but got ${hitResponse.responses[2].toString()}`);
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
          [field1, uint8ArrayForTest(value1)],
          [field2, uint8ArrayForTest(value2)],
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
          foo: uint8ArrayForTest(value1),
          bar: uint8ArrayForTest(value2),
        };
        expect(expectedRecordStringBytes).toEqual(
          hitResponse.valueRecordStringUint8Array()
        );
      });

      it('should dictionarySetField/dictionaryGetFields with Uint8Array fields/values', async () => {
        const dictionaryName = v4();
        const field1 = uint8ArrayForTest(v4());
        const value1 = uint8ArrayForTest(v4());
        const field2 = uint8ArrayForTest(v4());
        const value2 = uint8ArrayForTest(v4());
        const field3 = uint8ArrayForTest(v4());
        let response = await Momento.dictionarySetField(
          IntegrationTestCacheName,
          dictionaryName,
          field1,
          value1
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
        response = await Momento.dictionarySetField(
          IntegrationTestCacheName,
          dictionaryName,
          field2,
          value2
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
        const getResponse = await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          [field1, field2, field3]
        );

        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetFields.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
        const hitResponse = getResponse as CacheDictionaryGetFields.Hit;
        expect(hitResponse.responses).toHaveLength(3);
        expectWithMessage(() => {
          expect(hitResponse.responses[0]).toBeInstanceOf(
            CacheDictionaryGetField.Hit
          );
        }, `expected HIT but got ${hitResponse.responses[0].toString()}`);
        const hitResponse1 = hitResponse
          .responses[0] as CacheDictionaryGetField.Hit;
        expect(hitResponse1.fieldUint8Array()).toEqual(field1);

        expectWithMessage(() => {
          expect(hitResponse.responses[1]).toBeInstanceOf(
            CacheDictionaryGetField.Hit
          );
        }, `expected HIT but got ${hitResponse.responses[1].toString()}`);
        const hitResponse2 = hitResponse
          .responses[1] as CacheDictionaryGetField.Hit;
        expect(hitResponse2.fieldUint8Array()).toEqual(field2);

        expectWithMessage(() => {
          expect(hitResponse.responses[2]).toBeInstanceOf(
            CacheDictionaryGetField.Miss
          );
        }, `expected MISS but got ${hitResponse.responses[2].toString()}`);
        const missResponse = hitResponse
          .responses[2] as CacheDictionaryGetField.Miss;
        expect(missResponse.fieldUint8Array()).toEqual(field3);

        const expectedMap = new Map<Uint8Array, Uint8Array>([
          [field1, value1],
          [field2, value2],
        ]);
        expect(expectedMap).toEqual(hitResponse.valueMapUint8ArrayUint8Array());
      });

      it('should support happy path for dictionaryGetFields via curried cache via ICache interface', async () => {
        const dictionaryName = v4();
        const cache = Momento.cache(IntegrationTestCacheName);

        await cache.dictionarySetFields(dictionaryName, {
          a: 'A',
          b: 'B',
          c: 'C',
        });

        const getResponse = await cache.dictionaryGetFields(dictionaryName, [
          'a',
          'c',
        ]);
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetFields.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
        const hit = getResponse as CacheDictionaryGetFields.Hit;
        expect(hit.valueRecord()).toEqual({a: 'A', c: 'C'});
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
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
        let successResponse = response as CacheDictionaryIncrement.Success;
        expect(successResponse.valueNumber()).toEqual(1);

        response = await Momento.dictionaryIncrement(
          IntegrationTestCacheName,
          dictionaryName,
          field,
          41
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
        successResponse = response as CacheDictionaryIncrement.Success;
        expect(successResponse.valueNumber()).toEqual(42);
        expect(successResponse.toString()).toEqual('Success: value: 42');

        response = await Momento.dictionaryIncrement(
          IntegrationTestCacheName,
          dictionaryName,
          field,
          -1042
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
        successResponse = response as CacheDictionaryIncrement.Success;
        expect(successResponse.valueNumber()).toEqual(-1000);

        response = await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryGetField.Hit);
        }, `expected HIT but got ${response.toString()}`);
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
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
        let successResponse = response as CacheDictionaryIncrement.Success;
        expect(successResponse.valueNumber()).toEqual(1);

        response = await Momento.dictionaryIncrement(
          IntegrationTestCacheName,
          dictionaryName,
          field,
          41
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
        successResponse = response as CacheDictionaryIncrement.Success;
        expect(successResponse.valueNumber()).toEqual(42);
        expect(successResponse.toString()).toEqual('Success: value: 42');

        response = await Momento.dictionaryIncrement(
          IntegrationTestCacheName,
          dictionaryName,
          field,
          -1042
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
        successResponse = response as CacheDictionaryIncrement.Success;
        expect(successResponse.valueNumber()).toEqual(-1000);

        response = await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryGetField.Hit);
        }, `expected HIT but got ${response.toString()}`);
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
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
        let successResponse = response as CacheDictionaryIncrement.Success;
        expect(successResponse.valueNumber()).toEqual(10);

        response = await Momento.dictionaryIncrement(
          IntegrationTestCacheName,
          dictionaryName,
          field,
          90
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
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
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
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
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryIncrement.Error);
        }, `expected ERROR but got ${response.toString()}`);
        const errorResponse = response as CacheDictionaryIncrement.Error;
        expect(errorResponse.errorCode()).toEqual(
          MomentoErrorCode.FAILED_PRECONDITION_ERROR
        );
      });

      it('should support happy path for dictionaryIncrement via curried cache via ICache interface', async () => {
        const dictionaryName = v4();
        const cache = Momento.cache(IntegrationTestCacheName);

        await cache.dictionarySetFields(dictionaryName, {
          a: 'A',
          b: '41',
        });

        const response = await cache.dictionaryIncrement(dictionaryName, 'b');
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
        const success = response as CacheDictionaryIncrement.Success;
        expect(success.valueNumber()).toEqual(42);
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
        let resp = await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryGetField.Miss);
        }, `expected MISS but got ${resp.toString()}`);
        resp = await Momento.dictionaryRemoveField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryRemoveField.Success);
        }, `expected SUCCESS but got ${resp.toString()}`);
        resp = await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryGetField.Miss);
        }, `expected MISS but got ${resp.toString()}`);

        // When the field exists.
        resp = await Momento.dictionarySetField(
          IntegrationTestCacheName,
          dictionaryName,
          field,
          value
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionarySetField.Success);
        }, `expected SUCCESS but got ${resp.toString()}`);
        resp = await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryGetField.Hit);
        }, `expected HIT but got ${resp.toString()}`);
        resp = await Momento.dictionaryRemoveField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryRemoveField.Success);
        }, `expected SUCCESS but got ${resp.toString()}`);
        resp = await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryGetField.Miss);
        }, `expected MISS but got ${resp.toString()}`);
      });

      it('should remove a string field', async () => {
        const dictionaryName = v4();
        const field = v4();
        const value = v4();

        // When the field does not exist.
        let resp = await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryGetField.Miss);
        }, `expected MISS but got ${resp.toString()}`);
        resp = await Momento.dictionaryRemoveField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryRemoveField.Success);
        }, `expected SUCCESS but got ${resp.toString()}`);
        resp = await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryGetField.Miss);
        }, `expected MISS but got ${resp.toString()}`);

        // When the field exists.
        resp = await Momento.dictionarySetField(
          IntegrationTestCacheName,
          dictionaryName,
          field,
          value
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionarySetField.Success);
        }, `expected SUCCESS but got ${resp.toString()}`);
        resp = await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryGetField.Hit);
        }, `expected HIT but got ${resp.toString()}`);
        resp = await Momento.dictionaryRemoveField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryRemoveField.Success);
        }, `expected SUCCESS but got ${resp.toString()}`);
        resp = await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryGetField.Miss);
        }, `expected MISS but got ${resp.toString()}`);
      });

      it('should support happy path for dictionaryRemoveField via curried cache via ICache interface', async () => {
        const dictionaryName = v4();
        const cache = Momento.cache(IntegrationTestCacheName);

        await cache.dictionarySetFields(dictionaryName, {
          a: 'A',
          b: 'B',
          c: 'C',
        });

        const response = await cache.dictionaryRemoveField(dictionaryName, 'b');
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryRemoveField.Success);
        }, `expected SUCCESS but got ${response.toString()}`);

        const fetchResponse = await cache.dictionaryFetch(dictionaryName);
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheDictionaryFetch.Hit);
        }, `expected HIT but got ${fetchResponse.toString()}`);

        const hit = fetchResponse as CacheDictionaryFetch.Hit;
        expect(hit.valueRecord()).toEqual({a: 'A', c: 'C'});
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
        let resp = await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryGetFields.Miss);
        }, `expected MISS but got ${resp.toString()}`);
        resp = await Momento.dictionaryRemoveFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryRemoveFields.Success);
        }, `expected SUCCESS but got ${resp.toString()}`);
        resp = await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryGetFields.Miss);
        }, `expected MISS but got ${resp.toString()}`);

        // When the fields exist.
        resp = await Momento.dictionarySetFields(
          IntegrationTestCacheName,
          dictionaryName,
          setFields
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionarySetFields.Success);
        }, `expected SUCCESS but got ${resp.toString()}`);
        resp = await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryGetFields.Hit);
        }, `expected HIT but got ${resp.toString()}`);
        resp = await Momento.dictionaryRemoveFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryRemoveFields.Success);
        }, `expected SUCCESS but got ${resp.toString()}`);
        resp = await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryGetFields.Miss);
        }, `expected MISS but got ${resp.toString()}`);
      });

      it('should remove string fields', async () => {
        const dictionaryName = v4();
        const fields = [v4(), v4()];
        const setFields = new Map([
          [fields[0], v4()],
          [fields[1], v4()],
        ]);

        // When the fields do not exist.
        let resp = await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryGetFields.Miss);
        }, `expected MISS but got ${resp.toString()}`);
        resp = await Momento.dictionaryRemoveFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryRemoveFields.Success);
        }, `expected SUCCESS but got ${resp.toString()}`);
        resp = await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryGetFields.Miss);
        }, `expected MISS but got ${resp.toString()}`);

        // When the fields exist.
        resp = await Momento.dictionarySetFields(
          IntegrationTestCacheName,
          dictionaryName,
          setFields
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionarySetFields.Success);
        }, `expected SUCCESS but got ${resp.toString()}`);
        resp = await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryGetFields.Hit);
        }, `expected HIT but got ${resp.toString()}`);
        resp = await Momento.dictionaryRemoveFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryRemoveFields.Success);
        }, `expected SUCCESS but got ${resp.toString()}`);
        resp = await Momento.dictionaryGetFields(
          IntegrationTestCacheName,
          dictionaryName,
          fields
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryGetFields.Miss);
        }, `expected MISS but got ${resp.toString()}`);
      });

      it('should support happy path for dictionaryRemoveFields via curried cache via ICache interface', async () => {
        const dictionaryName = v4();
        const cache = Momento.cache(IntegrationTestCacheName);

        await cache.dictionarySetFields(dictionaryName, {
          a: 'A',
          b: 'B',
          c: 'C',
          d: 'D',
        });

        const response = await cache.dictionaryRemoveFields(dictionaryName, [
          'b',
          'd',
        ]);
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryRemoveFields.Success);
        }, `expected SUCCESS but got ${response.toString()}`);

        const fetchResponse = await cache.dictionaryFetch(dictionaryName);
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheDictionaryFetch.Hit);
        }, `expected HIT but got ${fetchResponse.toString()}`);

        const hit = fetchResponse as CacheDictionaryFetch.Hit;
        expect(hit.valueRecord()).toEqual({a: 'A', c: 'C'});
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
        const field = uint8ArrayForTest(v4());
        const value = uint8ArrayForTest(v4());
        const response = await Momento.dictionarySetField(
          IntegrationTestCacheName,
          dictionaryName,
          field,
          value
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
        const getResponse = await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
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
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
        const getResponse = await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
        if (getResponse instanceof CacheDictionaryGetField.Hit) {
          expect(getResponse.valueString()).toEqual(value);
        }
      });

      it('should set/get a dictionary with string field and Uint8Array value', async () => {
        const dictionaryName = v4();
        const field = v4();
        const value = uint8ArrayForTest(v4());
        const response = await Momento.dictionarySetField(
          IntegrationTestCacheName,
          dictionaryName,
          field,
          value
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
        const getResponse = await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field
        );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
        expect(
          (getResponse as CacheDictionaryGetField.Hit).valueUint8Array()
        ).toEqual(value);
      });

      it('should support happy path for dictionarySetField via curried cache via ICache interface', async () => {
        const dictionaryName = v4();
        const cache = Momento.cache(IntegrationTestCacheName);

        const response = await cache.dictionarySetField(
          dictionaryName,
          'a',
          'A'
        );

        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
        }, `expected SUCCESS but got ${response.toString()}`);

        const fetchResponse = await cache.dictionaryFetch(dictionaryName);
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheDictionaryFetch.Hit);
        }, `expected HIT but got ${fetchResponse.toString()}`);

        const hit = fetchResponse as CacheDictionaryFetch.Hit;
        expect(hit.valueRecord()).toEqual({a: 'A'});
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
        const field1 = uint8ArrayForTest(v4());
        const value1 = uint8ArrayForTest(v4());
        const field2 = uint8ArrayForTest(v4());
        const value2 = uint8ArrayForTest(v4());
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
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
        if (getResponse instanceof CacheDictionaryGetField.Hit) {
          expect(getResponse.valueUint8Array()).toEqual(value1);
        }
        getResponse = await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field2
        );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
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
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
        let getResponse = await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field1
        );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
        if (getResponse instanceof CacheDictionaryGetField.Hit) {
          expect(getResponse.valueString()).toEqual(value1);
        }
        getResponse = await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field2
        );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
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
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
        let getResponse = await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field1
        );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
        if (getResponse instanceof CacheDictionaryGetField.Hit) {
          expect(getResponse.valueString()).toEqual(value1);
        }
        getResponse = await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field2
        );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
        if (getResponse instanceof CacheDictionaryGetField.Hit) {
          expect(getResponse.valueString()).toEqual(value2);
        }
      });

      it('should set fields with string field/Uint8Array value items', async () => {
        const dictionaryName = v4();
        const field1 = v4();
        const value1 = uint8ArrayForTest(v4());
        const field2 = v4();
        const value2 = uint8ArrayForTest(v4());
        const response = await Momento.dictionarySetFields(
          IntegrationTestCacheName,
          dictionaryName,
          new Map([
            [field1, value1],
            [field2, value2],
          ]),
          {ttl: CollectionTtl.of(10)}
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
        let getResponse = await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field1
        );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
        if (getResponse instanceof CacheDictionaryGetField.Hit) {
          expect(getResponse.valueUint8Array()).toEqual(value1);
        }

        getResponse = await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field2
        );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
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
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
        }, `expected SUCCESS but got ${response.toString()}`);
        let getResponse = await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field1
        );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
        if (getResponse instanceof CacheDictionaryGetField.Hit) {
          expect(getResponse.valueString()).toEqual(value1);
        }
        getResponse = await Momento.dictionaryGetField(
          IntegrationTestCacheName,
          dictionaryName,
          field2
        );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
        if (getResponse instanceof CacheDictionaryGetField.Hit) {
          expect(getResponse.valueString()).toEqual(value2);
        }
      });

      it('should support happy path for dictionarySetFields via curried cache via ICache interface', async () => {
        const dictionaryName = v4();
        const cache = Momento.cache(IntegrationTestCacheName);

        const response = await cache.dictionarySetFields(dictionaryName, {
          a: 'A',
          b: 'B',
          c: 'C',
        });

        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
        }, `expected SUCCESS but got ${response.toString()}`);

        const fetchResponse = await cache.dictionaryFetch(dictionaryName);
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheDictionaryFetch.Hit);
        }, `expected HIT but got ${fetchResponse.toString()}`);

        const hit = fetchResponse as CacheDictionaryFetch.Hit;
        expect(hit.valueRecord()).toEqual({a: 'A', b: 'B', c: 'C'});
      });
    });
  });
}
