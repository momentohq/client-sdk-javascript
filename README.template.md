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

You'll need a Momento API key to authenticate with Momento. You can get one from the [Momento Console](https://console.gomomento.com/caches).

By default, Momento clients use a `CredentialProvider` that expects an environment variable named `MOMENTO_API_KEY`

```bash
export MOMENTO_API_KEY=<your Momento API key here>
```

Note: it is best practice to put the API key into something like AWS Secret Manager or GCP Secret Manager instead of an environment variable for enhanced security. See [these docs](https://docs.momentohq.com/cache/develop#instantiating-credential-providers-using-momento-api-keys) for more information about instantiating your own `CredentialProvider`.

## Getting Started and Documentation

Documentation is available on the [Momento Docs website](https://docs.momentohq.com). For information specific to a
particular SDK, see the [Node.js SDK documentation](https://docs.momentohq.com/sdks/nodejs) or the
[Web SDK documentation](https://docs.momentohq.com/sdks/web). We also have quickstart guides for both
[Cache](https://docs.momentohq.com/sdks/nodejs/cache.html) and [Topics](https://docs.momentohq.com/sdks/nodejs/topics.html).

## Examples

Working example projects, with all required build configuration files, are available for both the node.js and web SDKs:

* [Node.js SDK examples](./examples/nodejs)
* [Web SDK examples](./examples/web)

## Developing

If you are interested in contributing to the SDK, please see the [CONTRIBUTING](./CONTRIBUTING.md) docs.

{{ ossFooter }}
