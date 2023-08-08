<head>
  <meta name="Momento Node.js Client Library Documentation" content="Node.js client software development kit for Momento Cache">
</head>
<img src="https://docs.momentohq.com/img/logo.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)

# Node.js Client SDK

## Example Requirements

- Node version 14 or higher is required
- A Momento Auth Token is required, you can generate one using the [Momento Console](https://console.gomomento.com)

## Examples

This directory contains subdirectories for two types of example projects to use Momento inside a Cloudflare worker:

[HTTP-API](./http-api) - How to interact with Momento cache using its HTTP API on Cloudflare workers.
[Web-SDK](./web-sdk) - How to interact with Momento cache using its web SDK on Cloudflare workers.

There are a few reasons why you might choose one over the other when interacting with Momento within a Cloudflare Worker.

- The HTTP APIs is more flexible. You can use it to interact with Momento, regardless of the programming language or framework
you're using. This makes it a good choice if you need to integrate with a wide variety of services.
- The Web SDK is more convenient. They provide a higher level of abstraction, which can make it easier to interact with Momento.
- Using the HTTP API might be more efficient and can be optimized for exactly what you need, leading to performance benefits.
They don't require the overhead of loading and initializing a web SDK. This can be important if you're running a high-traffic Worker.
- Web SDKs are easier to use. They provide a lot of built-in functionality, such as error handling, observability, authentication, etc.
This can save you time and effort when developing your Worker.
