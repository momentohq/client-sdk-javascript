import {
  CacheClient,
  CacheGet,
  CacheSet,
  CompressionLevel,
  Configurations,
  CreateCache,
  CredentialProvider,
} from '@gomomento/sdk';
import {CompressorFactory} from '@gomomento/sdk-nodejs-compression-zstd';

async function main() {
  const configuration = Configurations.Laptop.latest().withClientTimeoutMillis(90000).withCompressionStrategy(
    // This configuration will enable compression and automatically decompress any compressed values for
    // supported operations. If you don't want to automatically decompress, add
    // automaticDecompression: AutomaticDecompression.Disabled to the compression strategy.
    {
      compressorFactory: CompressorFactory.zstd(),
      compressionLevel: CompressionLevel.Balanced,
    }
  );

  const cacheClient = new CacheClient({
    configuration: configuration,
    credentialProvider: CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY'),
    defaultTtlSeconds: 60,
  });

  // create cache
  const cacheName = 'cache';
  const createResponse = await cacheClient.createCache(cacheName);
  if (createResponse instanceof CreateCache.Success) {
    console.log('Cache created successfully!');
  } else {
    console.log(`Error creating cache: ${createResponse.toString()}`);
  }

  // This string is long and repetitive enough to be compressible.
  const compressibleValue = 'compress compress compress';

  // set value with compression
  const setResponse = await cacheClient.set(cacheName, 'my-key', compressibleValue, {
    compress: true,
  });
  if (setResponse instanceof CacheSet.Success) {
    console.log('Key stored successfully with compression!');
  } else {
    console.log(`Error setting key: ${setResponse.toString()}`);
  }

  // get the value without decompressing
  const noDecompressResponse = await cacheClient.get(cacheName, 'my-key', {
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
  const getResponse = await cacheClient.get(cacheName, 'my-key');
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
