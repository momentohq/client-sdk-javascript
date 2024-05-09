# `zstd` Compression Extensions for Momento Node.js SDK

Compressing data before storing it in a cache can significantly reduce your data transfer costs if your cache values are large text values, such as JSON objects. This example shows how to enable compression via the `@gomomento/sdk-nodejs-compression-zstd` package, which provides extensions for the Momento Node.js SDK to support compression and decompression of data that is stored using the `CacheClient.set` function and accessed through the `CacheClient.get` function.

This `@gomomento/sdk-nodejs-compression-zstd` library an alternative to the main [`@gomomento/sdk-nodejs-compression`](https://github.com/momentohq/client-sdk-javascript/tree/main/packages/client-sdk-nodejs-compression) package, which provides similar extensions but uses the `gzip` compression library rather than `zstd`.  `zstd` may be slightly faster than `gzip` for certain types of workloads, but it is not yet supported in the node.js standard library, so this extension requires an additional binary dependency that may require extra steps to package into your production environment.


## Example Requirements

- Node version 16 or higher is required
- To get started with Momento you will need a Momento API key. You can get one from the [Momento Console](https://console.gomomento.com).

To run any of the examples you will need to install the dependencies once first:

```bash
npm install
```

## Running the Compression Example

This example demonstrates set and get from a cache, with `zstd` compression.

```bash
# Run example code
MOMENTO_API_KEY=<YOUR API KEY> npm run compression
```

Example Code: [compression.ts](compression.ts)


If you have questions or need help experimenting further, please reach out to us!



