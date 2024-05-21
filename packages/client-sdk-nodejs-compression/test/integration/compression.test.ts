import {expectWithMessage, setupIntegrationTest} from './integration-setup';
import {
  AutomaticDecompression,
  CacheClient,
  CacheGet,
  CacheGetBatch,
  CacheSet,
  CacheSetBatch,
  CacheSetIfAbsent,
  CompressionLevel,
} from '@gomomento/sdk';
import {CompressorFactory} from '../../src';
import {v4} from 'uuid';
import {CompressionError} from '@gomomento/sdk/dist/src/errors/compression-error';
import * as zlib from 'node:zlib';
import {convert} from '@gomomento/sdk/dist/src/internal/utils';

const {cacheClientPropsWithConfig, cacheName} = setupIntegrationTest();

const cacheClientWithCompressor_AutoDecompressionDisabled = new CacheClient({
  configuration:
    cacheClientPropsWithConfig.configuration.withCompressionStrategy({
      compressorFactory: CompressorFactory.default(),
      compressionLevel: CompressionLevel.Balanced,
      automaticDecompression: AutomaticDecompression.Disabled,
    }),
  credentialProvider: cacheClientPropsWithConfig.credentialProvider,
  defaultTtlSeconds: cacheClientPropsWithConfig.defaultTtlSeconds,
});

const cacheClientWithCompressor_AutoDecompressionEnabled = new CacheClient({
  configuration:
    cacheClientPropsWithConfig.configuration.withCompressionStrategy({
      compressorFactory: CompressorFactory.default(),
      compressionLevel: CompressionLevel.Balanced,
    }),
  credentialProvider: cacheClientPropsWithConfig.credentialProvider,
  defaultTtlSeconds: cacheClientPropsWithConfig.defaultTtlSeconds,
});

const cacheClientWithoutCompressor = new CacheClient({
  configuration: cacheClientPropsWithConfig.configuration,
  credentialProvider: cacheClientPropsWithConfig.credentialProvider,
  defaultTtlSeconds: cacheClientPropsWithConfig.defaultTtlSeconds,
});

function randomString() {
  return v4();
}

const textEncoder = new TextEncoder();
const testValue = 'my-value';
const testValueBytes = textEncoder.encode(testValue);
const testValue2 = 'my-value2';

const invalidCompressed = Uint8Array.from([31, 139, 0, 0, 0, 0]);

function compressValueForTestComparisons(value: string): Promise<Uint8Array> {
  return new Promise<Uint8Array>((resolve, reject) => {
    zlib.gzip(
      Buffer.from(convert(value)),
      {level: zlib.constants.Z_DEFAULT_COMPRESSION},
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
}

describe('CompressorFactory', () => {
  let testValueCompressed: Uint8Array;
  let testValue2Compressed: Uint8Array;
  beforeAll(async () => {
    testValueCompressed = await compressValueForTestComparisons(testValue);
    testValue2Compressed = await compressValueForTestComparisons(testValue2);
  });

  describe('CacheClient.set', () => {
    it('should return an error if compress is true but compression is not enabled', async () => {
      const setResponse = await cacheClientWithoutCompressor.set(
        cacheName,
        randomString(),
        testValue,
        {
          compress: true,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Error);
        expect((setResponse as CacheSet.Error).toString()).toEqual(
          new CompressionError(
            'CacheClient.set',
            'compress'
          ).wrappedErrorMessage()
        );
      }, `Expected CacheClient.set to return an error if compression is specified without compressor set, but got: ${setResponse.toString()}`);
    });
    it('should compress the value if compress is true', async () => {
      const cacheClient = cacheClientWithCompressor_AutoDecompressionDisabled;
      const key = randomString();
      const setResponse = await cacheClient.set(cacheName, key, testValue, {
        compress: true,
      });
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `Expected CacheClient.set to be a success with compression specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.get(cacheName, key);
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `Expected CacheClient.get to be a hit after CacheClient.set with compression specified, got: '${getResponse.toString()}'`);
      expect((getResponse as CacheGet.Hit).valueUint8Array()).toEqual(
        testValueCompressed
      );
    });
    it('should not compress the value if compress is not specified', async () => {
      const cacheClient = cacheClientWithCompressor_AutoDecompressionDisabled;
      const key = randomString();
      const setResponse = await cacheClient.set(cacheName, key, testValue);
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `Expected CacheClient.set to be a success with no compression specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.get(cacheName, key);
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `Expected CacheClient.get to be a hit after CacheClient.set with no compression specified, got: '${getResponse.toString()}'`);

      expect((getResponse as CacheGet.Hit).valueString()).toEqual(testValue);
    });
  });
  describe('Cache.setIfAbsent', () => {
    it('should return an error if compress is true but compression is not enabled', async () => {
      const setResponse = await cacheClientWithoutCompressor.setIfAbsent(
        cacheName,
        randomString(),
        testValue,
        {
          compress: true,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfAbsent.Error);
        expect((setResponse as CacheSetIfAbsent.Error).toString()).toEqual(
          'Invalid argument passed to Momento client: Compressor is not set, but `CacheClient.setIfAbsent` was called with the `compress` option; please install @gomomento/sdk-nodejs-compression and call `Configuration.withCompressionStrategy` to enable compression.'
        );
      }, `Expected CacheClient.setIfAbsent to return an error if compression is specified without compressor set, but got: ${setResponse.toString()}`);
    });
    it('should compress the value if compress is true', async () => {
      const cacheClient = cacheClientWithCompressor_AutoDecompressionDisabled;
      const key = randomString();
      const setResponse = await cacheClient.setIfAbsent(
        cacheName,
        key,
        testValue,
        {
          compress: true,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfAbsent.Stored);
      }, `Expected CacheClient.setIfAbsent to be a success with compression specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.get(cacheName, key);
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `Expected CacheClient.get to be a hit after CacheClient.setIfAbsent with compression specified, got: '${getResponse.toString()}'`);

      expect((getResponse as CacheGet.Hit).valueUint8Array()).toEqual(
        testValueCompressed
      );
    });
    it('should not compress the value if compress is not specified', async () => {
      const cacheClient = cacheClientWithCompressor_AutoDecompressionDisabled;
      const key = randomString();
      const setResponse = await cacheClient.setIfAbsent(
        cacheName,
        key,
        testValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfAbsent.Stored);
      }, `Expected CacheClient.setIfAbsent to be a success with no compression specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.get(cacheName, key);
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `Expected CacheClient.get to be a hit after CacheClient.setIfAbsent with no compression specified, got: '${getResponse.toString()}'`);

      expect((getResponse as CacheGet.Hit).valueString()).toEqual(testValue);
    });
  });
  describe('CacheClient.get', () => {
    it('should not return an error if decompress is true and compression is not enabled and it is a miss', async () => {
      const getResponse = await cacheClientWithoutCompressor.get(
        cacheName,
        randomString(),
        {
          decompress: true,
        }
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Miss);
      }, `Expected CacheClient.get to be a miss with decompression specified and no compression enabled, got: '${getResponse.toString()}'`);
    });
    it('should return an error if decompress is true and compression is not enabled and it is a hit', async () => {
      const cacheClient = cacheClientWithoutCompressor;
      const key = randomString();
      const setResponse = await cacheClient.set(cacheName, key, testValue);
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `Expected CacheClient.set to be a success with no compression specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.get(cacheName, key, {
        decompress: true,
      });
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Error);
        expect((getResponse as CacheGet.Error).toString()).toEqual(
          new CompressionError(
            'CacheClient.Get',
            'decompress'
          ).wrappedErrorMessage()
        );
      }, `Expected CacheClient.get to return an error if decompression is specified without compressor set, but got: ${getResponse.toString()}`);
    });
    it('should decompress the value if decompress is true', async () => {
      const cacheClient = cacheClientWithCompressor_AutoDecompressionDisabled;
      const key = randomString();
      const setResponse = await cacheClient.set(cacheName, key, testValue, {
        compress: true,
      });
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `Expected CacheClient.set to be a success with compression specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.get(cacheName, key, {
        decompress: true,
      });
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `Expected CacheClient.get to be a hit after CacheClient.set with compression specified, got: '${getResponse.toString()}'`);

      expect((getResponse as CacheGet.Hit).valueString()).toEqual(testValue);
    });
    it('should decompress the value if decompression is enabled', async () => {
      const cacheClient = cacheClientWithCompressor_AutoDecompressionEnabled;
      const key = randomString();
      const setResponse = await cacheClient.set(cacheName, key, testValue, {
        compress: true,
      });
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `Expected CacheClient.set to be a success with compression specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.get(cacheName, key);
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `Expected CacheClient.get to be a hit after CacheClient.set with compression specified, got: '${getResponse.toString()}'`);

      expect((getResponse as CacheGet.Hit).valueString()).toEqual(testValue);
    });
    it('should not decompress the value if decompression is disabled', async () => {
      const cacheClient = cacheClientWithCompressor_AutoDecompressionDisabled;
      const key = randomString();
      const setResponse = await cacheClient.set(cacheName, key, testValue, {
        compress: true,
      });
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `Expected CacheClient.set to be a success with compression specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.get(cacheName, key);
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `Expected CacheClient.get to be a hit after CacheClient.set with compression specified, got: '${getResponse.toString()}'`);

      expect((getResponse as CacheGet.Hit).valueUint8Array()).toEqual(
        testValueCompressed
      );
    });
    it('should not decompress the value if decompression is enabled but decompress is false', async () => {
      const cacheClient = cacheClientWithCompressor_AutoDecompressionEnabled;
      const key = randomString();
      const setResponse = await cacheClient.set(cacheName, key, testValue, {
        compress: true,
      });
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `Expected CacheClient.set to be a success with compression specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.get(cacheName, key, {
        decompress: false,
      });
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `Expected CacheClient.get to be a hit after CacheClient.set with compression specified, got: '${getResponse.toString()}'`);

      expect((getResponse as CacheGet.Hit).valueUint8Array()).toEqual(
        testValueCompressed
      );
    });
    it('should return the value if it is not compressed and decompression is enabled', async () => {
      const cacheClient = cacheClientWithCompressor_AutoDecompressionEnabled;
      const key = randomString();
      const setResponse = await cacheClient.set(cacheName, key, testValue);
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `Expected CacheClient.set to be a success with compression specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.get(cacheName, key);
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `Expected CacheClient.get to be a hit after CacheClient.set with compression specified, got: '${getResponse.toString()}'`);

      expect((getResponse as CacheGet.Hit).valueString()).toEqual(testValue);
    });
    it('should return an error if decompression is enabled and the client receives invalid gzip data', async () => {
      const noCompressCacheClient = cacheClientWithoutCompressor;
      const key = randomString();
      const setResponse = await noCompressCacheClient.set(
        cacheName,
        key,
        invalidCompressed
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `Expected CacheClient.set to be a success, got: '${setResponse.toString()}'`);

      console.warn(
        'Hello developer! We are about to test an error case. Please ignore the following error message!'
      );
      const getResponse =
        await cacheClientWithCompressor_AutoDecompressionEnabled.get(
          cacheName,
          key
        );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Error);
      }, `Expected CacheClient.get to be an Error when receiving invalid gzip data, got: '${getResponse.toString()}'`);
    });
  });
  describe('CacheClient.setBatch', () => {
    describe('with compression disabled', () => {
      it('should return an error if compress is true', async () => {
        const setBatchResponse = await cacheClientWithoutCompressor.setBatch(
          cacheName,
          new Map([[randomString(), testValue]]),
          {compress: true}
        );
        expectWithMessage(() => {
          expect(setBatchResponse).toBeInstanceOf(CacheSetBatch.Error);
          expect(setBatchResponse.toString()).toEqual(
            'Compression Error: Compressor is not set, but `CacheClient.setBatch` was called with the `compress` option; please install @gomomento/sdk-nodejs-compression and call `Configuration.withCompressionStrategy` to enable compression.'
          );
        }, 'Compression Error: Compressor is not set, but `CacheClient.setBatch` was called with the `compress` option; please install @gomomento/sdk-nodejs-compression and call `Configuration.withCompressionStrategy` to enable compression.');
      });
    });
    describe('with compression enabled', () => {
      it('should compress values if compress is true', async () => {
        const key1 = randomString();
        const key2 = randomString();
        const key3 = randomString();
        const setBatchResponse =
          await cacheClientWithCompressor_AutoDecompressionDisabled.setBatch(
            cacheName,
            new Map([
              [key1, testValue],
              [key2, testValue2],
              [key3, testValue],
            ]),
            {
              compress: true,
            }
          );
        expectWithMessage(() => {
          expect(setBatchResponse).toBeInstanceOf(CacheSetBatch.Success);
        }, `Expected CacheClient.setBatch to return Success, but got: ${setBatchResponse.toString()}`);

        const getResponse =
          await cacheClientWithCompressor_AutoDecompressionDisabled.get(
            cacheName,
            key1
          );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheGet.Hit);
        }, `Expected CacheClient.get to be a Hit, got: '${getResponse.toString()}'`);
        expect((getResponse as CacheGet.Hit).valueUint8Array()).toEqual(
          testValueCompressed
        );
        const getResponse2 =
          await cacheClientWithCompressor_AutoDecompressionDisabled.get(
            cacheName,
            key2
          );
        expectWithMessage(() => {
          expect(getResponse2).toBeInstanceOf(CacheGet.Hit);
        }, `Expected CacheClient.get to be a Hit, got: '${getResponse2.toString()}'`);
        expect((getResponse2 as CacheGet.Hit).valueUint8Array()).toEqual(
          testValue2Compressed
        );
        const getResponse3 =
          await cacheClientWithCompressor_AutoDecompressionDisabled.get(
            cacheName,
            key3
          );
        expectWithMessage(() => {
          expect(getResponse3).toBeInstanceOf(CacheGet.Hit);
        }, `Expected CacheClient.get to be a Hit, got: '${getResponse3.toString()}'`);
        expect((getResponse3 as CacheGet.Hit).valueUint8Array()).toEqual(
          testValueCompressed
        );
      });

      it('should not compress values if compress false', async () => {
        const key1 = randomString();
        const key2 = randomString();
        const key3 = randomString();
        const setBatchResponse =
          await cacheClientWithCompressor_AutoDecompressionDisabled.setBatch(
            cacheName,
            new Map([
              [key1, testValue],
              [key2, testValue2],
              [key3, testValue],
            ]),
            {
              compress: false,
            }
          );
        expectWithMessage(() => {
          expect(setBatchResponse).toBeInstanceOf(CacheSetBatch.Success);
        }, `Expected CacheClient.setBatch to return Success, but got: ${setBatchResponse.toString()}`);

        const getResponse =
          await cacheClientWithCompressor_AutoDecompressionDisabled.get(
            cacheName,
            key1
          );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheGet.Hit);
        }, `Expected CacheClient.get to be a Hit, got: '${getResponse.toString()}'`);
        expect((getResponse as CacheGet.Hit).valueString()).toEqual(testValue);
        const getResponse2 =
          await cacheClientWithCompressor_AutoDecompressionDisabled.get(
            cacheName,
            key2
          );
        expectWithMessage(() => {
          expect(getResponse2).toBeInstanceOf(CacheGet.Hit);
        }, `Expected CacheClient.get to be a Hit, got: '${getResponse2.toString()}'`);
        expect((getResponse2 as CacheGet.Hit).valueString()).toEqual(
          testValue2
        );
        const getResponse3 =
          await cacheClientWithCompressor_AutoDecompressionDisabled.get(
            cacheName,
            key3
          );
        expectWithMessage(() => {
          expect(getResponse3).toBeInstanceOf(CacheGet.Hit);
        }, `Expected CacheClient.get to be a Hit, got: '${getResponse3.toString()}'`);
        expect((getResponse3 as CacheGet.Hit).valueString()).toEqual(testValue);
      });

      it('should not compress values if compress omitted', async () => {
        const key1 = randomString();
        const key2 = randomString();
        const key3 = randomString();
        const setBatchResponse =
          await cacheClientWithCompressor_AutoDecompressionDisabled.setBatch(
            cacheName,
            new Map([
              [key1, testValue],
              [key2, testValue2],
              [key3, testValue],
            ])
          );
        expectWithMessage(() => {
          expect(setBatchResponse).toBeInstanceOf(CacheSetBatch.Success);
        }, `Expected CacheClient.setBatch to return Success, but got: ${setBatchResponse.toString()}`);

        const getResponse =
          await cacheClientWithCompressor_AutoDecompressionDisabled.get(
            cacheName,
            key1
          );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheGet.Hit);
        }, `Expected CacheClient.get to be a Hit, got: '${getResponse.toString()}'`);
        expect((getResponse as CacheGet.Hit).valueString()).toEqual(testValue);
        const getResponse2 =
          await cacheClientWithCompressor_AutoDecompressionDisabled.get(
            cacheName,
            key2
          );
        expectWithMessage(() => {
          expect(getResponse2).toBeInstanceOf(CacheGet.Hit);
        }, `Expected CacheClient.get to be a Hit, got: '${getResponse2.toString()}'`);
        expect((getResponse2 as CacheGet.Hit).valueString()).toEqual(
          testValue2
        );
        const getResponse3 =
          await cacheClientWithCompressor_AutoDecompressionDisabled.get(
            cacheName,
            key3
          );
        expectWithMessage(() => {
          expect(getResponse3).toBeInstanceOf(CacheGet.Hit);
        }, `Expected CacheClient.get to be a Hit, got: '${getResponse3.toString()}'`);
        expect((getResponse3 as CacheGet.Hit).valueString()).toEqual(testValue);
      });
    });
  });
  describe('CacheClient.getBatch', () => {
    describe('with compression disabled', () => {
      it('should return an error if decompress is true', async () => {
        const getBatchResponse = await cacheClientWithoutCompressor.getBatch(
          cacheName,
          [randomString()],
          {decompress: true}
        );
        expectWithMessage(() => {
          expect(getBatchResponse).toBeInstanceOf(CacheGetBatch.Error);
          expect(getBatchResponse.toString()).toEqual(
            'Compression Error: Compressor is not set, but `CacheClient.Get` was called with the `decompress` option; please install @gomomento/sdk-nodejs-compression and call `Configuration.withCompressionStrategy` to enable compression.'
          );
        }, `Expected CacheClient.getBatch to return an error if compression is specified without compressor set, but got: ${getBatchResponse.toString()}`);
      });
    });
    describe('with compression enabled and autodecompression enabled', () => {
      describe('when all values are compressed', () => {
        it('should decompress values if decompress is true', async () => {
          const [key1, key2, key3] = await storeTestData(
            [
              [randomString(), testValue],
              [randomString(), testValue2],
              [randomString(), testValue],
            ],
            true
          );
          const getBatchResponse =
            await cacheClientWithCompressor_AutoDecompressionEnabled.getBatch(
              cacheName,
              [key1, key2, key3],
              {decompress: true}
            );

          expectWithMessage(() => {
            expect(getBatchResponse).toBeInstanceOf(CacheGetBatch.Success);
          }, `Expected CacheClient.getBatch to return Success, but got: ${getBatchResponse.toString()}`);

          const values = (
            getBatchResponse as CacheGetBatch.Success
          ).valuesMap();
          expect(values).toEqual(
            new Map([
              [key1, testValue],
              [key2, testValue2],
              [key3, testValue],
            ])
          );
        });

        it('should decompress values if decompress is not set', async () => {
          const [key1, key2, key3] = await storeTestData(
            [
              [randomString(), testValue],
              [randomString(), testValue2],
              [randomString(), testValue],
            ],
            true
          );

          const getBatchResponse =
            await cacheClientWithCompressor_AutoDecompressionEnabled.getBatch(
              cacheName,
              [key1, key2, key3]
            );

          expectWithMessage(() => {
            expect(getBatchResponse).toBeInstanceOf(CacheGetBatch.Success);
          }, `Expected CacheClient.getBatch to return Success, but got: ${getBatchResponse.toString()}`);

          const values = (
            getBatchResponse as CacheGetBatch.Success
          ).valuesMap();
          expect(values).toEqual(
            new Map([
              [key1, testValue],
              [key2, testValue2],
              [key3, testValue],
            ])
          );
        });

        it('should not decompress values if decompress is false', async () => {
          const [key1, key2, key3] = await storeTestData(
            [
              [randomString(), testValue],
              [randomString(), testValue2],
              [randomString(), testValue],
            ],
            true
          );

          const getBatchResponse =
            await cacheClientWithCompressor_AutoDecompressionEnabled.getBatch(
              cacheName,
              [key1, key2, key3],
              {decompress: false}
            );

          expectWithMessage(() => {
            expect(getBatchResponse).toBeInstanceOf(CacheGetBatch.Success);
          }, `Expected CacheClient.getBatch to return Success, but got: ${getBatchResponse.toString()}`);

          const values = (
            getBatchResponse as CacheGetBatch.Success
          ).valuesMapStringUint8Array();
          expect(values).toEqual(
            new Map([
              [key1, testValueCompressed],
              [key2, testValue2Compressed],
              [key3, testValueCompressed],
            ])
          );
        });
      });

      describe('when some values are compressed', () => {
        it('should decompress values if decompress is true', async () => {
          const [key1, key2] = await storeTestData(
            [
              [randomString(), testValue],
              [randomString(), testValue2],
            ],
            true
          );
          const [key3] = await storeTestData(
            [[randomString(), testValue]],
            false
          );

          const getBatchResponse =
            await cacheClientWithCompressor_AutoDecompressionEnabled.getBatch(
              cacheName,
              [key1, key2, key3],
              {decompress: true}
            );
          expectWithMessage(() => {
            expect(getBatchResponse).toBeInstanceOf(CacheGetBatch.Success);
          }, `Expected CacheClient.getBatch to return Success, but got: ${getBatchResponse.toString()}`);

          const values = (
            getBatchResponse as CacheGetBatch.Success
          ).valuesMapStringString();
          expect(values).toEqual(
            new Map([
              [key1, testValue],
              [key2, testValue2],
              [key3, testValue],
            ])
          );
        });

        it('should decompress values if decompress is not set', async () => {
          const [key1, key2] = await storeTestData(
            [
              [randomString(), testValue],
              [randomString(), testValue2],
            ],
            true
          );
          const [key3] = await storeTestData(
            [[randomString(), testValue]],
            false
          );

          const getBatchResponse =
            await cacheClientWithCompressor_AutoDecompressionEnabled.getBatch(
              cacheName,
              [key1, key2, key3]
            );
          expectWithMessage(() => {
            expect(getBatchResponse).toBeInstanceOf(CacheGetBatch.Success);
          }, `Expected CacheClient.getBatch to return Success, but got: ${getBatchResponse.toString()}`);

          const values = (
            getBatchResponse as CacheGetBatch.Success
          ).valuesMapStringString();
          expect(values).toEqual(
            new Map([
              [key1, testValue],
              [key2, testValue2],
              [key3, testValue],
            ])
          );
        });

        it('should not decompress values if decompress is false', async () => {
          const [key1, key2] = await storeTestData(
            [
              [randomString(), testValue],
              [randomString(), testValue2],
            ],
            true
          );
          const [key3] = await storeTestData(
            [[randomString(), testValue]],
            false
          );

          const getBatchResponse =
            await cacheClientWithCompressor_AutoDecompressionEnabled.getBatch(
              cacheName,
              [key1, key2, key3],
              {decompress: false}
            );
          expectWithMessage(() => {
            expect(getBatchResponse).toBeInstanceOf(CacheGetBatch.Success);
          }, `Expected CacheClient.getBatch to return Success, but got: ${getBatchResponse.toString()}`);

          const values = (
            getBatchResponse as CacheGetBatch.Success
          ).valuesMapStringUint8Array();
          expect(values).toEqual(
            new Map([
              [key1, testValueCompressed],
              [key2, testValue2Compressed],
              [key3, testValueBytes],
            ])
          );
        });
      });
    });

    describe('with compression enabled and autodecompression disabled', () => {
      describe('when all values are compressed', () => {
        it('should decompress values if decompress is true', async () => {
          const [key1, key2, key3] = await storeTestData(
            [
              [randomString(), testValue],
              [randomString(), testValue2],
              [randomString(), testValue],
            ],
            true
          );
          const getBatchResponse =
            await cacheClientWithCompressor_AutoDecompressionDisabled.getBatch(
              cacheName,
              [key1, key2, key3],
              {decompress: true}
            );

          expectWithMessage(() => {
            expect(getBatchResponse).toBeInstanceOf(CacheGetBatch.Success);
          }, `Expected CacheClient.getBatch to return Success, but got: ${getBatchResponse.toString()}`);

          const values = (
            getBatchResponse as CacheGetBatch.Success
          ).valuesMap();
          expect(values).toEqual(
            new Map([
              [key1, testValue],
              [key2, testValue2],
              [key3, testValue],
            ])
          );
        });

        it('should not decompress values if decompress is not set', async () => {
          const [key1, key2, key3] = await storeTestData(
            [
              [randomString(), testValue],
              [randomString(), testValue2],
              [randomString(), testValue],
            ],
            true
          );
          const getBatchResponse =
            await cacheClientWithCompressor_AutoDecompressionDisabled.getBatch(
              cacheName,
              [key1, key2, key3]
            );

          expectWithMessage(() => {
            expect(getBatchResponse).toBeInstanceOf(CacheGetBatch.Success);
          }, `Expected CacheClient.getBatch to return Success, but got: ${getBatchResponse.toString()}`);

          const values = (
            getBatchResponse as CacheGetBatch.Success
          ).valuesMapStringUint8Array();
          expect(values).toEqual(
            new Map([
              [key1, testValueCompressed],
              [key2, testValue2Compressed],
              [key3, testValueCompressed],
            ])
          );
        });

        it('should not decompress values if decompress is false', async () => {
          const [key1, key2, key3] = await storeTestData(
            [
              [randomString(), testValue],
              [randomString(), testValue2],
              [randomString(), testValue],
            ],
            true
          );
          const getBatchResponse =
            await cacheClientWithCompressor_AutoDecompressionDisabled.getBatch(
              cacheName,
              [key1, key2, key3],
              {decompress: false}
            );

          expectWithMessage(() => {
            expect(getBatchResponse).toBeInstanceOf(CacheGetBatch.Success);
          }, `Expected CacheClient.getBatch to return Success, but got: ${getBatchResponse.toString()}`);

          const values = (
            getBatchResponse as CacheGetBatch.Success
          ).valuesMapStringUint8Array();
          expect(values).toEqual(
            new Map([
              [key1, testValueCompressed],
              [key2, testValue2Compressed],
              [key3, testValueCompressed],
            ])
          );
        });
      });

      describe('when some values are compressed', () => {
        it('should decompress values if decompress is true', async () => {
          const [key1, key2] = await storeTestData(
            [
              [randomString(), testValue],
              [randomString(), testValue2],
            ],
            true
          );
          const [key3] = await storeTestData(
            [[randomString(), testValue]],
            false
          );

          const getBatchResponse =
            await cacheClientWithCompressor_AutoDecompressionDisabled.getBatch(
              cacheName,
              [key1, key2, key3],
              {decompress: true}
            );

          expectWithMessage(() => {
            expect(getBatchResponse).toBeInstanceOf(CacheGetBatch.Success);
          }, `Expected CacheClient.getBatch to return Success, but got: ${getBatchResponse.toString()}`);

          const values = (
            getBatchResponse as CacheGetBatch.Success
          ).valuesMapStringString();
          expect(values).toEqual(
            new Map([
              [key1, testValue],
              [key2, testValue2],
              [key3, testValue],
            ])
          );
        });

        it('should not decompress values if decompress is not set', async () => {
          const [key1, key2] = await storeTestData(
            [
              [randomString(), testValue],
              [randomString(), testValue2],
            ],
            true
          );
          const [key3] = await storeTestData(
            [[randomString(), testValue]],
            false
          );

          const getBatchResponse =
            await cacheClientWithCompressor_AutoDecompressionDisabled.getBatch(
              cacheName,
              [key1, key2, key3]
            );

          expectWithMessage(() => {
            expect(getBatchResponse).toBeInstanceOf(CacheGetBatch.Success);
          }, `Expected CacheClient.getBatch to return Success, but got: ${getBatchResponse.toString()}`);

          const values = (
            getBatchResponse as CacheGetBatch.Success
          ).valuesMapStringUint8Array();
          expect(values).toEqual(
            new Map([
              [key1, testValueCompressed],
              [key2, testValue2Compressed],
              [key3, testValueBytes],
            ])
          );
        });
        it('should not decompress values if decompress is false', async () => {
          const [key1, key2] = await storeTestData(
            [
              [randomString(), testValue],
              [randomString(), testValue2],
            ],
            true
          );
          const [key3] = await storeTestData(
            [[randomString(), testValue]],
            false
          );

          const getBatchResponse =
            await cacheClientWithCompressor_AutoDecompressionDisabled.getBatch(
              cacheName,
              [key1, key2, key3],
              {decompress: false}
            );

          expectWithMessage(() => {
            expect(getBatchResponse).toBeInstanceOf(CacheGetBatch.Success);
          }, `Expected CacheClient.getBatch to return Success, but got: ${getBatchResponse.toString()}`);

          const values = (
            getBatchResponse as CacheGetBatch.Success
          ).valuesMapStringUint8Array();
          expect(values).toEqual(
            new Map([
              [key1, testValueCompressed],
              [key2, testValue2Compressed],
              [key3, testValueBytes],
            ])
          );
        });
      });
    });
  });
});

async function storeTestData(
  data: [string, string][],
  compress: boolean
): Promise<string[]> {
  const keys = data.map(([key]) => key);
  const setBatchResponse =
    await cacheClientWithCompressor_AutoDecompressionEnabled.setBatch(
      cacheName,
      new Map(data),
      {compress: compress}
    );
  expectWithMessage(() => {
    expect(setBatchResponse).toBeInstanceOf(CacheSetBatch.Success);
  }, `Expected CacheClient.setBatch to return Success, but got: ${setBatchResponse.toString()}`);
  return keys;
}
