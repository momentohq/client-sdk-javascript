{{ ossHeader }}

# Momento Node.js SDK – AWS Lambda with Advanced (`zstd`) Compression Using CDK

## Overview

This example demonstrates how to deploy an AWS Lambda function using **Momento Cache** with **Zstandard (`zstd`) compression**.
It leverages a **custom Lambda layer** to include the `zstd` binary required by the `@gomomento/sdk-nodejs-compression-zstd` library.

## 📁 Project Structure

```
advanced-compression-cdk/
│-- src/
│   │-- lambda/                      # Lambda function source code
│   │   │-- index.ts                 # Lambda handler
│   │   │-- package.json              # Lambda-specific dependencies
│   │-- zstd-layer/                   # Custom Lambda layer for Zstd
│   │   │-- nodejs/                   # Layer dependencies
│   │   │   │-- package.json          # Layer-specific dependencies
│   │   │-- zstd_arm64_layer.zip      # Pre-packaged Lambda layer
│-- infrastructure/                   # AWS CDK infrastructure code
│   │-- bin/
│   │-- lib/
│   │-- package.json                   # CDK dependencies
│   │-- cdk.json                        # CDK configuration
│-- README.md                           # Project documentation
```

> **Note**: AWS Lambda layers must be structured so that the `node_modules` folder is inside the `nodejs/` directory within the zip file. Ensure that `zstd_arm64_layer.zip` contains `nodejs/node_modules` before deployment.

## Prerequisites

- Node version 18 or higher is required
- To get started with Momento, you will need a Super User Momento API key. You can get one from the [Momento Console](https://console.gomomento.com). Check out the [getting started](https://docs.momentohq.com/getting-started) guide for more information on obtaining an API key.
- To deploy the CDK app, you will need to have [configured your AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-authentication.html#cli-chap-authentication-precedence).

## Deployment

To deploy the project using AWS CDK, follow these steps:

```sh
cd infrastructure
npm install
npm run build
npm run deploy  # This zips the Lambda layer, builds the Lambda, and deploys the stack
```

## Invoking the Lambda

Once deployed, invoke the Lambda function using the AWS CLI:

```sh
aws lambda invoke --function-name AdvancedCompressionLambda --log-type Tail result.json | jq -r .LogResult | base64 -d
```

This command will execute the function and return the log output.

{{ ossFooter }}
