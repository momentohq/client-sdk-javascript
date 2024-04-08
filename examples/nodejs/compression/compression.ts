import {
  CacheClient,
  CacheGet,
  CacheSet,
  CompressionLevel,
  Configurations,
  CreateCache,
  CredentialProvider,
} from '@gomomento/sdk';
import {CompressorFactory} from '@gomomento/sdk-nodejs-compression';

async function main() {
  const configuration = Configurations.Laptop.latest().withClientTimeoutMillis(90000);
  const configurationWithCompression = configuration.withCompressionStrategy({
    compressorFactory: CompressorFactory.default(),
    compressionLevel: CompressionLevel.SmallestSize,
  });

  const cacheClientWithDefaultCompressorFactory = new CacheClient({
    configuration: configurationWithCompression,
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
    defaultTtlSeconds: 60,
  });

  // create cache
  const cacheName = 'cache';
  const createResponse = await cacheClientWithDefaultCompressorFactory.createCache(cacheName);
  if (createResponse instanceof CreateCache.Success) {
    console.log('Cache created successfully!');
  } else {
    console.log(`Error creating cache: ${createResponse.toString()}`);
  }

  // set value with compression
  const setResponse = await cacheClientWithDefaultCompressorFactory.set(cacheName, 'my-key', 'my-value', {
    compress: true,
  });
  if (setResponse instanceof CacheSet.Success) {
    console.log('Key stored successfully with compression!');
  } else {
    console.log(`Error setting key: ${setResponse.toString()}`);
  }

  // get decompressed value
  const getResponse = await cacheClientWithDefaultCompressorFactory.get(cacheName, 'my-key', {
    decompress: true,
  });
  if (getResponse instanceof CacheGet.Hit) {
    console.log(`cache hit, decompressed value: ${getResponse.valueString()}`);
  } else if (getResponse instanceof CacheGet.Miss) {
    console.log('cache miss');
  } else if (getResponse instanceof CacheGet.Error) {
    console.log(`Error: ${getResponse.message()}`);
  }
}

main()
  .then(() => {
    console.log('success!!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
