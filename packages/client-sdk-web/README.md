<head>
  <meta name="Momento Web Client Library Documentation" content="JavaScript web client software development kit for Momento Cache">
</head>
<img src="https://docs.momentohq.com/img/logo.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)

# Momento JavaScript Web Client Library

* Website: [https://www.gomomento.com/](https://www.gomomento.com/)
* Documentation: [https://docs.momentohq.com/](https://docs.momentohq.com/)
* Getting Started: [https://docs.momentohq.com/getting-started](https://docs.momentohq.com/getting-started)
* Discuss: [Momento Discord](https://discord.gg/3HkAKjUZGq)

Momento Cache is a fast, simple, pay-as-you-go caching solution without any of the operational overhead
required by traditional caching solutions.  This repo contains the source code for the Momento JavaScript client libraries.

## Packages

The JavaScript Web SDK is available on npmjs: [`@gomomento/sdk-web`](https://www.npmjs.com/package/@gomomento/sdk-web).

The web SDK is the best choice for client-side JavaScript applications, such as code that will run in a browser.  For
node.js server-side applications, check out the [Momento Node.js SDK](../client-sdk-nodejs).

## Usage

```javascript
/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/ban-ts-comment */
import {CacheGet, CacheClient, Configurations, CredentialProvider} from '@gomomento/sdk-web';
// @ts-ignore
// This global is required in order to use the Web SDK outside of a browser
global.XMLHttpRequest = require('xhr2');
async function main() {
  const momento = new CacheClient({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_AUTH_TOKEN',
    }),
    defaultTtlSeconds: 60,
  });

  await momento.createCache('cache');
  await momento.set('cache', 'foo', 'FOO');
  const getResponse = await momento.get('cache', 'foo');
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

Working example projects, with all required build configuration files, are available in the [examples](../../examples/web) subdirectory.

## Developing

If you are interested in contributing to the SDK, please see the [CONTRIBUTING](./CONTRIBUTING.md) docs.
