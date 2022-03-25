# Momento client-sdk-javascript

:warning: Experimental SDK :warning:

JavaScript SDK for Momento is experimental and under active development.
There could be non-backward compatible changes or removal in the future.
Please be aware that you may need to update your source code with the current version of the SDK when its version gets upgraded.

---

<br/>

JavaScript SDK for Momento, a serverless cache that automatically scales without any of the operational overhead required by traditional caching solutions.

<br/>

## Getting Started :running:

### Requirements

- Node version [10.13 or higher](https://nodejs.org/en/download/) is required
- A Momento Auth Token is required, you can generate one using the [Momento CLI](https://github.com/momentohq/momento-cli)

<br/>

### Installing Momento and Running the Example

Check out our [JavaScript SDK example repo](https://github.com/momentohq/client-sdk-examples/tree/main/javascript)!

<br/>

### Using Momento

```typescript
import {SimpleCacheClient, CacheGetStatus} from '@gomomento/sdk';

// your authentication token for momento
const authToken = process.env.MOMENTO_AUTH_TOKEN;

// initializing momento
const DEFAULT_TTL = 60; // 60 seconds for default ttl
const momento = new SimpleCacheClient(authToken, DEFAULT_TTL);

// creating a cache named "myCache"
const CACHE_NAME = 'myCache';
await momento.createCache(CACHE_NAME);

// sets key with default ttl
await momento.set(CACHE_NAME, 'key', 'value');
const res = await momento.get(CACHE_NAME, 'key');
console.log('result: ', res.text());

// sets key with ttl of 5 seconds
await momento.set(CACHE_NAME, 'key2', 'value2', 5);

// permanently deletes cache
await momento.deleteCache(CACHE_NAME);
```

<br/>

## Running Tests :zap:

Integration tests require an auth token for testing. Set the env var `TEST_AUTH_TOKEN` to
provide it.

```
export TEST_AUTH_TOKEN=<YOUR_AUTH_TOKEN>
npm run integration
```
