import {expectWithMessage, setupIntegrationTest} from './integration-setup';
import {
  CacheClient,
  CacheGet,
  CacheSet,
  CompressionLevel,
} from '@gomomento/sdk';
import {CompressorFactory} from '../../src';
import {v4} from 'uuid';

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
const testValueCompressed = [
  40, 181, 47, 253, 0, 96, 65, 0, 0, 109, 121, 45, 118, 97, 108, 117, 101,
];

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
          'Invalid argument passed to Momento client: Compressor is not set, but `CacheClient.set` was called with the `compress` option; please install @gomomento/sdk-nodejs-compression and call `Configuration.withCompressionStrategy` to enable compression.'
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
      expect(
        Array.from((getResponse as CacheGet.Hit).valueUint8Array())
      ).toEqual(testValueCompressed);
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

      expect(
        Array.from((getResponse as CacheGet.Hit).valueUint8Array())
      ).toEqual(testValueCompressed);
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
  /*describe('CacheClient.dictionarySetField', () => {
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
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Error);
        expect((setResponse as CacheSet.Error).toString()).toEqual(
          'Invalid argument passed to Momento client: Compressor is not set, but `CacheClient.dictionarySetField` was called with the `compress` option; please install @gomomento/sdk-nodejs-compression and call `Configuration.withCompressionStrategy` to enable compression.'
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
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `Expected CacheClient.dictionarySetField to be a success with compression specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.dictionaryGetField(
        cacheName,
        key,
        'my-field'
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `Expected CacheClient.dictionaryGetField to be a hit after CacheClient.dictionarySetField with compression specified, got: '${getResponse.toString()}'`);

      expect((getResponse as CacheGet.Hit).valueString()).toEqual(
        testValueCompressed
      );
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
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `Expected CacheClient.dictionarySetField to be a success with no compression specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.dictionaryGetField(
        cacheName,
        key,
        'my-field'
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `Expected CacheClient.dictionaryGetField to be a hit after CacheClient.dictionarySetField with no compression specified, got: '${getResponse.toString()}'`);

      expect((getResponse as CacheGet.Hit).valueString()).toEqual(testValue);
    });
  });*/
});
