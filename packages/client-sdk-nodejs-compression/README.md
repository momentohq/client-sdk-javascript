<img src="https://docs.momentohq.com/img/momento-logo-forest.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)


# Compression Extensions for Momento Node.js SDK

This package provides extensions for the Momento Node.js SDK to support compression and decompression of data that
is stored using the `CacheClient.set` function and accessed through the `CacheClient.get` function. Using compression
can significantly reduce your data transfer costs if your cache values are large text values, such as JSON objects.

To use the library, you will need to install it from npm:

```bash
npm install @gomomento/sdk-compression
```

For more information, see:

* [Momento Developer Docs - Node JS SDK Compression](https://docs.momentohq.com/sdks/nodejs/compression.html)
* [NodeJS compression example](https://github.com/momentohq/client-sdk-javascript/tree/main/examples/nodejs/compression)

----------------------------------------------------------------------------------------
For more info, visit our website at [https://gomomento.com](https://gomomento.com)!
