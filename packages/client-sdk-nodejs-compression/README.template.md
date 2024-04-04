{{ ossHeader }}

# Compression Extensions for Momento Node.js SDK

This package provides extensions for the Momento Node.js SDK to support compression and decompression of data that
is stored using the `CacheClient.set` function and accessed through the `CacheClient.get` function.

To use the library, you will need to install it from npm:

```bash
npm install @gomomento/sdk-compression
```

Then, you can configure the Momento cache client to enable compression and automatic decompression:

```javascript
{% include "./examples/nodejs/compression/configuration.ts" %}
```

To compress a value when calling `CacheClient.set`, use the `compression` option:

```javascript
{% include "./examples/nodejs/compression/set.ts" %}
```

{{ ossFooter }}
