{{ ossHeader }}

# Momento Node.js SDK - Basic Storage Client Load Generator Example

This directory contains example code illustrating how to generate load against Momento.

## Example Requirements

- Node version 16 or higher is required
- To get started with Momento you will need a Momento API key. You can get one from the [Momento Console](https://console.gomomento.com).

To run any of the examples you will need to install the dependencies once first:

```bash
npm install
```

## Running the load generator example

This project includes a very basic load generator to allow you to experiment with
performance in your environment based on different configurations. It's very
simplistic, and only intended to give you a quick way to explore the performance
of the Momento Storage client running on a single nodejs process.

Note that because nodejs javascript code runs on a single thread, the limiting
factor in request throughput will often be CPU. Keep an eye on your CPU
consumption while running the load generator, and if you reach 100%
of a CPU core then you most likely won't be able to improve throughput further
without running additional nodejs processes.

CPU will also impact your client-side latency; as you increase the number of
concurrent requests, if they are competing for CPU time then the observed
latency will increase.

Also, since performance will be impacted by network latency, you'll get the best
results if you run on a cloud VM in the same region as your Momento store.

Check out the configuration settings at the bottom of the 'load-gen.ts' to
see how different configurations impact performance.

If you have questions or need help experimenting further, please reach out to us!

To run the load generator:

```bash
# Run example load generator
MOMENTO_API_KEY=<YOUR API KEY> npm run load-gen
```

You can check out the example code in [load-gen.ts](load-gen.ts). The configurable
settings are at the bottom of the file.

If you have questions or need help experimenting further, please reach out to us!

{{ ossFooter }}
