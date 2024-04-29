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

  // This configuration will enable compression and automatically decompress any compressed values for
  // supported operations. If you don't want to automatically decompress, add
  // automaticDecompression: AutomaticDecompression.Disabled to the compression strategy.
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

  // This string is long and repetitive enough to be compressible.
  const compressibleValue = 'compress compress compress';

  // set value with compression
  const setResponse = await cacheClientWithDefaultCompressorFactory.set(cacheName, 'my-key', compressibleValue, {
    compress: true,
  });
  if (setResponse instanceof CacheSet.Success) {
    console.log('Key stored successfully with compression!');
  } else {
    console.log(`Error setting key: ${setResponse.toString()}`);
  }

  // get the value without decompressing
  const noDecompressResponse = await cacheClientWithDefaultCompressorFactory.get(cacheName, 'my-key', {
    decompress: false,
  });
  if (noDecompressResponse instanceof CacheGet.Hit) {
    console.log(`cache hit, compressed value: ${noDecompressResponse.valueString()}`);
  } else if (noDecompressResponse instanceof CacheGet.Miss) {
    console.log('cache miss');
  } else if (noDecompressResponse instanceof CacheGet.Error) {
    console.log(`Error: ${noDecompressResponse.message()}`);
  }

  // get decompressed value
  const getResponse = await cacheClientWithDefaultCompressorFactory.get(cacheName, 'my-key');
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
