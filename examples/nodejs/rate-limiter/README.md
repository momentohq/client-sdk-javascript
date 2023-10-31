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
npm install
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

## Key Mechanism

At the heart of our rate-limiter is a key mechanism that allows us to perform rate limiting based on user-per-minute granularity. The key is constructed using a combination of the user ID and the current minute. This key plays a pivotal role in tracking and limiting the number of transactions a user can make in a given minute.

## Approaches

We have demonstrated two approaches to implement a TPM (transactions per minute) rate-limiter using Momento. We strongly recommend using the `IncrementRateLimiter` implementation, which outperforms and provides higher accuracy than the alternative approach.

1. [RECOMMENDED] Using Momento `increment` and `updateTTL` APIs

   - Increment the key (user-id_current-minute).
   - If the value returns 1, set a 1-minute TTL (for the first request of any minute called by a user).
   - Allow the request if the value is below the limit; throttle if it reaches the limit.

2. Using Momento `get` and `increment` APIs (similar to the one recommended by [Redis](https://redis.com/glossary/rate-limiting/)):

  - Retrieve the key (user-id_current-minute).
  - If the key doesn't exist, create it with value 1 and a 1-minute TTL.
  - If the key exists and the value is below the limit, allow the request and increment the key without changing the TTL.
  - If the value reaches the limit, throttle.


## Observations and Analysis

Our simulations indicate the first approach outperforms the second in terms of latency, with average and p99 latencies being significantly lower. Additionally, it is more accurate, especially under high contention due to the first approach mitigating the issue with a classic [read-modify-write operation](https://en.wikipedia.org/wiki/Read%E2%80%93modify%E2%80%93write).

For example, in a simulation with 10 concurrent API calls, 5 users, and a rate limiter set to 1 TPM per user, the recommended approach yielded 1 success and 1 throttle per user, while the second approach inaccurately allowed all requests.

    ```
    Simulating 10 requests for each rate limiter with a random delay between requests upto a max of 0 milliseconds.
    The simulation uses 5 users and evenly divides requests for each user.

    Increment Rate Limiter - Successes: 5
    Increment Rate Limiter - Throttles: 5
    Increment Rate Limiter - Errors: 0
    Increment Rate Limiter - Average Latency: 92.200
    Increment Rate Limiter - p50 Latency: 89
    Increment Rate Limiter - p90 Latency: 127
    Increment Rate Limiter - p99 Latency: 127
    Increment Rate Limiter - p99.9 Latency: 127

    GetIncrement Rate Limiter - Successes: 10
    GetIncrement Rate Limiter - Throttles: 0
    GetIncrement Rate Limiter - Errors: 0
    GetIncrement Rate Limiter - Average Latency: 81.800
    GetIncrement Rate Limiter - p50 Latency: 82
    GetIncrement Rate Limiter - p90 Latency: 88
    GetIncrement Rate Limiter - p99 Latency: 88
    GetIncrement Rate Limiter - p99.9 Latency: 88
    ```

    With the second approach, you can see that all the requests were granted and wasn't accurate like the first one,
    even though the first one paid a little extra penalty on the latency.

The second approach, although slightly better in latency under certain conditions, is prone to inaccuracies, which could be a trade-off depending on the application's requirements.
