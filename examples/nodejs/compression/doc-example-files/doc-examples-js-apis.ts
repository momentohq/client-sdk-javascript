/**
 *
 * This file contains examples of consuming the JavaScript APIs, for use as examples
 * in the public dev docs.  Each function name that begins with `example_` is available
 * to the dev docs to inject into the code snippets widget for the specified API.
 *
 * These examples should all be JavaScript; we can add TypeScript-specific examples in
 * a second file in the future if desired.
 *
 */
import {
  AutomaticDecompression,
  CacheClient,
  CacheGetResponse,
  CacheSetResponse,
  CompressionLevel,
  Configurations,
  CredentialProvider,
} from '@gomomento/sdk';
import {CompressorFactory} from '@gomomento/sdk-nodejs-compression';
import * as crypto from 'node:crypto';

function example_API_ConfigurationWithCompression() {
  Configurations.InRegion.Default.latest().withCompressionStrategy({
    compressorFactory: CompressorFactory.default(),
    compressionLevel: CompressionLevel.Balanced,
  });
}

function example_API_ConfigurationWithCompressionNoAutomatic() {
  Configurations.InRegion.Default.latest().withCompressionStrategy({
    compressorFactory: CompressorFactory.default(),
    compressionLevel: CompressionLevel.Balanced,
    automaticDecompression: AutomaticDecompression.Disabled,
  });
}

async function example_API_SetWithCompression(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.set(cacheName, 'test-key', 'test-value', {compress: true});
  switch (result.type) {
    case CacheSetResponse.Success:
      console.log("Key 'test-key' stored successfully");
      break;
    case CacheSetResponse.Error:
      throw new Error(
        `An error occurred while attempting to store key 'test-key' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_GetExplicitDecompress(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.get(cacheName, 'test-key', {decompress: true});
  switch (result.type) {
    case CacheGetResponse.Miss:
      console.log(`Key 'test-key' was not found in cache '${cacheName}'`);
      break;
    case CacheGetResponse.Hit:
      console.log(`Retrieved value for key 'test-key': ${result.valueString()}`);
      break;
    case CacheGetResponse.Error:
      throw new Error(
        `An error occurred while attempting to get key 'test-key' from cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function main() {
  example_API_ConfigurationWithCompression();
  example_API_ConfigurationWithCompressionNoAutomatic();

  const cacheClientWithCompression = await CacheClient.create({
    configuration: Configurations.InRegion.Default.latest().withCompressionStrategy({
      compressorFactory: CompressorFactory.default(),
      compressionLevel: CompressionLevel.Balanced,
    }),
    credentialProvider: CredentialProvider.fromEnvVarV2(),
    defaultTtlSeconds: 60,
  });

  const cacheName = `js-sdk-doc-examples-cache-${crypto.randomBytes(8).toString('hex')}`;

  try {
    await example_API_SetWithCompression(cacheClientWithCompression, cacheName);
    await example_API_GetExplicitDecompress(cacheClientWithCompression, cacheName);
  } finally {
    await cacheClientWithCompression.deleteCache(cacheName);
    cacheClientWithCompression.close();
  }
}

main().catch(e => {
  throw e;
});
