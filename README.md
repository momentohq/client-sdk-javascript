<head>
  <meta name="Momento Node.js Client Library Documentation" content="Node.js client software development kit for Momento Serverless Cache">
</head>
<img src="https://docs.momentohq.com/img/logo.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md) 

# Momento Node.js Client Library


Node.js client SDK for Momento Serverless Cache: a fast, simple, pay-as-you-go caching solution without
any of the operational overhead required by traditional caching solutions!



## Getting Started :running:

### Requirements

- Node version [14 or higher](https://nodejs.org/en/download/) is required
- A Momento Auth Token is required, you can generate one using the [Momento CLI](https://github.com/momentohq/momento-cli)

### Examples

Ready to dive right in? Just check out the [examples](./examples/README.md) directory for complete, working examples of
how to use the SDK.

### Installation

To create a new node.js TypeScript project and install the Momento client library as a dependency:

 ```bash
mkdir my-momento-nodejs-project
cd my-momento-nodejs-project
npm init --yes
npm install -D typescript
npx tsc --init
npm install @gomomento/sdk
````

Then create a `.ts` file and you can start adding code that uses the Momento client!  See the
next section for a basic code example.

### Usage

Checkout our [examples](./examples/README.md) directory for complete examples of how to use the SDK.

Here is a quickstart you can use in your own project:

```typescript
import {
  CacheGet,
  CreateCache,
  CacheSet,
  SimpleCacheClient,
  Configurations,
  CredentialProvider,
} from '@gomomento/sdk';

async function main() {
  const momento = new SimpleCacheClient({
    configuration: Configurations.Laptop.latest(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_AUTH_TOKEN',
    }),
    defaultTtlSeconds: 60,
  });

  const createCacheResponse = await momento.createCache('cache');
  if (createCacheResponse instanceof CreateCache.AlreadyExists) {
    console.log('cache already exists');
  } else if (createCacheResponse instanceof CreateCache.Error) {
    throw createCacheResponse.innerException();
  }

  console.log('Storing key=foo, value=FOO');
  const setResponse = await momento.set('cache', 'foo', 'FOO');
  if (setResponse instanceof CacheSet.Success) {
    console.log('Key stored successfully!');
  } else {
    console.log(`Error setting key: ${setResponse.toString()}`);
  }

  const getResponse = await momento.get('cache', 'foo');
  if (getResponse instanceof CacheGet.Hit) {
    console.log(`cache hit: ${String(getResponse.valueString())}`);
  } else if (getResponse instanceof CacheGet.Miss) {
    console.log('cache miss');
  } else if (getResponse instanceof CacheGet.Error) {
    console.log(`Error: ${getResponse.message()}`);
  }
}

main()
  .then(() => {
    console.log('success!!');
  })
  .catch((e: Error) => {
    console.error(`An error occurred! ${e.message}`);
    throw e;
  });

```

Momento also supports storing pure bytes,

```typescript
const key = new Uint8Array([109, 111, 109, 101, 110, 116, 111]);
const value = new Uint8Array([
  109, 111, 109, 101, 110, 116, 111, 32, 105, 115, 32, 97, 119, 101, 115, 111,
  109, 101, 33, 33, 33,
]);
const setResponse = await momento.set('cache', key, value, 50);
const getResponse = await momento.get('cache', key);
```

Handling cache misses,

```typescript
const getResponse = await cache.get('cache', 'non-existent key');
if (getResponse instanceof CacheGet.Miss) {
  console.log('cache miss');
}
```

And storing files.

```typescript
const buffer = fs.readFileSync('./file.txt');
const filebytes = Uint8Array.from(buffer);
const cacheKey = 'key';
const cacheName = 'my example cache';

// store file in cache
const setResponse = await momento.set(cacheName, cacheKey, filebytes);

// retrieve file from cache
const getResponse = await momento.get(cacheName, cacheKey);

// write file to disk
if (getResponse instanceof CacheGet.Hit) {
  fs.writeFileSync('./file-from-cache.txt', Buffer.from(getResponse.valueUint8Array()));
}
```

### Error Handling

Errors that occur in calls to `SimpleCacheClient` methods are surfaced to developers as part of the return values of
the calls, as opposed to by throwing exceptions. This makes them more visible, and allows your IDE to be more
helpful in ensuring that you've handled the ones you care about. (For more on our philosophy about this, see our
blog post on why [Exceptions are bugs](https://www.gomomento.com/blog/exceptions-are-bugs). And send us any
feedback you have!)

The preferred way of interpreting the return values from `SimpleCacheClient` methods is
using `instanceof` to match and handle the specific response type. Here's a quick example:

```typescript
const getResponse = await client.get(CACHE_NAME, KEY);
if (getResponse instanceof CacheGet.Hit) {
    console.log(`Looked up value: ${getResponse.valueString()}`);
} else {
    // you can handle other cases via pattern matching in "else if" blocks, or a default case
    // via an `else` block.  For each conditional, your IDE should be able to give you code
    // completion indicating the possible types; in this case, `CacheGet.Miss` and `CacheGet.Error`.
}
```

Using this approach, you get a type-safe response object in the case of a cache hit. But if the cache read
results in a Miss or an error, you'll also get a type-safe object that you can use to get more info about what happened.

In cases where you get an error response, it will always include an `ErrorCode` that you can use to check
the error type:

```typescript
const getResponse = await client.get(CACHE_NAME, KEY);
if (getResponse instanceof CacheGet.Error) {
    if (getResponse.errorCode() == MomentoErrorCode.TIMEOUT_ERROR) {
       // this would represent a client-side timeout, and you could fall back to your original data source
    }
}
```

Note that, outside of `SimpleCacheClient` responses, exceptions can occur and should be handled as usual. For example,
trying to instantiate a `SimpleCacheClient` with an invalid authentication token will result in an
`IllegalArgumentException` being thrown.

### Tuning

Momento client-libraries provide pre-built configuration bundles out-of-the-box. We want to do the hard work of
tuning for different environments for you, so that you can focus on the things that are unique to your business.
(We even have a blog series about it! [Shockingly simple: Cache clients that do the hard work for you](https://www.gomomento.com/blog/shockingly-simple-cache-clients-that-do-the-hard-work-for-you))

You can find the pre-built configurations in our `Configurations` namespace. Some of the pre-built configurations that
you might be interested in:

- `Configurations.Laptop` - this one is a development environment, just for poking around. It has relaxed timeouts
  and assumes that your network latencies might be a bit high.
- `Configurations.InRegion.Default` - provides defaults suitable for an environment where your client is running in the same region as the Momento
  service. It has more aggressive timeouts and retry behavior than the Laptop config.
- `Configurations.InRegion.LowLatency` - This config prioritizes keeping p99.9 latencies as low as possible, potentially sacrificing
  some throughput to achieve this. It will time out more quickly than the Default configuration; use this configuration if the most important
  factor is to ensure that cache unavailability doesn't force unacceptably high latencies for your own application and you want to fall
  back to application logic more quickly if the cache hasn't responded.

We hope that these configurations will meet the needs of most users, but if you find them lacking in any way, please
open a github issue, or contact us at `support@momentohq.com`. We would love to hear about your use case so that we
can fix or extend the pre-built configs to support it.

If you do need to customize your configuration beyond what our pre-builts provide, you can build your own `Configuration`
object.  See the examples in `configurations.ts` to see how they are constructed.

----------------------------------------------------------------------------------------
For more info, visit our website at [https://gomomento.com](https://gomomento.com)!
