<img src="https://docs.momentohq.com/img/momento-logo-forest.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)


# Node.js Client SDK

## Example Requirements

- Node version 16 or higher is required
- A Momento API key is required, you can generate one using the [Momento Console](https://console.gomomento.com)

## Examples

This directory contains several subdirectories with different types of example projects:

- [Cache Examples](./cache) - How to use Momento Cache. The most basic examples.
- [Topic Examples](./topics) - How to use Momento Topics (aka PubSub)
- [Compression Examples](./compression) - How to use compression with Momento Cache, to reduce bandwidth and data transfer costs
- [`zstd` Compression Examples](./compression-zstd) - Advanced compession example, using native zstd binaries for compression
- [Access Control](./access-control) - How to implement access control using Momento API keys
- [AWS Secrets Manager](./aws/secrets-manager) - How to retrieve a Momento API key stored as a secret in AWS Secrets Manager and use it to create a cache
- [AWS Lambda Examples](./aws/lambda-examples) - How to use the Momento Node.js SDK in AWS Lambda functions
- [AWS EventBridge Example](./aws/eventbridge) - Demo app illustrating how to build a write-through cache for DynamoDB using DDB Streams, EventBridge, and Momento
- [Load Generator](./load-gen) - An example load generator for observing Momento performance
- [Observability](./observability) - How to configure logging, metrics and traces
- [MongoDB + Momento Cache Read-aside Example](./mongodb-examples/simple-read-aside) - A simple example of using Momento Cache as a read-aside cache for simple MongoDB calls
- [Token Vending Machine](./token-vending-machine) - Built using AWS CDK, API Gateway and Lambda, the primary use for the Token Vending Machine is to provide temporary, restricted scope Momento API keys. These tokens can be used by browsers that are running apps written against the [Momento Web SDK](https://github.com/momentohq/client-sdk-javascript/tree/main/packages/client-sdk-web).

----------------------------------------------------------------------------------------
For more info, visit our website at [https://gomomento.com](https://gomomento.com)!
