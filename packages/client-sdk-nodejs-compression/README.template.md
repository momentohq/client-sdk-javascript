{{ ossHeader }}

# Compression Extensions for Momento Node.js SDK

This package provides extensions for the Momento Node.js SDK to support compression and decompression of data that
is stored using the `CacheClient.set` function and accessed through the `CacheClient.get` function.

To use the library, you will need to install it from npm:

```bash
npm install @gomomento/sdk-compression
```

Then, you can configure the Momento cache client to enable compression:

```javascript
configuration.withCompressionStrategy({
  compressorFactory: CompressorFactory.default(),
  compressionLevel: CompressionLevel.SmallestSize,
})

```

To compress a value when calling `CacheClient.set`, use the `compress` option:

```javascript
const setResponse = await cacheClient.set(
  'my-cache',
  'my-key',
  'my-value',
  {
    compress: true,
  }
);

```

To decompress a value when calling `CacheClient.get`, use the `decompress` option:

```javascript
const getResponse = await cacheClient.get(
  'my-cache',
  'my-key',
  {
    decompress: true,
  }
);
```

{{ ossFooter }}
