<head>
  <meta name="Momento Node.js Client Library Documentation" content="Node.js client software development kit for Momento Cache">
</head>
<img src="https://docs.momentohq.com/img/logo.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)

# Node.js Client SDK

## Example Requirements

- Node version 14 or higher is required
- A Momento API key is required, you can generate one using the [Momento Console](https://console.gomomento.com)

## Examples

This directory contains several subdirectories with different types of example projects:

- [Access Control](./access-control) - How to implement access control using Momento API keys
- [AWS Secrets Manager](./aws) - How to retrieve a Momento API key stored as a secret in AWS Secrets Manager and use it to create a cache
- [Cache Examples](./cache) - How to use Momento Cache
- [Lambda Example - Topics Microservice](./lambda-examples/topics-microservice) - Creates a microservice using API Gateway and an AWS Lambda function to ingest data into a topic in Momento Topics
- [Load Generator](./load-gen) - An example load generator for observing Momento performance
- [MongoDB + Momento Cache Read-aside Example](./mongodb-examples/simple-read-aside) - A simple example of using Momento Cache as a read-aside cache for simple MongoDB calls
- [Observability](./observability) - How to configure logging, metrics and traces
- [Token Vending Machine](./token-vending-machine) - Built using AWS CDK, API Gateway and Lambda, the primary use for the Token Vending Machine is to provide temporary, restricted scope Momento API keys. These tokens can be used by browsers that are running apps written against the [Momento Web SDK](https://github.com/momentohq/client-sdk-javascript/tree/main/packages/client-sdk-web).
- [Topic Examples](./topics) - How to use Momento Topics (aka PubSub)
