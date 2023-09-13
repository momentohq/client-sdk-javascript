<head>
  <meta name="Momento Node.js Client Library Documentation" content="Node.js client software development kit for Momento Cache">
</head>
<img src="https://docs.momentohq.com/img/logo.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)

# Using Momento Cache with Deno and Deno Deploy

## Example Requirements

- Node version 14 or higher is required
- A Momento Cache and API key is required, you can generate them using the [Momento Console](https://console.gomomento.com)

## Examples

This directory contains subdirectories for two types of example projects to use Momento Cache inside a Deno runtime:

- [HTTP-API](./http-api) - How to interact with Momento Cache using the HTTP API in Deno and Deno Deploy. The HTTP API is lightweight in that you won't need any additional dependencies beyond what Deno requires and you can use the standard `fetch` HTTP client methods. However, it only provides a basic subset of all of the Momento APIs, such as `get`, `set`, and `delete`, and is currently only available if you use AWS as your cloud provider.

- [Web-SDK](./web-sdk) - How to interact with Momento Cache using the [Web SDK](https://github.com/momentohq/client-sdk-javascript/blob/main/packages/client-sdk-web/README.md) in Deno. The Web SDK is a bit heavier-weight; you need to add a dependency on the SDK. However, it supports the full Momento API (including collections like Dictionaries and SortedSets, plus the ability to publish to Momento Topics). It also has a complete TypeScript/JavaScript API that makes it simpler to write code to interact with Momento. This can save you time and effort when developing your Worker.

**Note**: Deno Deploy does not yet support [npm specifiers](https://deno.land/manual@v1.36.1/node/npm_specifiers) which is how our example pulls in the Web SDK and its dependencies. For now, only our HTTP API example can be published using Deno Deploy.
