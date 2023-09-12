<head>
  <meta name="Momento Node.js Client Library Documentation" content="Node.js client software development kit for Momento Cache">
</head>
<img src="https://docs.momentohq.com/img/logo.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)

# Node.js Client SDK

_Read this in other languages_: [日本語](README.ja.md)

<br>

This directory contains example code illustrating how to generate load against Momento.
It also includes an example that shows how request coalescing can reduce latencies and
improve throughput for workloads that it is suitable for.

## Example Requirements

- Node version 14 or higher is required
- To get started with Momento you will need a Momento API key. You can get one from the [Momento Console](https://console.gomomento.com).

To run any of the examples you will need to install the dependencies once first:

```bash
npm install
```

## Running the load generator example

This project includes a very basic load generator, to allow you to experiment with
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
MOMENTO_API_KEY=<YOUR API KEY> npm run load-gen
```

You can check out the example code in [load-gen.ts](load-gen.ts). The configurable
settings are at the bottom of the file.

## Running the request-coalescing example

If your application has traffic patterns that result in a high number of concurrent requests to Momento,
it is possible that the nodejs event loop can become overwhelmed and cause the observed client-side
latencies to rise drastically.  Sometimes this results in client-side timeouts even when the
server-side latencies are very low.

If your application may have a lot of duplicate requests, one solution is to de-duplicate
the requests (aka request coalescing).  With a tiny bit of code it's pretty easy to ensure
that only one copy of each duplicate request actually goes out onto the network.
This can reduce the amount of work that ends up in the node.js event loop, and dramatically
improve the performance of your application.

This repo includes a request-coalescer, to allow you to experiment
with performance in your environment based on different configurations.

The request-coalescing example shows difference between latencies when
a basic load-generator is used v/s when request-coalescer is used.

Check out the configuration settings at the bottom of the 'request-coalescing.ts' to
see how different configurations impact performance.

**Here are some stats and steps on how to run the example:**

Change the configuration found at the end of the file to
`maxRequestsPerSecond = 1000` and `numberOfConcurrentRequests = 1000`
to achieve the stats shown below:

Stats should like:

|     Request type, Metric     | Before Coalescing | After Coalescing |
|:----------------------------:|:-----------------:|:----------------:|
|           set, p50           |        60         |        20        |
|           set, p99           |        445        |        37        |
|           get, p50           |        40         |        20        |
|           get, p99           |        140        |        32        |
| set, % of requests coalesced |         -         |      49.5%       |
| get, % of requests coalesced |         -         |      49.5%       |

It's only about 50 lines of code to create a coalescing wrapper for the Momento cache client.  You can see our
implementation here:
https://github.com/momentohq/client-sdk-nodejs/blob/main/examples/utils/momento-client-with-coalescing.ts

### Run the above example:
```bash
# Run example request coalescing
MOMENTO_API_KEY=<YOUR API KEY> npm run request-coalsecing
```

You can check out the example code in [request-coalescing.ts](request-coalescing.ts). The configurable
settings are at the bottom of the file.

If you have questions or need help experimenting further, please reach out to us!



