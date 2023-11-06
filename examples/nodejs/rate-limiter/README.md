<head>
  <meta name="Momento Node.js Client Library Documentation" content="Node.js client software development kit for Momento Cache">
</head>
<img src="https://docs.momentohq.com/img/logo.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)

## Why rate-limiters?

The need for rate-limiting stems from the fundamental requirement to maintain the health and quality of any service. Without it, resources could easily become overwhelmed, leading to service degradation or outright failure. This is particularly important in distributed systems and web services where the client requests can vary dramatically in volume and frequency. Rate-limiting ensures a fair distribution of resources, prevents abuse, and can even be a crucial component in defending against certain types of cyber-attacks, such as Distributed Denial of Service (DDoS) attacks.

Some common use-cases of rate-limiting includes:

- API Management: In a platform offering various APIs, rate-limiting is crucial to prevent a single user or service from monopolizing the bandwidth, ensuring that all users have equitable access to the resources.

- E-commerce Websites: During high-traffic events like Black Friday sales, rate-limiting can prevent the website from crashing by controlling the influx of user requests, thus providing a stable and fair shopping experience to all customers.

- Online Gaming Servers: Rate-limiting can help in mitigating cheating by throttling the number of actions a player can perform in a given time, ensuring a level playing field and maintaining the game's integrity.

## Getting started

We provide a `MomentoRateLimiter` class that uses Momento's `increment` and `updateTTL` [APIs](https://docs.momentohq.com/cache/develop/api-reference) to achieve rate-limiting.
Incorporating the `MomentoRateLimiter` class into your application is a straightforward process. Begin by setting up a Momento cache client, then link it to the rate-limiter, specifying the user-specific limits. This rate-limiter operates with minute-level precision, meaning that the defined limits will be enforced on a per-minute basis for each user or entity.

To get started with the rate-limiter:
- You will need a Momento API key. You can obtain one from the [Momento Console](https://console.gomomento.com).
- You will need to create a cache called `rate-limiter` from the console as well! You can choose a different cache name and pass it to the rate-limiter constructor if you'd like.

Once you have the key and the cache created, you can begin integration! Remember to store your API key in an environment variable named `MOMENTO_API_KEY`.

```typescript
const momento = await CacheClient.create({
  configuration: Configurations.Laptop.v1(),
  credentialProvider: CredentialProvider.fromEnvironmentVariable({
    environmentVariableName: "MOMENTO_API_KEY",
  }),
  defaultTtlSeconds: 6000,
});

const tpmLimit = 10;
const cacheName = "rate-limiter";
const rateLimiter = new MomentoRateLimiter(momento, tpmLimit, cacheName);

// test rate limiter
const limitExceeded : boolean = await rateLimiter.isLimitExceeded(`id`);
```

## Key Mechanism

At the heart of our rate-limiter is a key mechanism that allows us to perform rate limiting based on user-per-minute granularity. The key is constructed using a combination of the user ID and the current minute. This key plays a pivotal role in tracking and limiting the number of transactions a user can make in a given minute.

```typescript
generateMinuteKey(baseKey: string): string {
    const currentDate = new Date();
    const currentMinute = currentDate.getMinutes();
    return `${baseKey}_${currentMinute}`;
  }
```

## Running the example

To run the example, you'll need:

- Node version 14 or higher
- A Momento API key, which you can obtain from the [Momento Console](https://console.gomomento.com).

```bash
npm install
MOMENTO_API_KEY="yourApiKey" npm run rate-limiter
```

You'll see a sample output that contains statistics about the rate-limiter.

```bash

Simulating 1000 requests for each rate limiter with a random delay between requests upto a max of 60000 milliseconds.

Momento Rate Limiter - Successes: 1000
Momento Rate Limiter - Throttles: 0
Momento Rate Limiter - Errors: 0
Momento Rate Limiter - Average Latency: 2.427
Momento Rate Limiter - p50 Latency: 2
Momento Rate Limiter - p90 Latency: 3
Momento Rate Limiter - p99 Latency: 5
Momento Rate Limiter - p99.9 Latency: 34

All tasks complete!

```

There are three additional arguments that you can provide to the simulator if you want to experiment with the rate-limiter:

- totalRequests: The total number of requests that the example will simulate, defaulted to 1000.
- randomDelayUpperBound: The simulation adds a random delay between 0 and the randomDelayUpperBound, defaulted to 60 seconds.
- tpmLimit: The rate per minute at which a user or entity will be allowed by the rate-limiter, defaulted to 500.

To override totalRequests to 10, randomDelayUpperBound to 60, and tpmLimit to 1, the command will look like:

```bash
MOMENTO_API_KEY="yourApiKey" npm run rate-limiter -- 10 60 1
```

The displayed output above indicates a 100% success rate. To observe throttles, modify the configuration as below, which results in approximately half of the requests being throttled. The rate limit is set to 10 requests per user, and we distribute 20 requests among 5 users (totaling 100 requests), introducing a random delay ranging from 0 to 500 milliseconds between each request.

```bash
MOMENTO_API_KEY="yourApiKey" npm run rate-limiter -- 100 500 10
```

## Analysis

Read our [blog post](https://www.gomomento.com/blog/did-you-say-you-want-a-distributed-rate-limiter) for an analysis of the rate-limiter against other approaches!

## Conclusion

In conclusion, Momento's Node.js Client Library empowers developers to implement efficient rate-limiting with ease, ensuring service stability and equitable resource distribution. It exemplifies how modern solutions can elegantly address classical challenges in distributed systems.
