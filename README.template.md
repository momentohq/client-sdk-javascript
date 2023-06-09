{{ ossHeader }}

## Packages

There are two different JavaScript SDKs available for Momento on npmjs.  The API is identical in both SDKs, but each
is best suited for a particular environment:

* [`@gomomento/sdk`](https://www.npmjs.com/package/@gomomento/sdk): the Momento node.js SDK, for use in server-side applications
  and other node.js environments where performance considerations are key.
* [`@gomomento/sdk-web`](https://www.npmjs.com/package/@gomomento/sdk-web): the Momento web SDK, for use in browsers or
  other non-node.js JavaScript environments.  More portable but less performant for server-side use cases.

## Usage

```javascript
{% include "./examples/nodejs/cache/readme.ts" %}
```

## Getting Started and Documentation

Documentation is available on the [Momento Docs website](https://docs.momentohq.com).

## Examples

Working example projects, with all required build configuration files, are available for both the node.js and web SDKs:

* [Node.js SDK examples](./examples/nodejs)
* [Web SDK examples](./examples/web)

## Developing

If you are interested in contributing to the SDK, please see the [CONTRIBUTING](./CONTRIBUTING.md) docs.

{{ ossFooter }}
