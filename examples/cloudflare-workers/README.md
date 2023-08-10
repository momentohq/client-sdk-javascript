<head>
  <meta name="Momento Node.js Client Library Documentation" content="Node.js client software development kit for Momento Cache">
</head>
<img src="https://docs.momentohq.com/img/logo.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)

# Using Momento inside a Cloudflare worker

## Example Requirements

- Node version 14 or higher is required
- A Momento Auth Token is required, you can generate one using the [Momento Console](https://console.gomomento.com)

## Examples

This directory contains subdirectories for two types of example projects to use Momento inside a Cloudflare worker:

[HTTP-API](./http-api) - How to interact with Momento cache using its HTTP API on Cloudflare workers.
[Web-SDK](./web-sdk) - How to interact with Momento cache using its web SDK on Cloudflare workers.

There are a few reasons why you might choose one over the other when interacting with Momento within a Cloudflare Worker.

- The HTTP APIs is lighter-weight; you don't need to add any dependencies, you can just use the standard `fetch` HTTP
client methods. However, it only provides a basic subset of all of the Momento APIs, such as `get`, `set`, and `delete`.

- The Web SDK is heavier-weight; you need to add a dependency on the SDK. However, it supports the full Momento API
(including collections like Dictionaries and SortedSets, plus the ability to publish to Momento Topics). It also has a
complete TypeScript/JavaScript API that makes it simpler to write code to interact with Momento. This can save you time
and effort when developing your Worker.
