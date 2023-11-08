<head>
  <meta name="Momento Node.js Client Library Documentation" content="Node.js client software development kit for Momento Cache">
</head>
<img src="https://docs.momentohq.com/img/logo.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)

<br>

## Token Vending Machine

This repo contains an example Token Vending Machine application, built using AWS CDK, API Gateway and Lambda.

The primary use for the Token Vending Machine is to provide temporary, restricted scope Momento API keys. These tokens can be used by browsers that are running apps written against the [Momento Web SDK](https://github.com/momentohq/client-sdk-javascript/tree/main/packages/client-sdk-web). For example, you can create a browser-based chat application that allows pub/sub communication between your users via [Momento Topics](https://docs.momentohq.com/introduction/momento-topics); each browser will need a Momento API key in order to communicate with the Momento Topics server, and the Token Vending Machine can provide those tokens.

## Prerequisites

- Node version 14 or higher is required
- To get started with Momento you will need a Momento API key. You can get one from the [Momento Console](https://console.gomomento.com). Check out the [getting started](https://docs.momentohq.com/getting-started) guide for more information on obtaining an API key.

## Configuring the Token Vending Machine App

Before you deploy the Token Vending Machine, you will need to configure the scope of permissions and the expiry duration for the tokens that it will vend. For example, you can restrict the permissions for these browser tokens so that they have read-only access or read-write access, and you can also restrict them to specific caches or topics.

You will also need to specify the authentication method for the Token Vending Machine's API Gateway Endpoint. You may choose to leave it open, allowing the API Gateway URL to be publicly accessible, or you may choose to use Lambda Authorizer or Amazon Cognito as an authenticator. Basic examples for each of these methods is provided in the [Lambda Authorizer handler](./lambda/authorizer/authorizer.ts) and [CDK definition](./infrastructure/lib/token-vending-machine-stack.ts) files.

These three required configuration variables live in the [config.ts](./lambda/token-vending-machine/config.ts) file.

## Deploying the Token Vending Machine App

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
npm run deploy -- --parameters MomentoApiKey=<YOUR_MOMENTO_API_KEY>
```

When the command completes, you should see something like this near the end of the output:

```
Outputs:
MomentoTokenVendingMachine.MomentoTokenVendingMachineApiEndpointE36C2123 = https://9jkmukxn68.execute-api.us-west-2.amazonaws.com/prod/
```

This is the URL of the API Gateway endpoint for your Token Vending Machine. Now you should be able to `curl` this endpoint, and the response will be a temporary Momento API key suitable for use in a browser!
You should see an output like:

```
{"authToken":"someShortLivedDisposableToken","expiresAt":1698119397}
```

You can also pass a tokenId as a query string to your curl command to add context to your token. This can be particularly useful when using [Momento Topics](https://www.gomomento.com/services/topics) as the tokenId can be retrieved from subscription messages, allowing your application to distinguish between different subscribers. In this case, a `name` for the user is the `tokenId` passed as a query string.

`https://9jkmukxn68.execute-api.us-west-2.amazonaws.com/prod?name=Taylor`


## Example Apps That Use The Token Vending Machine

- [Simple Chat Application](https://github.com/momentohq/client-sdk-javascript/tree/main/examples/web/vite-chat-app) - this is a simple, static, browser-based chat application that uses the Momento Web SDK. When loaded in the browser, the app will make a request to the Token Vending Machine URL to get a token for use in communicating with the Momento Topics server.


If you have questions or need help experimenting further, please reach out to us!



