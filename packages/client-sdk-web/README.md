<head>
  <meta name="Momento Client Library Documentation for JavaScript Web" content="Momento client software development kit for JavaScript Web">
</head>
<img src="https://docs.momentohq.com/img/momento-logo-forest.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)

# Momento Client Library for JavaScript Web

Momento Cache is a fast, simple, pay-as-you-go caching solution without any of the operational overhead
required by traditional caching solutions.  This repo contains the source code for the Momento client library for JavaScript Web.

To get started with Momento you will need a Momento Auth Token. You can get one from the [Momento Console](https://console.gomomento.com).

* Website: [https://www.gomomento.com/](https://www.gomomento.com/)
* Momento Documentation: [https://docs.momentohq.com/](https://docs.momentohq.com/)
* Getting Started: [https://docs.momentohq.com/getting-started](https://docs.momentohq.com/getting-started)
* Momento SDK Documentation for JavaScript Web: [https://docs.momentohq.com/sdks/web](https://docs.momentohq.com/sdks/web)
* Discuss: [Momento Discord](https://discord.gg/3HkAKjUZGq)

## Packages

The JavaScript Web SDK is available on npmjs: [`@gomomento/sdk-web`](https://www.npmjs.com/package/@gomomento/sdk-web).

The web SDK is the best choice for client-side JavaScript applications, such as code that will run in a browser.  For
node.js server-side applications, check out the [Momento Node.js SDK](../client-sdk-nodejs).

## Usage

```javascript
import {CacheClient, Configurations} from '@gomomento/sdk-web';
import {initJSDom} from './utils/jsdom';
async function main() {
  // Because the Momento Web SDK is intended for use in a browser, we use the JSDom library to set up an environment
  // that will allow us to use it in a node.js program.
  initJSDom();
  const cacheClient = new CacheClient({
    configuration: Configurations.Laptop.v1(),
    defaultTtlSeconds: 60,
  });

  await cacheClient.createCache('cache');
  await cacheClient.set('cache', 'foo', 'FOO');
  const getResponse = await cacheClient.get('cache', 'foo');
  console.log(`Value: ${getResponse.value() ?? 'CACHE MISS OR ERROR'}`);
}

main().catch(e => {
  throw e;
});

```

## Getting Started and Documentation

Documentation is available on the [Momento Docs website](https://docs.momentohq.com).

## Examples

Working example projects, with all required build configuration files, are available in the [examples](https://github.com/momentohq/client-sdk-javascript/tree/main/examples/web) subdirectory.

## Developing

If you are interested in contributing to the SDK, please see the [CONTRIBUTING](./CONTRIBUTING.md) docs.

----------------------------------------------------------------------------------------
For more info, visit our website at [https://gomomento.com](https://gomomento.com)!
