{{ ossHeader }}

# Momento Javascript SDKs - Using Momento inside a Cloudflare worker

## Example Requirements

- Node version 16 or higher is required
- A Momento API key is required, you can generate one using the [Momento Console](https://console.gomomento.com)

## Examples

This directory contains subdirectories for two types of example projects to use Momento inside a Cloudflare worker:

- [HTTP-API](./http-api) - How to interact with Momento cache using the HTTP API on Cloudflare workers. The HTTP APIs is lighter-weight; you don't need to add any dependencies, you can just use the standard `fetch` HTTP
  client methods. However, it only provides a basic subset of all the Momento APIs, such as `get`, `set`, and `delete`.

- [Web-SDK](./web-sdk) - How to interact with Momento cache using the [Web SDK](https://github.com/momentohq/client-sdk-javascript/blob/main/packages/client-sdk-web/README.md) on Cloudflare workers. The Web SDK is a bit heavier-weight; you need to add a dependency on the SDK. However, it supports the full Momento API (including collections like Dictionaries and SortedSets, plus the ability to publish to Momento Topics). It also has a complete TypeScript/JavaScript API that makes it simpler to write code to interact with Momento. This can save you time and effort when developing your Worker.

{{ ossFooter }}
