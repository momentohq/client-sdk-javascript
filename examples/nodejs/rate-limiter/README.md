<head>
  <meta name="Momento Node.js Client Library Documentation" content="Node.js client software development kit for Momento Cache">
</head>
<img src="https://docs.momentohq.com/img/logo.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)

## Rate-limiter Requirements

- Node version 14 or higher is required
- To get started with Momento you will need a Momento API key. You can get one from the [Momento Console](https://console.gomomento.com).

To run any of the examples you will need to install the dependencies once first:

```bash
npm install
```

## Running the rate-limiter

```bash
MOMENTO_API_KEY="yourApiKey" npm run rate-limiter
```

You'll see a sample output that contains statistics about two different rate-limiters (more on this soon!):

```bash

Simulating 1000 requests for each rate limiter with a random delay between requests upto a max of 60000 milliseconds.

Increment Rate Limiter - Successes: 1000
Increment Rate Limiter - Throttles: 0
Increment Rate Limiter - Errors: 0
Increment Rate Limiter - Average Latency: 2.427
Increment Rate Limiter - p50 Latency: 2
Increment Rate Limiter - p90 Latency: 3
Increment Rate Limiter - p99 Latency: 5
Increment Rate Limiter - p99.9 Latency: 34
GetIncrement Rate Limiter - Successes: 1000
GetIncrement Rate Limiter - Throttles: 0
GetIncrement Rate Limiter - Errors: 0
GetIncrement Rate Limiter - Average Latency: 4.415
GetIncrement Rate Limiter - p50 Latency: 4
GetIncrement Rate Limiter - p90 Latency: 5
GetIncrement Rate Limiter - p99 Latency: 7
GetIncrement Rate Limiter - p99.9 Latency: 46
All tasks complete!

```
## Behind the scenes
