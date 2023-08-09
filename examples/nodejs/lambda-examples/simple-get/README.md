<head>
  <meta name="Momento Node.js Client Library Documentation" content="Node.js client software development kit for Momento Cache">
</head>
<img src="https://docs.momentohq.com/img/logo.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)

<br>

## Simple Get Lambda

This repo contains an example lambda, built using AWS CDK, that repeatedly calls get on a Momento cache.

The primary use is to provide a base for testing Momento performance in a lambda environment. The lambda creates a Momento client, and then calls get on a hard-coded key 100 times, with a 100ms wait between calls. The metric logging middleware is enabled, so detailed information about each call is logged.

## Prerequisites

- Node version 14 or higher is required
- To get started with Momento you will need a Momento Auth Token. You can get one from the [Momento Console](https://console.gomomento.com). Check out the [getting started](https://docs.momentohq.com/getting-started) guide for more information on obtaining an auth token.

## Deploying the Token Vending Machine App

First make sure to start Docker and install the dependencies in the `lambda` directory, which is where the AWS Lambda code lives.

```bash
cd lambda/simple-get
npm install
```

The source code for the CDK application lives in the `infrastructure` directory.
To build and deploy it you will first need to install the dependencies:

```bash
cd infrastructure
npm install
```

To deploy the CDK app you will need to have [configured your AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-authentication.html#cli-chap-authentication-precedence).

You will also need a superuser token generated from the [Momento Console](https://console.gomomento.com).

Then run:

```
npm run cdk -- deploy --parameters MomentoAuthToken=<YOUR_MOMENTO_AUTH_TOKEN>
```

The lambda does not set up a way to access itself externally, so to run it, you will have to go to MomentoSimpleGet in AWS Lambda and run a test.



