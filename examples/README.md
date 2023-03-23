# Node.js Client SDK

_Read this in other languages_: [日本語](README.ja.md)

<br>

## Example Requirements

- Node version 14 or higher is required
- A Momento Auth Token is required, you can generate one using the [Momento CLI](https://github.com/momentohq/momento-cli)

To run any of the examples you will need to install the dependencies once first:

```bash
npm install
```

## Running the Basic Example

```bash
# Run example code
MOMENTO_AUTH_TOKEN=<YOUR AUTH TOKEN> npm run example
```

Example Code: [basic.ts](basic.ts)

## Running the Advanced Example

```bash
# Run example code
MOMENTO_AUTH_TOKEN=<YOUR AUTH TOKEN> npm run advanced
```

Example Code: [advanced.ts](advanced.ts)

## Running the Dictionary Example

This example demonstrates how to use the dictionary data type.

```bash
# Run example code
MOMENTO_AUTH_TOKEN=<YOUR AUTH TOKEN> npm run dictionary
```

Example Code: [dictionary.ts](dictionary.ts)

## Running the Pubsub Example

This example demonstrates how to subscribe to a topic and publish values to it.

In one terminal, subscribe to a topic on a cache:

```bash
MOMENTO_AUTH_TOKEN=<YOUR AUTH TOKEN> npm run topic-subscribe <cache-name> <topic-name>
```

Then in another terminal, publish a value to the topic:

```bash
MOMENTO_AUTH_TOKEN=<YOUR AUTH TOKEN> npm run topic-publish <cache-name> <topic-name> <value>
```

Note that you do not need to create the cache before running the examples; the examples take care of that. Also note the service creates a topic automatically.

As an example:

```bash
# in the first terminal
MOMENTO_AUTH_TOKEN=<YOUR AUTH TOKEN> npm run topic-subscribe my-cache dogs
# in another terminal
MOMENTO_AUTH_TOKEN=<YOUR AUTH TOKEN> npm run topic-publish my-cache dogs poodle
# "poodle" should soon appear on the first terminal
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

Notice the reduction in cumulative latency foe get/set requests after coalescing.

### Run the above example:
```bash
# Run example request coalescing
MOMENTO_AUTH_TOKEN=<YOUR AUTH TOKEN> npm run request-coalsecing
```

You can check out the example code in [request-coalescing.ts](request-coalescing.ts). The configurable
settings are at the bottom of the file.

If you have questions or need help experimenting further, please reach out to us!



