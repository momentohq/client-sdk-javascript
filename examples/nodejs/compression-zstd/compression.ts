import {
  CacheClient,
  CacheGetResponse,
  CacheSetResponse,
  CompressionLevel,
  Configurations,
  CreateCacheResponse,
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
    defaultTtlSeconds: 60,
  });

  // create cache
  const cacheName = 'cache';
  const createResponse = await cacheClient.createCache(cacheName);
  switch (createResponse.type) {
    case CreateCacheResponse.AlreadyExists:
      console.log(`Cache already exists: ${cacheName}`);
      break;
    case CreateCacheResponse.Success:
      console.log('Cache created successfully!');
      break;
    case CreateCacheResponse.Error:
      console.log(`Error creating cache: ${createResponse.toString()}`);
      break;
  }

  // This string is long and repetitive enough to be compressible.
  const compressibleValue = 'compress compress compress';

  // set value with compression
  const setResponse = await cacheClient.set(cacheName, 'my-key', compressibleValue, {
    compress: true,
  });
  switch (setResponse.type) {
    case CacheSetResponse.Success:
      console.log('Key stored successfully with compression!');
      break;
    case CacheSetResponse.Error:
      console.log(`Error setting key: ${setResponse.toString()}`);
      break;
  }

  // get the value without decompressing
  const noDecompressResponse = await cacheClient.get(cacheName, 'my-key', {
    decompress: false,
  });
  switch (noDecompressResponse.type) {
    case CacheGetResponse.Miss:
      console.log('cache miss');
      break;
    case CacheGetResponse.Hit:
      console.log(`cache hit, compressed value: ${noDecompressResponse.valueString()}`);
      break;
    case CacheGetResponse.Error:
      console.log(`Error: ${noDecompressResponse.message()}`);
      break;
  }

  // get decompressed value
  const getResponse = await cacheClient.get(cacheName, 'my-key');
  switch (getResponse.type) {
    case CacheGetResponse.Miss:
      console.log('cache miss');
      break;
    case CacheGetResponse.Hit:
      console.log(`cache hit, decompressed value: ${getResponse.valueString()}`);
      break;
    case CacheGetResponse.Error:
      console.log(`Error: ${getResponse.message()}`);
      break;
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
