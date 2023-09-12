## About

This example project is a browser-based chat application that allows pub/sub communication between your users via [Momento Topics](https://docs.momentohq.com/introduction/momento-topics). Each browser will need a Momento API key in order to communicate with the Momento Topics server, and Momento's [Token Vending Machine application](https://github.com/momentohq/client-sdk-javascript/tree/main/examples/nodejs/token-vending-machine) can provide those tokens, which can be scoped to provide permissions to only the necessary caches and topics.

## Prerequisites

In order for this project to run, you will need:

- A deployed [Token Vending Machine](https://github.com/momentohq/client-sdk-javascript/tree/main/examples/nodejs/token-vending-machine).
- A Momento cache, which you can create in the [Momento Console](https://console.gomomento.com). Check out the [getting started](https://docs.momentohq.com/getting-started) guide for more information on creating a cache.

## Getting Started

First, install all dependencies:

```
npm install
```

Then, edit the `.env.development` file with your token vending machine url and your cache name:

```
VITE_TOKEN_VENDING_MACHINE_URL="https://..."
VITE_MOMENTO_CACHE_NAME="my-cache"
```

Additionally, if you deployed your Token Vending Machine with an authentication method, you'll need to specify which method you used and the corresponding additional environment variables:

```
VITE_TOKEN_VENDING_MACHINE_AUTH_TYPE="open|lambda|cognito"
```

An "open" Token Vending Machine means there is no auth mechanism and no additional environment variables. See [below](#token-vending-machine-auth-environment-variables) for more details if you did deploy your Token Vending Machine with auth configured.

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) with your browser to see the result.

## Token Vending Machine Auth Environment Variables

### Lambda Authorizer

If you deployed your Token Vending Machine with the Lambda Authorizer ("lambda") authentication method, you'll need to include these variables in your `.env.development` file:

```
VITE_TOKEN_VENDING_MACHINE_USERNAME=<username>
VITE_TOKEN_VENDING_MACHINE_PASSWORD=<password>
```

The username and password you provide here should match what was hardcoded into your Lambda Authorizer code ([example linked here](https://github.com/momentohq/client-sdk-javascript/blob/main/examples/nodejs/token-vending-machine/lambda/authorizer/authorizer.ts))

### Amazon Cognito

To demonstrate the Token Vending Machine's ability to vend different tokens to different types of users, the example Cognito authentication method provides two roles: a ReadOnly role that is only able to subscribe to the chat topic, and a ReadWrite role that can both publish and subscribe.

If you deployed your Token Vending Machine with the Amazon Cognito ("cognito") authentication method, you'll need to include these additional variables in your `.env.development` file:

```
VITE_TOKEN_VENDING_MACHINE_CLIENT_ID=<cdk-generated-client-id>
VITE_TOKEN_VENDING_MACHINE_AWS_REGION=<your-aws-region>

VITE_TOKEN_VENDING_MACHINE_USERNAME_READONLY=<readonly-user-username>
VITE_TOKEN_VENDING_MACHINE_PASSWORD_READONLY=<readonly-user-password>

VITE_TOKEN_VENDING_MACHINE_USERNAME_READWRITE=<readwrite-user-username>
VITE_TOKEN_VENDING_MACHINE_PASSWORD_READWRITE=<readwrite-user-password>
```

The usernames and passwords you provide for the ReadOnly and ReadWrite roles should match what you hardcoded into your Token Vending Machine deployment ([Cognito user creation lines linked here](https://github.com/momentohq/client-sdk-javascript/blob/main/examples/nodejs/token-vending-machine/infrastructure/lib/token-vending-machine-stack.ts#L134)).
The AWS region should match the region that you deployed the Token Vending Machine to.
The client ID should be the string that's printed out after you deploy the CDK stack:

```
MomentoTokenVendingMachine.UserPoolClientId = <cdk-generated-client-id>
```

