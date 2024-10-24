<head>
  <meta name="Momento Client Library Documentation for Node.js" content="Momento client software development kit for Node.js">
</head>
<img src="https://docs.momentohq.com/img/momento-logo-forest.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)

# Momento Client Library for Node.js

Momento Cache is a fast, simple, pay-as-you-go caching solution without any of the operational overhead
required by traditional caching solutions.  This repo contains the source code for the Momento client library for Node.js.

To get started with Momento you will need a Momento Auth Token. You can get one from the [Momento Console](https://console.gomomento.com).

* Website: [https://www.gomomento.com/](https://www.gomomento.com/)
* Momento Documentation: [https://docs.momentohq.com/](https://docs.momentohq.com/)
* Getting Started: [https://docs.momentohq.com/getting-started](https://docs.momentohq.com/getting-started)
* Momento SDK Documentation for Node.js: [https://docs.momentohq.com/sdks/nodejs](https://docs.momentohq.com/sdks/nodejs)
* Discuss: [Momento Discord](https://discord.gg/3HkAKjUZGq)

## Packages

The node.js SDK is available on npmjs: [`@gomomento/sdk`](https://www.npmjs.com/package/@gomomento/sdk).

The node.js SDK is the best choice for server-side JavaScript applications or environments where performance considerations
are key.  If you are writing a browser application or other JavaScript code that will run outside of node.js, check out
the [Momento Web SDK](../client-sdk-web).

## Usage

```javascript
import {CacheClient, CacheGetResponse} from '@gomomento/sdk';

async function main() {
  const cacheClient = await CacheClient.create({
    defaultTtlSeconds: 60,
  });

  await cacheClient.createCache('cache');
  await cacheClient.set('cache', 'foo', 'FOO');
  const getResponse = await cacheClient.get('cache', 'foo');
  if (getResponse.type === CacheGetResponse.Hit) {
    console.log(`Got value: ${getResponse.valueString()}`);
  }
}

main().catch(e => {
  throw e;
});

```

## Getting Started and Documentation

Documentation is available on the [Momento Docs website](https://docs.momentohq.com).

## Examples

Working example projects, with all required build configuration files, are available in the [examples'](https://github.com/momentohq/client-sdk-javascript/tree/main/examples/nodejs) subdirectory.

## Developing

If you are interested in contributing to the SDK, please see the [CONTRIBUTING](./CONTRIBUTING.md) docs.

----------------------------------------------------------------------------------------
For more info, visit our website at [https://gomomento.com](https://gomomento.com)!
