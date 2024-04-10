import {expectWithMessage, setupIntegrationTest} from './integration-setup';
import {
  CacheClient,
  CacheGet,
  CacheSet,
  CacheDictionarySetField,
  CacheDictionarySetFields,
  CacheDictionaryGetField,
  CacheDictionaryFetch,
  CompressionLevel,
  CacheDictionaryGetFields,
} from '@gomomento/sdk';
import {CompressorFactory} from '../../src';
import {v4} from 'uuid';
import {CompressionError} from '@gomomento/sdk/dist/src/errors/compression-error';

const {cacheClientPropsWithConfig, cacheName} = setupIntegrationTest();

const cacheClientWithDefaultCompressorFactory = new CacheClient({
  configuration:
    cacheClientPropsWithConfig.configuration.withCompressionStrategy({
      compressorFactory: CompressorFactory.default(),
      compressionLevel: CompressionLevel.SmallestSize,
    }),
  credentialProvider: cacheClientPropsWithConfig.credentialProvider,
  defaultTtlSeconds: cacheClientPropsWithConfig.defaultTtlSeconds,
});

const cacheClientWithoutCompressorFactory = new CacheClient({
  configuration: cacheClientPropsWithConfig.configuration,
  credentialProvider: cacheClientPropsWithConfig.credentialProvider,
  defaultTtlSeconds: cacheClientPropsWithConfig.defaultTtlSeconds,
});

function randomString() {
  return v4();
}

const testValue = 'my-value';
const testValueCompressed = Uint8Array.from([
  40, 181, 47, 253, 0, 96, 65, 0, 0, 109, 121, 45, 118, 97, 108, 117, 101,
]);
const testValue2 = 'my-value2';
const testValue2Compressed = Uint8Array.from([
  40, 181, 47, 253, 0, 96, 73, 0, 0, 109, 121, 45, 118, 97, 108, 117, 101, 50,
]);

const bytesEncoderForTests = new TextEncoder();
function uint8ArrayForTest(value: string): Uint8Array {
  return Uint8Array.from(bytesEncoderForTests.encode(value));
}

function compareMapStringUint8Array(
  actual: Map<string, Uint8Array>,
  expected: Map<string, Uint8Array>
) {
  expect(actual.size).toEqual(expected.size);
  for (const [key, value] of expected) {
    expect(actual.has(key)).toBeTruthy();
    expect(actual.get(key)).toEqual(value);
  }
}

describe('CompressorFactory', () => {
  describe('CacheClient.set', () => {
    it('should return an error if compress is true but compression is not enabled', async () => {
      const setResponse = await cacheClientWithoutCompressorFactory.set(
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
      const cacheClient = cacheClientWithDefaultCompressorFactory;
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
      const cacheClient = cacheClientWithDefaultCompressorFactory;
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
  describe('CacheClient.get', () => {
    it('should not return an error if decompress is true and compression is not enabled and it is a miss', async () => {
      const getResponse = await cacheClientWithoutCompressorFactory.get(
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
      const cacheClient = cacheClientWithoutCompressorFactory;
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
      const cacheClient = cacheClientWithDefaultCompressorFactory;
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
    it('should not decompress the value if decompress is false', async () => {
      const cacheClient = cacheClientWithDefaultCompressorFactory;
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
    it('should return the value if it is not compressed and decompress is true', async () => {
      const cacheClient = cacheClientWithDefaultCompressorFactory;
      const key = randomString();
      const setResponse = await cacheClient.set(cacheName, key, testValue);
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
  });
  describe('CacheClient.dictionarySetField', () => {
    it('should return an error if compress is true but compression is not enabled', async () => {
      const setResponse =
        await cacheClientWithoutCompressorFactory.dictionarySetField(
          cacheName,
          randomString(),
          'my-field',
          testValue,
          {
            compress: true,
          }
        );
      console.log(setResponse.toString());
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheDictionarySetField.Error);
        expect(
          (setResponse as CacheDictionarySetField.Error).toString()
        ).toEqual(
          new CompressionError(
            'CacheClient.dictionarySetField',
            'compress'
          ).wrappedErrorMessage()
        );
      }, `Expected CacheClient.dictionarySetField to return an error if compression is specified without compressor set, but got: ${setResponse.toString()}`);
    });
    it('should compress the value if compress is true', async () => {
      const cacheClient = cacheClientWithDefaultCompressorFactory;
      const key = randomString();
      const setResponse = await cacheClient.dictionarySetField(
        cacheName,
        key,
        'my-field',
        testValue,
        {
          compress: true,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheDictionarySetField.Success);
      }, `Expected CacheClient.dictionarySetField to be a success with compression specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.dictionaryGetField(
        cacheName,
        key,
        'my-field'
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
      }, `Expected CacheClient.dictionaryGetField to be a hit after CacheClient.dictionarySetField with compression specified, got: '${getResponse.toString()}'`);

      expect(
        (getResponse as CacheDictionaryGetField.Hit).valueUint8Array()
      ).toEqual(testValueCompressed);
    });
    it('should not compress the value if compress is not specified', async () => {
      const cacheClient = cacheClientWithDefaultCompressorFactory;
      const key = randomString();
      const setResponse = await cacheClient.dictionarySetField(
        cacheName,
        key,
        'my-field',
        testValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheDictionarySetField.Success);
      }, `Expected CacheClient.dictionarySetField to be a success with no compression specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.dictionaryGetField(
        cacheName,
        key,
        'my-field'
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
      }, `Expected CacheClient.dictionaryGetField to be a hit after CacheClient.dictionarySetField with no compression specified, got: '${getResponse.toString()}'`);

      expect(
        (getResponse as CacheDictionaryGetField.Hit).valueString()
      ).toEqual(testValue);
    });
  });
  describe('CacheClient.dictionaryGetField', () => {
    it('should not return an error if decompress is true and compression is not enabled and it is a miss', async () => {
      const getResponse =
        await cacheClientWithoutCompressorFactory.dictionaryGetField(
          cacheName,
          randomString(),
          'my-field',
          {
            decompress: true,
          }
        );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Miss);
      }, `Expected CacheClient.dictionaryGetField to be a miss with decompression specified and no compression enabled, got: '${getResponse.toString()}'`);
    });
    it('should return an error if decompress is true and compression is not enabled and it is a hit', async () => {
      const cacheClient = cacheClientWithoutCompressorFactory;
      const key = randomString();
      const setResponse = await cacheClient.dictionarySetField(
        cacheName,
        key,
        'my-field',
        testValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheDictionarySetField.Success);
      }, `Expected CacheClient.dictionarySetField to be a success with no compression specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.dictionaryGetField(
        cacheName,
        key,
        'my-field',
        {
          decompress: true,
        }
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Error);
        expect(
          (getResponse as CacheDictionaryGetField.Error).toString()
        ).toEqual(
          new CompressionError(
            'CacheClient.dictionaryGetField',
            'decompress'
          ).wrappedErrorMessage()
        );
      }, `Expected CacheClient.dictionaryGetField to return an error if decompression is specified without compressor set, but got: ${getResponse.toString()}`);
    });
    it('should decompress the value if decompress is true', async () => {
      const cacheClient = cacheClientWithDefaultCompressorFactory;
      const key = randomString();
      const setResponse = await cacheClient.dictionarySetField(
        cacheName,
        key,
        'my-field',
        testValue,
        {
          compress: true,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheDictionarySetField.Success);
      }, `Expected CacheClient.dictionarySetField to be a success with compression specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.dictionaryGetField(
        cacheName,
        key,
        'my-field',
        {
          decompress: true,
        }
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
        expect(
          (getResponse as CacheDictionaryGetField.Hit).valueString()
        ).toEqual(testValue);
      }, `Expected CacheClient.dictionaryGetField to be a hit after CacheClient.dictionarySetField with compression specified, got: '${getResponse.toString()}'`);
    });
    it('should not decompress the value if decompress is false', async () => {
      const cacheClient = cacheClientWithDefaultCompressorFactory;
      const key = randomString();
      const setResponse = await cacheClient.dictionarySetField(
        cacheName,
        key,
        'my-field',
        testValue,
        {
          compress: true,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheDictionarySetField.Success);
      }, `Expected CacheClient.dictionarySetField to be a success with compression specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.dictionaryGetField(
        cacheName,
        key,
        'my-field',
        {
          decompress: false,
        }
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
        expect(
          (getResponse as CacheDictionaryGetField.Hit).valueUint8Array()
        ).toEqual(testValueCompressed);
      }, `Expected CacheClient.dictionaryGetField to be a hit after CacheClient.dictionarySetField with compression specified, got: '${getResponse.toString()}'`);
    });
    it('should return the value if it is not compressed and decompress is true', async () => {
      const cacheClient = cacheClientWithDefaultCompressorFactory;
      const key = randomString();
      const setResponse = await cacheClient.dictionarySetField(
        cacheName,
        key,
        'my-field',
        testValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheDictionarySetField.Success);
      }, `Expected CacheClient.dictionarySetField to be a success with compression specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.dictionaryGetField(
        cacheName,
        key,
        'my-field',
        {
          decompress: true,
        }
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
        expect(
          (getResponse as CacheDictionaryGetField.Hit).valueString()
        ).toEqual(testValue);
      }, `Expected CacheClient.dictionaryGetField to be a hit after CacheClient.dictionarySetField with compression specified, got: '${getResponse.toString()}'`);
    });
  });
  describe('CacheClient.dictionarySetFields', () => {
    it('should return an error if compress is true but compression is not enabled', async () => {
      const setResponse =
        await cacheClientWithoutCompressorFactory.dictionarySetFields(
          cacheName,
          randomString(),
          {
            'my-field': testValue,
          },
          {
            compress: true,
          }
        );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheDictionarySetFields.Error);
        expect(
          (setResponse as CacheDictionarySetFields.Error).toString()
        ).toEqual(
          new CompressionError(
            'CacheClient.dictionarySetFields',
            'compress'
          ).wrappedErrorMessage()
        );
      }, `Expected CacheClient.dictionarySetFields to return an error if compression is specified without compressor set, but got: ${setResponse.toString()}`);
    });
    it('should compress the value if compress is true', async () => {
      const cacheClient = cacheClientWithDefaultCompressorFactory;
      const key = randomString();
      const setResponse = await cacheClient.dictionarySetFields(
        cacheName,
        key,
        {
          'my-field': testValue,
          'my-field2': testValue2,
        },
        {
          compress: true,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheDictionarySetFields.Success);
      }, `Expected CacheClient.dictionarySetFields to be a success with compression specified, got: '${setResponse.toString()}'`);

      // Test heterogeneous case
      const setResponse2 = await cacheClient.dictionarySetField(
        cacheName,
        key,
        'my-field3',
        testValue
      );
      expectWithMessage(() => {
        expect(setResponse2).toBeInstanceOf(CacheDictionarySetField.Success);
      }, `Expected CacheClient.dictionarySetField to be a success with no compression specified, got: '${setResponse2.toString()}'`);

      const fetchResponse = await cacheClient.dictionaryFetch(cacheName, key);
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheDictionaryFetch.Hit);
        const actual = (
          fetchResponse as CacheDictionaryFetch.Hit
        ).valueMapStringUint8Array();
        compareMapStringUint8Array(
          actual,
          new Map<string, Uint8Array>([
            ['my-field', Uint8Array.from(testValueCompressed)],
            ['my-field2', Uint8Array.from(testValue2Compressed)],
            ['my-field3', Uint8Array.from(uint8ArrayForTest(testValue))],
          ])
        );
      }, `Expected CacheClient.dictionaryGetFields to be a hit after CacheClient.dictionarySetFields with compression specified, got: '${fetchResponse.toString()}'`);
    });
    it('should not compress the value if compress is not specified', async () => {
      const cacheClient = cacheClientWithDefaultCompressorFactory;
      const key = randomString();
      const setResponse = await cacheClient.dictionarySetFields(
        cacheName,
        key,
        {
          'my-field': testValue,
          'my-field2': testValue2,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheDictionarySetFields.Success);
      }, `Expected CacheClient.dictionarySetFields to be a success with no compression specified, got: '${setResponse.toString()}'`);

      const fetchResponse = await cacheClient.dictionaryFetch(cacheName, key);
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheDictionaryFetch.Hit);
        expect((fetchResponse as CacheDictionaryFetch.Hit).value()).toEqual({
          'my-field': testValue,
          'my-field2': testValue2,
        });
      }, `Expected CacheClient.dictionaryGetFields to be a hit after CacheClient.dictionarySetFields with no compression specified, got: '${fetchResponse.toString()}'`);
    });
  });
  describe('CacheClient.dictionaryGetFields', () => {
    it('should not return an error if decompress is true and compression is not enabled and it is a miss', async () => {
      const getResponse =
        await cacheClientWithoutCompressorFactory.dictionaryGetFields(
          cacheName,
          randomString(),
          ['my-field', 'my-field2'],
          {
            decompress: true,
          }
        );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheDictionaryGetFields.Miss);
      }, `Expected CacheClient.dictionaryGetFields to be a miss with decompression specified and no compression enabled, got: '${getResponse.toString()}'`);
    });
    it('should return an error if decompress is true and compression is not enabled and it is a hit', async () => {
      const cacheClient = cacheClientWithoutCompressorFactory;
      const key = randomString();
      const setResponse = await cacheClient.dictionarySetFields(
        cacheName,
        key,
        {
          'my-field': testValue,
          'my-field2': testValue2,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheDictionarySetFields.Success);
      }, `Expected CacheClient.dictionarySetFields to be a success with no compression specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.dictionaryGetFields(
        cacheName,
        key,
        ['my-field', 'my-field2'],
        {
          decompress: true,
        }
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheDictionaryGetFields.Error);
        expect(
          (getResponse as CacheDictionaryGetFields.Error).toString()
        ).toEqual(
          new CompressionError(
            'CacheClient.dictionaryGetFields',
            'decompress'
          ).wrappedErrorMessage()
        );
      }, `Expected CacheClient.dictionaryGetFields to return an error if decompression is specified without compressor set, but got: ${getResponse.toString()}`);
    });
    it('should decompress the value if decompress is true', async () => {
      const cacheClient = cacheClientWithDefaultCompressorFactory;
      const key = randomString();
      const setResponse = await cacheClient.dictionarySetFields(
        cacheName,
        key,
        {
          'my-field': testValue,
          'my-field2': testValue2,
        },
        {
          compress: true,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheDictionarySetFields.Success);
      }, `Expected CacheClient.dictionarySetFields to be a success with compression specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.dictionaryGetFields(
        cacheName,
        key,
        ['my-field', 'my-field2'],
        {
          decompress: true,
        }
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheDictionaryGetFields.Hit);
        expect((getResponse as CacheDictionaryGetFields.Hit).value()).toEqual({
          'my-field': testValue,
          'my-field2': testValue2,
        });
      }, `Expected CacheClient.dictionaryGetFields to be a hit after CacheClient.dictionarySetFields with compression specified, got: '${getResponse.toString()}'`);
    });
    it('should not decompress the value if decompress is false', async () => {
      const cacheClient = cacheClientWithDefaultCompressorFactory;
      const key = randomString();
      const setResponse = await cacheClient.dictionarySetFields(
        cacheName,
        key,
        {
          'my-field': testValue,
          'my-field2': testValue2,
        },
        {
          compress: true,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheDictionarySetFields.Success);
      }, `Expected CacheClient.dictionarySetFields to be a success with compression specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.dictionaryGetFields(
        cacheName,
        key,
        ['my-field', 'my-field2'],
        {
          decompress: false,
        }
      );

      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheDictionaryGetFields.Hit);
        const actual = (
          getResponse as CacheDictionaryGetFields.Hit
        ).valueMapStringUint8Array();
        compareMapStringUint8Array(
          actual,
          new Map<string, Uint8Array>([
            ['my-field', Uint8Array.from(testValueCompressed)],
            ['my-field2', Uint8Array.from(testValue2Compressed)],
          ])
        );
      }, `Expected CacheClient.dictionaryGetFields to be a hit after CacheClient.dictionarySetFields with compression specified, got: '${getResponse.toString()}'`);
    });
    it('should return the value if it is not compressed and decompress is true', async () => {
      const cacheClient = cacheClientWithDefaultCompressorFactory;
      const key = randomString();
      const setResponse = await cacheClient.dictionarySetFields(
        cacheName,
        key,
        {
          'my-field': testValue,
          'my-field2': testValue2,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheDictionarySetFields.Success);
      }, `Expected CacheClient.dictionarySetFields to be a success with compression specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.dictionaryGetFields(
        cacheName,
        key,
        ['my-field', 'my-field2'],
        {
          decompress: true,
        }
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheDictionaryGetFields.Hit);
        expect((getResponse as CacheDictionaryGetFields.Hit).value()).toEqual({
          'my-field': testValue,
          'my-field2': testValue2,
        });
      }, `Expected CacheClient.dictionaryGetFields to be a hit after CacheClient.dictionarySetFields with compression specified, got: '${getResponse.toString()}'`);
    });
  });
  describe('CacheClient.dictionaryFetch', () => {
    it('should not return an error if decompress is true and compression is not enabled and it is a miss', async () => {
      const fetchResponse =
        await cacheClientWithoutCompressorFactory.dictionaryFetch(
          cacheName,
          randomString(),
          {
            decompress: true,
          }
        );
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheDictionaryFetch.Miss);
      }, `Expected CacheClient.dictionaryFetch to be a miss with decompression specified and no compression enabled, got: '${fetchResponse.toString()}'`);
    });
    it('should return an error if decompress is true and compression is not enabled and it is a hit', async () => {
      const cacheClient = cacheClientWithoutCompressorFactory;
      const key = randomString();
      const setResponse = await cacheClient.dictionarySetFields(
        cacheName,
        key,
        {
          'my-field': testValue,
          'my-field2': testValue2,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheDictionarySetFields.Success);
      }, `Expected CacheClient.dictionarySetFields to be a success with no compression specified, got: '${setResponse.toString()}'`);

      const fetchResponse = await cacheClient.dictionaryFetch(cacheName, key, {
        decompress: true,
      });
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheDictionaryFetch.Error);
        expect(
          (fetchResponse as CacheDictionaryFetch.Error).toString()
        ).toEqual(
          new CompressionError(
            'CacheClient.dictionaryFetch',
            'decompress'
          ).wrappedErrorMessage()
        );
      }, `Expected CacheClient.dictionaryFetch to return an error if decompression is specified without compressor set, but got: ${fetchResponse.toString()}`);
    });
    it('should decompress the value if decompress is true', async () => {
      const cacheClient = cacheClientWithDefaultCompressorFactory;
      const key = randomString();
      const setResponse = await cacheClient.dictionarySetFields(
        cacheName,
        key,
        {
          'my-field': testValue,
          'my-field2': testValue2,
        },
        {
          compress: true,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheDictionarySetFields.Success);
      }, `Expected CacheClient.dictionarySetFields to be a success with compression specified, got: '${setResponse.toString()}'`);

      // Test the heterogeneous case
      const setResponse2 = await cacheClient.dictionarySetField(
        cacheName,
        key,
        'my-field3',
        testValue
      );
      expectWithMessage(() => {
        expect(setResponse2).toBeInstanceOf(CacheDictionarySetField.Success);
      }, `Expected CacheClient.dictionarySetField to be a success with no compression specified, got: '${setResponse2.toString()}'`);

      const fetchResponse = await cacheClient.dictionaryFetch(cacheName, key, {
        decompress: true,
      });
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheDictionaryFetch.Hit);
        const actual = (fetchResponse as CacheDictionaryFetch.Hit).value();
        expect(actual).toEqual({
          'my-field': testValue,
          'my-field2': testValue2,
          'my-field3': testValue,
        });
      }, `Expected CacheClient.dictionaryFetch to be a hit after CacheClient.dictionarySetFields with compression specified, got: '${fetchResponse.toString()}'`);
    });
    it('should not decompress the value if decompress is false', async () => {
      const cacheClient = cacheClientWithDefaultCompressorFactory;
      const key = randomString();
      const setResponse = await cacheClient.dictionarySetFields(
        cacheName,
        key,
        {
          'my-field': testValue,
          'my-field2': testValue2,
        },
        {
          compress: true,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheDictionarySetFields.Success);
      }, `Expected CacheClient.dictionarySetFields to be a success with compression specified, got: '${setResponse.toString()}'`);

      const fetchResponse = await cacheClient.dictionaryFetch(cacheName, key, {
        decompress: false,
      });
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheDictionaryFetch.Hit);
        const actual = (
          fetchResponse as CacheDictionaryFetch.Hit
        ).valueMapStringUint8Array();
        compareMapStringUint8Array(
          actual,
          new Map<string, Uint8Array>([
            ['my-field', Uint8Array.from(testValueCompressed)],
            ['my-field2', Uint8Array.from(testValue2Compressed)],
          ])
        );
      }, `Expected CacheClient.dictionaryFetch to be a hit after CacheClient.dictionarySetFields with compression specified, got: '${fetchResponse.toString()}'`);
    });
    it('should return the value if it is not compressed and decompress is true', async () => {
      const cacheClient = cacheClientWithDefaultCompressorFactory;
      const key = randomString();
      const setResponse = await cacheClient.dictionarySetFields(
        cacheName,
        key,
        {
          'my-field': testValue,
          'my-field2': testValue2,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheDictionarySetFields.Success);
      }, `Expected CacheClient.dictionarySetFields to be a success with compression specified, got: '${setResponse.toString()}'`);

      const fetchResponse = await cacheClient.dictionaryFetch(cacheName, key, {
        decompress: true,
      });
      expectWithMessage(() => {
        expect(fetchResponse).toBeInstanceOf(CacheDictionaryFetch.Hit);
        expect((fetchResponse as CacheDictionaryFetch.Hit).value()).toEqual({
          'my-field': testValue,
          'my-field2': testValue2,
        });
      }, `Expected CacheClient.dictionaryFetch to be a hit after CacheClient.dictionarySetFields with compression specified, got: '${fetchResponse.toString()}'`);
    });
  });
});
