<img src="https://docs.momentohq.com/img/momento-logo-forest.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)


# Momento Node.js SDK - Compression Extensions Examples

Compressing data before storing it in a cache can significantly reduce your data transfer costs if your cache values are large text values, such as JSON objects. This example shows how to enable compression via the `@gomomento/sdk-nodejs-compression` package, which provides extensions for the Momento Node.js SDK to support compression and decompression of data that is stored using the `CacheClient.set` function and accessed through the `CacheClient.get` function.

## Example Requirements

- Node version 16 or higher is required
- To get started with Momento you will need a Momento API key. You can get one from the [Momento Console](https://console.gomomento.com).

To run any of the examples you will need to install the dependencies once first:

```bash
npm install
```

## Running the Compression Example

This example demonstrates set and get with compression from a cache.

```bash
# Run example code
MOMENTO_API_KEY=<YOUR API KEY> npm run compression
```

Example Code: [compression.ts](compression.ts)

If you have questions or need help experimenting further, please reach out to us!

----------------------------------------------------------------------------------------
For more info, visit our website at [https://gomomento.com](https://gomomento.com)!
