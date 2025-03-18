<img src="https://docs.momentohq.com/img/momento-logo-forest.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)


# Momento Node.js SDK – AWS Lambda with Advanced (`zstd`) Compression Using CDK

## Overview

This example demonstrates how to deploy an AWS Lambda function using **Momento Cache** with **Zstandard (`zstd`) compression**.
It leverages a **custom Lambda layer** to include the `zstd` binary required by the `@gomomento/sdk-nodejs-compression-zstd` library.

## 📁 Project Structure

```
advanced-compression-cdk/
│-- src/
│   │-- lambda/                       # Lambda function source code
│   │   │-- index.ts                  # Lambda handler
│   │   │-- package.json              # Lambda-specific dependencies
│   │-- zstd-layer/                   # Custom Lambda layer for Zstd
│   │   │-- nodejs/                   # Layer dependencies
│   │   │   │-- package.json          # Layer-specific dependencies
│   │   │-- zstd_arm64_layer.zip      # Pre-packaged Lambda layer
│-- infrastructure/                   # AWS CDK infrastructure code
│   │-- bin/
│   │-- lib/
│   │-- package.json                   # CDK dependencies
│   │-- cdk.json                       # CDK configuration
│-- README.md                          # Project documentation
```

> **Note**: AWS Lambda layers must be structured so that the `node_modules` folder is inside the `nodejs/` directory within the zip file (checkout [AWS Lambda Layer documentation](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-layers.html) for more info). Ensure that `zstd_arm64_layer.zip` contains `nodejs/node_modules` before deployment.

## Deployment

To deploy the project using AWS CDK, follow these steps:

```sh
cd infrastructure
npm install
npm run build
npm run deploy  # This zips the Lambda layer, builds the Lambda, and deploys the stack
```

## Invoking the Lambda
```bash
aws lambda invoke --function-name AdvanvcedCompressionLambda --log-type Tail result.json | jq -r .LogResult | base64 -d
```

## Invoking the Lambda

Once deployed, invoke the Lambda function using the AWS CLI:

```sh
aws lambda invoke --function-name AdvancedCompressionLambda --log-type Tail result.json | jq -r .LogResult | base64 -d
```

This command will execute the function and return the log output.

----------------------------------------------------------------------------------------
For more info, visit our website at [https://gomomento.com](https://gomomento.com)!
