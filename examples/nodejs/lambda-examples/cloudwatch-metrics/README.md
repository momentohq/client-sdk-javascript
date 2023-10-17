<head>
  <meta name="Momento Node.js Client Library Documentation" content="Node.js client software development kit for Momento Cache">
</head>
<img src="https://docs.momentohq.com/img/logo.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)

<br>

## CloudWatch Metrics using Momento's Experimental Metrics Middleware

This directory contains an AWS CDK stack that will start up either a Lambda function or ECS cluster to get and set values in a Momento cache for 5 minutes, generating example data that will populate a custom CloudWatch dashboard for Momento client-side metrics. The example application creates a Momento cache client with metrics logging enabled and the CDK stack creates the CloudWatch metrics filters and custom dashboard that draws from the logs.

## Prerequisites

- Node version 14 or higher is required
- To get started with Momento you will need a Super User Momento API key. You can get one from the [Momento Console](https://console.gomomento.com). Check out the [getting started](https://docs.momentohq.com/getting-started) guide for more information on obtaining an API key.

## Deploying the Lambda Function

First make sure to start Docker and install the dependencies in the `lambda` directory, which is where the Lambda code lives.

```bash
cd lambda
npm install
```

The source code for the CDK application lives in the `infrastructure` directory.
To build and deploy it you will first need to install the dependencies:

```bash
cd infrastructure
npm install
```

You will also need to set the `stackConfig` variable in the [`momento-metrics-stack.ts` file](./infrastructure/lib/momento-metrics-stack.ts) to `exampleApp.NodejsLambda` to specify that you want to deploy the Lambda metrics example.

```
const stackConfig: exampleApp = exampleApp.NodejsLambda;
```

To deploy the CDK app you will need to have [configured your AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-authentication.html#cli-chap-authentication-precedence).

You will also need the Super User API key you generated from the [Momento Console](https://console.gomomento.com).

Then run:

```
npm run cdk -- deploy --parameters MomentoApiKey=<YOUR_MOMENTO_API_KEY>
```

The lambda does not set up a way to access itself externally, so to run it, you will have to go to the `MomentoMetricsMiddlewareCDKExample` function in AWS Lambda and click the `test` button to invoke the example.

After a few minutes, you should be able to see the metrics populating several charts by navigating to CloudWatch > Dashboards > Custom Dashboards > MomentoMetricsCDKExampleDashboard in the AWS console.

## Deploying the ECS Cluster

First make sure to start Docker and install the dependencies in the `docker` directory, which is where the ECS container code lives.

```bash
cd docker
npm install
```

The source code for the CDK application lives in the `infrastructure` directory.
To build and deploy it you will first need to install the dependencies:

```bash
cd infrastructure
npm install
```

You will also need to set the `stackConfig` variable in the [`momento-metrics-stack.ts` file](./infrastructure/lib/momento-metrics-stack.ts) to `exampleApp.NodejsEcs` to specify that you want to deploy the ECS metrics example, as well as the `customLogGroupName` variable so that the CDK stack knows which log group to attach the metric filters to.

```
const stackConfig: exampleApp = exampleApp.NodejsEcs;
const customLogGroupName = '/your/log/group/name/here';
```

To deploy the CDK app you will need to have [configured your AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-authentication.html#cli-chap-authentication-precedence).

You will also need the Super User API key you generated from the [Momento Console](https://console.gomomento.com).

Then run:

```
npm run cdk -- deploy --parameters MomentoApiKey=<YOUR_MOMENTO_API_KEY>
```

The ECS cluster should automatically start running the task and generating logs. After a few minutes, you should be able to see the metrics populating several charts by navigating to CloudWatch > Dashboards > Custom Dashboards > MomentoMetricsCDKExampleDashboard in the AWS console.

## Deploying a Custom Application

If you want to create the metric filters and CloudWatch dashboard without the Lambda function or ECS cluster, you can set the `stackConfig` variable in the [`momento-metrics-stack.ts` file](./infrastructure/lib/momento-metrics-stack.ts) to `exampleApp.Custom` to indicate that you have a custom application for generating the logs.

```
const stackConfig: exampleApp = exampleApp.Custom;
```

Then proceed with the usual CDK deployment:

```
npm run cdk -- deploy --parameters MomentoApiKey=<YOUR_MOMENTO_API_KEY>
```
