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

This repo includes a request-coalescer, to allow you to experiment
with performance in your environment based on different configurations.

The request-coalescing example shows difference between latencies when
a basic load-generator is used v/s when request-coalescer is used.

Check out the configuration settings at the bottom of the 'request-coalescing.ts' to
see how different configurations impact performance.

Here are some stats and steps on how to run the example:
Change the configuration found at the end of the file as follows to achieve the stats shown below:

| Configuration Name         | Value |
|----------------------------|-------|
| maxRequestsPerSecond       | 1000  |
| numberOfConcurrentRequests | 1000  |

Stats should like:
- Before Request-Coalescing:

```javascript
[2023-03-16T22:01:01.787Z] INFO (Momento: request-coalescer-load-gen):
cumulative stats:
  total requests: 60000 (997 tps, limited to 1000 tps)
success: 60000 (100%) (997 tps)
unavailable: 0 (0%)
deadline exceeded: 0 (0%)
resource exhausted: 0 (0%)
rst stream: 0 (0%)

cumulative set latencies:

  count: 30000
min: 18
p50: 60
p90: 161
p99: 445
p99.9: 544
max: 561.454333


cumulative get latencies:

  count: 30000
min: 18
p50: 40
p90: 95
p99: 140
p99.9: 385
max: 394.540167
```

- After Request-Coalescing:

```javascript
[2023-03-16T22:02:02.338Z] INFO (Momento: request-coalescer-load-gen):
cumulative stats:
total requests: 60000 (999 tps, limited to 1000 tps)
       success: 60000 (100%) (999 tps)
   unavailable: 0 (0%)
deadline exceeded: 0 (0%)
resource exhausted: 0 (0%)
    rst stream: 0 (0%)

cumulative set latencies:

  count: 30000
    min: 8
    p50: 20
    p90: 26
    p99: 37
  p99.9: 40
    max: 44.164916


cumulative get latencies:

  count: 30000
    min: 8
    p50: 20
    p90: 26
    p99: 32
  p99.9: 36
    max: 39.292083


[2023-03-16T22:02:02.338Z] INFO (Momento: request-coalescer-load-gen):
For request coalescer:
Number of set requests coalesced:
29700 (49.5%)

Number of get requests coalesced:
29700 (49.5%)
```
Notice the reduction in cumulative latency foe get/set requests after coalescing.

### Run the above example:
```bash
# Run example load generator
MOMENTO_AUTH_TOKEN=<YOUR AUTH TOKEN> npm run load-gen
```

### More stats with different configurations:
You can find more stats with different configurations
[here](https://momentohq.notion.site/Request-Coalescing-Stats-7c4efeeab9d448538647712e3d7e1dff)
