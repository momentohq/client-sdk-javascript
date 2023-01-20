# JavaScript Client SDK

_Read this in other languages_: [日本語](README.ja.md)

<br>

## Running the Example

- Node version 16 or higher is required
- A Momento Auth Token is required, you can generate one using the [Momento CLI](https://github.com/momentohq/momento-cli)

```bash
npm install

# Run example code
MOMENTO_AUTH_TOKEN=<YOUR AUTH TOKEN> npm run example
```

Example Code: [index.ts](index.ts)

## Running the Presigned URL Example

This example demonstrates how to use the `MomentoSigner` class, which enables creation of user-signed access tokens and presigned urls which can be used for doing cache get/set actions via HTTP.

- Node version 16 or higher is required
- A Momento Auth Token is required, you can generate one using the [Momento CLI](https://github.com/momentohq/momento-cli)

```bash
npm install

# Run example code
MOMENTO_AUTH_TOKEN=<YOUR AUTH TOKEN> npm run presigned-url-example
```

Example Code: [presigned-url-example.ts](presigned-url-example.ts)

## Using the SDK in your projects

### Installation

```bash
npm install @gomomento/sdk
```

## Running the load generator example

This repo includes a very basic load generator, to allow you to experiment with
performance in your environment based on different configurations. It's very
simplistic, and only intended to give you a quick way to explore the performance
of the Momento client running on a single nodejs process.

Note that because nodejs javascript code runs on a single thread, the limiting
factor in request throughput will often be CPU. Keep an eye on your CPU
consumption while running the load generator, and if you reach 100%
of a CPU core then you most likely won't be able to improve throughput further
without running additional nodejs processes.

CPU will also impact your client-side latency; as you increase the number of
concurrent requests, if they are competing for CPU time then the observed
latency will increase.

Also, since performance will be impacted by network latency, you'll get the best
results if you run on a cloud VM in the same region as your Momento cache.

Check out the configuration settings at the bottom of the 'load-gen.ts' to
see how different configurations impact performance.

If you have questions or need help experimenting further, please reach out to us!

To run the load generator:

```bash
# Run example load generator
MOMENTO_AUTH_TOKEN=<YOUR AUTH TOKEN> npm run load-gen
```

You can check out the example code in [load-gen.ts](load-gen.ts). The configurable
settings are at the bottom of the file.
