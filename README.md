<img src="https://docs.momentohq.com/img/logo.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-alpha.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md) 

# Momento JavaScript Client Library


:warning: Alpha SDK :warning:

This is an official Momento SDK, but the API is in an alpha stage and may be subject to backward-incompatible
changes.  For more info, click on the alpha badge above.


JavaScript client SDK for Momento Serverless Cache: a fast, simple, pay-as-you-go caching solution without
any of the operational overhead required by traditional caching solutions!



## Getting Started :running:

### Requirements

- Node version [10.13 or higher](https://nodejs.org/en/download/) is required
- A Momento Auth Token is required, you can generate one using the [Momento CLI](https://github.com/momentohq/momento-cli)

### Installation

Use `npm` to install Momento:

```bash
npm install @gomomento/sdk
```

### Usage

Checkout our [examples](./examples/README.md) directory for complete examples of how to use the SDK.

Here is a quickstart you can use in your own project:

```typescript
import {
  AlreadyExistsError,
  CacheGetStatus,
  LogLevel,
  LogFormat,
  SimpleCacheClient,
} from '@gomomento/sdk';

const cacheName = 'cache';
const cacheKey = 'key';
const cacheValue = 'value';
const authToken = process.env.MOMENTO_AUTH_TOKEN;
if (!authToken) {
  throw new Error('Missing required environment variable MOMENTO_AUTH_TOKEN');
}

const defaultTtl = 60;
const momento = new SimpleCacheClient(authToken, defaultTtl, {
  loggerOptions: {
    level: LogLevel.INFO,
    format: LogFormat.JSON,
  },
});

const main = async () => {
  try {
    await momento.createCache(cacheName);
  } catch (e) {
    if (e instanceof AlreadyExistsError) {
      console.log('cache already exists');
    } else {
      throw e;
    }
  }

  console.log('Listing caches:');
  let token;
  do {
    const listResp = await momento.listCaches();
    listResp.getCaches().forEach(cacheInfo => {
      console.log(`${cacheInfo.getName()}`);
    });
    token = listResp.getNextToken();
  } while (token !== null);

  const exampleTtlSeconds = 10;
  console.log(
    `Storing key=${cacheKey}, value=${cacheValue}, ttl=${exampleTtlSeconds}`
  );
  await momento.set(cacheName, cacheKey, cacheValue, exampleTtlSeconds);
  const getResp = await momento.get(cacheName, cacheKey);

  if (getResp.status === CacheGetStatus.Hit) {
    console.log(`cache hit: ${String(getResp.text())}`);
  } else {
    console.log('cache miss');
  }
};

main()
  .then(() => {
    console.log('success!!');
  })
  .catch(e => {
    console.error('failed to get from cache', e);
  });

```

### Error Handling
TODO: Coming Soon

### Tuning
TODO: Coming Soon

----------------------------------------------------------------------------------------
For more info, visit our website at [https://gomomento.com](https://gomomento.com)!
