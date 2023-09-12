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
- To get started with Momento you will need a Momento API key. You can get one from the [Momento Console](https://console.gomomento.com). Check out the [getting started](https://docs.momentohq.com/getting-started) guide for more information on obtaining an API key.

## Deploying the Simple Get Lambda

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

You will also need a superuser API key generated from the [Momento Console](https://console.gomomento.com).

Then run:

```
npm run cdk -- deploy --parameters MomentoApiKey=<YOUR_MOMENTO_API_KEY>
```

The lambda does not set up a way to access itself externally, so to run it, you will have to go to MomentoSimpleGet in AWS Lambda and run a test.

The lambda is set up to make get calls for the key 'key' in the cache 'cache' by default. It does not create a cache or write anything to that key. While it still may give useful latency information if it can't find a cache or key, creating them will let you test in a more realistic way.

If you have the [Momento CLI](https://github.com/momentohq/momento-cli) installed, you can create a cache like this:

```commandline
momento cache create cache
```

You can then set a value for the key:

```commandline
momento cache set key value
```

You can edit [handler.ts](lambda/simple-get/handler.ts) to change the cache and key the lambda looks for.
