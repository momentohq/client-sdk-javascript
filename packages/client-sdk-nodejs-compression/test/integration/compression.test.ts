import {expectWithMessage, setupIntegrationTest} from './integration-setup';
import {
  CacheClient,
  CacheGet,
  CacheSet,
  CompressionLevel,
  DecompressionMode,
} from '@gomomento/sdk';
import {CompressorFactory} from '../../src';

const {cacheClientPropsWithConfig, cacheName} = setupIntegrationTest();

const cacheClientWithDefaultCompressorFactory = new CacheClient({
  configuration: cacheClientPropsWithConfig.configuration.withCompression({
    compressorFactory: CompressorFactory.default(),
  }),
  credentialProvider: cacheClientPropsWithConfig.credentialProvider,
  defaultTtlSeconds: cacheClientPropsWithConfig.defaultTtlSeconds,
});

const cacheClientWithoutCompressorFactory = new CacheClient({
  configuration: cacheClientPropsWithConfig.configuration,
  credentialProvider: cacheClientPropsWithConfig.credentialProvider,
  defaultTtlSeconds: cacheClientPropsWithConfig.defaultTtlSeconds,
});

const testValue = 'my-value';
const testValueCompressed = [
  40, 181, 47, 253, 0, 88, 65, 0, 0, 109, 121, 45, 118, 97, 108, 117, 101,
];

describe('CompressorFactory', () => {
  describe('CacheClient.set', () => {
    it('should return an error if CompressionLevel is specified but compression is not enabled', async () => {
      const setResponse = await cacheClientWithoutCompressorFactory.set(
        cacheName,
        'my-key',
        testValue,
        {
          compressionLevel: CompressionLevel.Default,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Error);
        expect((setResponse as CacheSet.Error).toString()).toEqual(
          'Invalid argument passed to Momento client: Compression extension is not loaded, but `CacheClient.set` was called with the `compressionLevel` option; please install @gomomento/sdk-nodejs-compressionLevel and call `Configuration.withCompression` to enable compressionLevel.'
        );
      }, `Expected CacheClient.set to return an error if a CompressionMode is specified without compression extensions loaded, but got: ${setResponse.toString()}`);
    });
    it('should compress the value if CompressionLevel is specified', async () => {
      const cacheClient = cacheClientWithDefaultCompressorFactory;
      const setResponse = await cacheClient.set(
        cacheName,
        'my-key',
        testValue,
        {
          compressionLevel: CompressionLevel.Default,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `Expected CacheClient.set to be a success with CompressionMode specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.get(cacheName, 'my-key');
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `Expected CacheClient.get to be a hit after CacheClient.set with CompressionMode specified, got: '${getResponse.toString()}'`);

      console.log(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `THE COMPRESSED BYTES: ${(
          getResponse as CacheGet.Hit
        ).valueUint8Array()}`
      );
      expect(
        Array.from((getResponse as CacheGet.Hit).valueUint8Array())
      ).toEqual(testValueCompressed);
    });
    it('should not compress the value if CompressionLevel is not specified', async () => {
      const cacheClient = cacheClientWithDefaultCompressorFactory;
      console.log('TEST CALLING SET');
      const setResponse = await cacheClient.set(cacheName, 'my-key', testValue);
      console.log('TEST BACK FROM SET');
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `Expected CacheClient.set to be a success with no CompressionMode specified, got: '${setResponse.toString()}'`);

      console.log('TEST CALLING GET');
      const getResponse = await cacheClient.get(cacheName, 'my-key');
      console.log('TEST BACK FROM GET');
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `Expected CacheClient.get to be a hit after CacheClient.set with no CompressionMode specified, got: '${getResponse.toString()}'`);

      expect((getResponse as CacheGet.Hit).valueString()).toEqual(testValue);
    });
    it('should return an error if CompressionLevel is specified but compression is not enabled', async () => {
      const setResponse = await cacheClientWithoutCompressorFactory.set(
        cacheName,
        'my-key',
        testValue,
        {
          compressionLevel: CompressionLevel.Default,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Error);
        expect((setResponse as CacheSet.Error).toString()).toEqual(
          'Invalid argument passed to Momento client: Compression extension is not loaded, but `CacheClient.set` was called with the `compressionLevel` option; please install @gomomento/sdk-nodejs-compressionLevel and call `Configuration.withCompression` to enable compressionLevel.'
        );
      }, `Expected CacheClient.set to be an Error with compression disabled and CompressionMode specified, got: '${setResponse.toString()}'`);
    });
  });
  describe('CacheClient.get', () => {
    it('should decompress the value if DecompressionMode is enabled', async () => {
      const cacheClient = cacheClientWithDefaultCompressorFactory;
      const setResponse = await cacheClient.set(
        cacheName,
        'my-key',
        testValue,
        {
          compressionLevel: CompressionLevel.Default,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `Expected CacheClient.set to be a success with CompressionMode specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.get(cacheName, 'my-key', {
        decompressionMode: DecompressionMode.Enabled,
      });
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `Expected CacheClient.get to be a hit after CacheClient.set with CompressionMode specified, got: '${getResponse.toString()}'`);

      expect((getResponse as CacheGet.Hit).valueString()).toEqual(testValue);
    });
    it('should not decompress the value if DecompressionMode is disabled', async () => {
      const cacheClient = cacheClientWithDefaultCompressorFactory;
      const setResponse = await cacheClient.set(
        cacheName,
        'my-key',
        testValue,
        {
          compressionLevel: CompressionLevel.Default,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `Expected CacheClient.set to be a success with CompressionMode specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.get(cacheName, 'my-key', {
        decompressionMode: DecompressionMode.Disabled,
      });
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `Expected CacheClient.get to be a hit after CacheClient.set with CompressionMode specified, got: '${getResponse.toString()}'`);

      expect(
        Array.from((getResponse as CacheGet.Hit).valueUint8Array())
      ).toEqual(testValueCompressed);
    });
    it('should return the value if it is not compressed and DecompressionMode is enabled', async () => {
      const cacheClient = cacheClientWithDefaultCompressorFactory;
      const setResponse = await cacheClient.set(cacheName, 'my-key', testValue);
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `Expected CacheClient.set to be a success with CompressionMode specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.get(cacheName, 'my-key', {
        decompressionMode: DecompressionMode.Enabled,
      });
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `Expected CacheClient.get to be a hit after CacheClient.set with CompressionMode specified, got: '${getResponse.toString()}'`);

      expect((getResponse as CacheGet.Hit).valueString()).toEqual(testValue);
    });
  });
});
