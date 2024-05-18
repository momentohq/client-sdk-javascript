{{ ossHeader }}

# Momento Node.js SDK - `zstd` Compression Extensions Examples

Compressing data before storing it in a cache can significantly reduce your data transfer costs if your cache values are large text values, such as JSON objects. This example shows how to enable compression via the `@gomomento/sdk-nodejs-compression-zstd` package, which provides extensions for the Momento Node.js SDK to support compression and decompression of data that is stored using the `CacheClient.set` function and accessed through the `CacheClient.get` function.

This `@gomomento/sdk-nodejs-compression-zstd` library is an alternative to the main [`@gomomento/sdk-nodejs-compression`](https://github.com/momentohq/client-sdk-javascript/tree/main/packages/client-sdk-nodejs-compression) package, which provides similar extensions but uses the `gzip` compression library rather than `zstd`.  `zstd` may be slightly faster than `gzip` for certain types of workloads, but it is not yet supported in the node.js standard library, so this extension requires an additional binary dependency that may require extra steps to package into your production environment. If you do not need to squeeze out the extra bit of performance, we recommend using the default [`@gomomento/sdk-nodejs-compression`](https://github.com/momentohq/client-sdk-javascript/tree/main/packages/client-sdk-nodejs-compression) instead.

## Example Requirements

- Node version 16 or higher is required
- To get started with Momento you will need a Momento API key. You can get one from the [Momento Console](https://console.gomomento.com).

To run any of the examples you will need to install the dependencies once first:

```bash
npm install
```

## Running the `zstd` Compression Example

This example demonstrates set and get from a cache, with `zstd` compression.

```bash
# Run example code
MOMENTO_API_KEY=<YOUR API KEY> npm run compression
```

Example Code: [compression.ts](compression.ts)

## Packaging Notes

For an example that illustrates how to package the `zstd` binary dependency for a target platform that is not the same
as your build platform, see our [AWS Lambda Advanced Compression Example](../aws/lambda-examples/advanced-compression).
This example provides more detail on how to explicitly specify the correct dependency for your target architecture, and
how to ensure that you include the necessary files from the `npm` dependency tree.

If you have questions or need help experimenting further, please reach out to us!

{{ ossFooter }}
