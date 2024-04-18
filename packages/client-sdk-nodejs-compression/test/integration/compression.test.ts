import {expectWithMessage, setupIntegrationTest} from './integration-setup';
import {
  AutomaticDecompression,
  CacheClient,
  CacheGet,
  CacheSet,
  CacheSetIfAbsent,
  CompressionLevel,
} from '@gomomento/sdk';
import {CompressorFactory} from '../../src';
import {v4} from 'uuid';
import {CompressionError} from '@gomomento/sdk/dist/src/errors/compression-error';

const {cacheClientPropsWithConfig, cacheName} = setupIntegrationTest();

const cacheClientWithDefaultCompressorFactoryNoDecompress = new CacheClient({
  configuration:
    cacheClientPropsWithConfig.configuration.withCompressionStrategy({
      compressorFactory: CompressorFactory.default(),
      compressionLevel: CompressionLevel.SmallestSize,
      automaticDecompression: AutomaticDecompression.Disabled,
    }),
  credentialProvider: cacheClientPropsWithConfig.credentialProvider,
  defaultTtlSeconds: cacheClientPropsWithConfig.defaultTtlSeconds,
});

const cacheClientWithDefaultCompressorFactoryDecompress = new CacheClient({
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

const invalidCompressed = Uint8Array.from([40, 181, 47, 253, 0]);

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
      const cacheClient = cacheClientWithDefaultCompressorFactoryNoDecompress;
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
      const cacheClient = cacheClientWithDefaultCompressorFactoryNoDecompress;
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
      const setResponse = await cacheClientWithoutCompressorFactory.setIfAbsent(
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
      const cacheClient = cacheClientWithDefaultCompressorFactoryNoDecompress;
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
      const cacheClient = cacheClientWithDefaultCompressorFactoryNoDecompress;
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
      const cacheClient = cacheClientWithDefaultCompressorFactoryNoDecompress;
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
      const cacheClient = cacheClientWithDefaultCompressorFactoryDecompress;
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
      const cacheClient = cacheClientWithDefaultCompressorFactoryNoDecompress;
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
      const cacheClient = cacheClientWithDefaultCompressorFactoryDecompress;
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
      const cacheClient = cacheClientWithDefaultCompressorFactoryDecompress;
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
    it('should return an error if decompression is enabled and the client receives invalid ZSTD data', async () => {
      const noCompressCacheClient = cacheClientWithoutCompressorFactory;
      const key = randomString();
      const setResponse = await noCompressCacheClient.set(
        cacheName,
        key,
        invalidCompressed
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `Expected CacheClient.set to be a success, got: '${setResponse.toString()}'`);

      const getResponse =
        await cacheClientWithDefaultCompressorFactoryDecompress.get(
          cacheName,
          key
        );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Error);
      }, `Expected CacheClient.get to be an Error when receiving invalid ZSTD data, got: '${getResponse.toString()}'`);
    });
  });
});
