<head>
  <meta name="Momento JavaScript Client Library Documentation" content="JavaScript client software development kit for Momento Cache">
</head>
<img src="https://docs.momentohq.com/img/momento-logo-forest.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)

# Momento JavaScript Client Libraries

Momento Cache is a fast, simple, pay-as-you-go caching solution without any of the operational overhead
required by traditional caching solutions.  This repo contains the source code for the Momento JavaScript client libraries.

To get started with Momento you will need a Momento Auth Token. You can get one from the [Momento Console](https://console.gomomento.com).

* Website: [https://www.gomomento.com/](https://www.gomomento.com/)
* Momento Documentation: [https://docs.momentohq.com/](https://docs.momentohq.com/)
* Getting Started: [https://docs.momentohq.com/getting-started](https://docs.momentohq.com/getting-started)
* JavaScript SDK Documentation: [https://docs.momentohq.com/sdks/nodejs](https://docs.momentohq.com/sdks/nodejs)
* Discuss: [Momento Discord](https://discord.gg/3HkAKjUZGq)

## Packages

There are two different JavaScript SDKs available for Momento on npmjs.  The API is identical in both SDKs, but each
is best suited for a particular environment:

* [`@gomomento/sdk`](https://www.npmjs.com/package/@gomomento/sdk): the Momento node.js SDK, for use in server-side applications
  and other node.js environments where performance considerations are key.
* [`@gomomento/sdk-web`](https://www.npmjs.com/package/@gomomento/sdk-web): the Momento web SDK, for use in browsers or
  other non-node.js JavaScript environments.  More portable but less performant for server-side use cases.

## Usage

```javascript
import {CacheGet, CacheClient, Configurations, CredentialProvider} from '@gomomento/sdk';

async function main() {
  const cacheClient = await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
    defaultTtlSeconds: 60,
  });

  await cacheClient.createCache('cache');
  await cacheClient.set('cache', 'foo', 'FOO');
  const getResponse = await cacheClient.get('cache', 'foo');
  if (getResponse instanceof CacheGet.Hit) {
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

Working example projects, with all required build configuration files, are available for both the node.js and web SDKs:

* [Node.js SDK examples](./examples/nodejs)
* [Web SDK examples](./examples/web)

## Developing

If you are interested in contributing to the SDK, please see the [CONTRIBUTING](./CONTRIBUTING.md) docs.

----------------------------------------------------------------------------------------
For more info, visit our website at [https://gomomento.com](https://gomomento.com)!
