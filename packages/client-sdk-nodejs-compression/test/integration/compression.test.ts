import {expectWithMessage, setupIntegrationTest} from './integration-setup';
import {
  CacheClient,
  CacheSet,
  CompressionMode,
  AutomaticDecompression,
  CacheGet,
} from '@gomomento/sdk';
import {CompressionExtensions} from '../../src';

const {cacheClientPropsWithConfig, cacheName} = setupIntegrationTest();

const cacheClientWithCompressionExtensionsLoadedAndAutomaticDecompressionEnabled =
  new CacheClient({
    configuration: cacheClientPropsWithConfig.configuration.withCompression({
      compressionExtensions: CompressionExtensions.load(),
      automaticDecompression: AutomaticDecompression.Enabled,
    }),
    credentialProvider: cacheClientPropsWithConfig.credentialProvider,
    defaultTtlSeconds: cacheClientPropsWithConfig.defaultTtlSeconds,
  });

const cacheClientWithCompressionExtensionsLoadedAndAutomaticDecompressionDisabled =
  new CacheClient({
    configuration: cacheClientPropsWithConfig.configuration.withCompression({
      compressionExtensions: CompressionExtensions.load(),
      automaticDecompression: AutomaticDecompression.Disabled,
    }),
    credentialProvider: cacheClientPropsWithConfig.credentialProvider,
    defaultTtlSeconds: cacheClientPropsWithConfig.defaultTtlSeconds,
  });

const cacheClientWithoutCompressionExtensionsLoaded = new CacheClient({
  configuration: cacheClientPropsWithConfig.configuration,
  credentialProvider: cacheClientPropsWithConfig.credentialProvider,
  defaultTtlSeconds: cacheClientPropsWithConfig.defaultTtlSeconds,
});

const testValue = 'my-value';
const testValueCompressed = [
  40, 181, 47, 253, 0, 88, 65, 0, 0, 109, 121, 45, 118, 97, 108, 117, 101,
];

describe('CompressionExtensions', () => {
  describe('CacheClient.set', () => {
    it('should return an error if CompressionMode is specified but compression is not enabled', async () => {
      const cacheClient = cacheClientWithoutCompressionExtensionsLoaded;
      const setResponse = await cacheClient.set(
        cacheName,
        'my-key',
        testValue,
        {
          compression: CompressionMode.Default,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Error);
        expect((setResponse as CacheSet.Error).toString()).toEqual(
          'Invalid argument passed to Momento client: Compression extension is not loaded, but `CacheClient.set` was called with the `compression` option; please install @gomomento/sdk-nodejs-compression and call `Configuration.withCompression` to enable compression.'
        );
      }, `Expected CacheClient.set to return an error if a CompressionMode is specified without compression extensions loaded, but got: ${setResponse.toString()}`);
    });
    it('should compress the value if CompressionMode is specified', async () => {
      const cacheClient =
        cacheClientWithCompressionExtensionsLoadedAndAutomaticDecompressionDisabled;
      const setResponse = await cacheClient.set(
        cacheName,
        'my-key',
        testValue,
        {
          compression: CompressionMode.Default,
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
    it('should not compress the value if CompressionMode is not specified', async () => {
      const cacheClient =
        cacheClientWithCompressionExtensionsLoadedAndAutomaticDecompressionDisabled;
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
    it('should return an error if CompressionMode is specified but compression is not enabled', async () => {
      const cacheClient = cacheClientWithoutCompressionExtensionsLoaded;
      const setResponse = await cacheClient.set(
        cacheName,
        'my-key',
        testValue,
        {
          compression: CompressionMode.Default,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Error);
        expect((setResponse as CacheSet.Error).toString()).toEqual(
          'Invalid argument passed to Momento client: Compression extension is not loaded, but `CacheClient.set` was called with the `compression` option; please install @gomomento/sdk-nodejs-compression and call `Configuration.withCompression` to enable compression.'
        );
      }, `Expected CacheClient.set to be an Error with compression disabled and CompressionMode specified, got: '${setResponse.toString()}'`);
    });
  });
  describe('CacheClient.get', () => {
    it('should decompress the value if AutomaticDecompression is enabled', async () => {
      const cacheClient =
        cacheClientWithCompressionExtensionsLoadedAndAutomaticDecompressionEnabled;
      const setResponse = await cacheClient.set(
        cacheName,
        'my-key',
        testValue,
        {
          compression: CompressionMode.Default,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `Expected CacheClient.set to be a success with CompressionMode specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.get(cacheName, 'my-key');
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `Expected CacheClient.get to be a hit after CacheClient.set with CompressionMode specified, got: '${getResponse.toString()}'`);

      expect((getResponse as CacheGet.Hit).valueString()).toEqual(testValue);
    });
    it('should not decompress the value if AutomaticDecompression is disabled', async () => {
      const cacheClient =
        cacheClientWithCompressionExtensionsLoadedAndAutomaticDecompressionDisabled;
      const setResponse = await cacheClient.set(
        cacheName,
        'my-key',
        testValue,
        {
          compression: CompressionMode.Default,
        }
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `Expected CacheClient.set to be a success with CompressionMode specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.get(cacheName, 'my-key');
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `Expected CacheClient.get to be a hit after CacheClient.set with CompressionMode specified, got: '${getResponse.toString()}'`);

      expect(
        Array.from((getResponse as CacheGet.Hit).valueUint8Array())
      ).toEqual(testValueCompressed);
    });
    it('should return the value if it is not compressed and AutomaticDecompression is enabled', async () => {
      const cacheClient =
        cacheClientWithCompressionExtensionsLoadedAndAutomaticDecompressionEnabled;
      const setResponse = await cacheClient.set(cacheName, 'my-key', testValue);
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `Expected CacheClient.set to be a success with CompressionMode specified, got: '${setResponse.toString()}'`);

      const getResponse = await cacheClient.get(cacheName, 'my-key');
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `Expected CacheClient.get to be a hit after CacheClient.set with CompressionMode specified, got: '${getResponse.toString()}'`);

      expect((getResponse as CacheGet.Hit).valueString()).toEqual(testValue);
    });
  });
});
