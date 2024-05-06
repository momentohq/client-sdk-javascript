{{ ossHeader }}

# `zstd` Compression Extensions for Momento Node.js SDK

This package provides extensions for the Momento Node.js SDK to support `zstd` compression and decompression of data that
is stored using the `CacheClient.set` function and accessed through the `CacheClient.get` function.

This is an alternative to the main `@gomomento/sdk-nodejs-compression` package, which provides similar extensions but uses the `gzip` compression library rather than `zstd`.  `zstd` may be slightly faster than `gzip` for certain types of workloads, but it is not yet supported in the node.js standard library, so this extension requires an additional binary dependency that may require extra steps to package into your production environment.

To use the library, you will need to install it from npm:

```bash
npm install @gomomento/sdk-compression-zstd
```

Then, you can configure the Momento cache client to enable compression:

```javascript
configuration.withCompressionStrategy({
  compressorFactory: CompressorFactory.zstd(),
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
