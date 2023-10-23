<head>
  <meta name="Momento Node.js Client Library Documentation" content="Node.js client software development kit for Momento Cache">
</head>
<img src="https://docs.momentohq.com/img/logo.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)

<br>

## CloudWatch Metrics using Momento's Experimental Metrics Middleware

This directory contains an AWS CDK stack that will create and populate a custom CloudWatch dashboard for Momento client-side metrics. You can deploy an example Lambda function or ECS cluster that uses the Momento Node.js SDK's Experimental Metrics Middleware to generate example dashboard data for 5 minutes at a time. Or you can deploy just the CloudWatch dashboard and use your own application to emit Momento metrics.

## Prerequisites

- Node version 18 or higher is required
- To get started with Momento, you will need a Super User Momento API key. You can get one from the [Momento Console](https://console.gomomento.com). Check out the [getting started](https://docs.momentohq.com/getting-started) guide for more information on obtaining an API key.
- To deploy the CDK app, you will need to have [configured your AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-authentication.html#cli-chap-authentication-precedence).

## Deploying the CloudWatch Dashboard (along with an example Momento Lambda Function)

Follow the instructions in this section to deploy a CloudWatch dashboard along with a Node.js Lambda function that uses Momento's Experimental Metrics Middleware.

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

Then create a `.env` file in the `infrastructure` directory, which is where you will define all required configuration variables. 
You will need the Super User API key you generated from the [Momento Console](https://console.gomomento.com). You will also set the `EXAMPLE_MOMENTO_APPLICATION` variable to `lambda` like so:

```bash
MOMENTO_API_KEY=<YOUR_MOMENTO_API_KEY>
EXAMPLE_MOMENTO_APPLICATION="lambda"
```

Then deploy the CDK stack for the example Lambda function and CloudWatch dashboard:

```
npm run cdk -- deploy
```

To run the lambda, go to the `MomentoMetricsMiddlewareCDKExample` function in the AWS Lambda console and click the `test` button to invoke the example.

After a few minutes, you should be able to see the metrics populating several charts by navigating to CloudWatch > Dashboards > Custom Dashboards > MomentoMetricsCDKExampleDashboard in the AWS console.

## Deploying the CloudWatch Dashboard (along with an example Momento ECS Cluster)

Follow the instructions in this section to deploy a CloudWatch dashboard along with a small ECS cluster for a Node.js Docker image that uses Momento's Experimental Metrics Middleware.

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

Then create a `.env` file in the `infrastructure` directory, which is where you will define all required configuration variables. 
You will need the Super User API key you generated from the [Momento Console](https://console.gomomento.com). You will also set the `EXAMPLE_MOMENTO_APPLICATION` variable to `ecs` like so:

```bash
MOMENTO_API_KEY=<YOUR_MOMENTO_API_KEY>
EXAMPLE_MOMENTO_APPLICATION="ecs"
```

Then deploy the CDK stack for the example Lambda function and CloudWatch dashboard:

```
npm run cdk -- deploy
```

The ECS cluster should automatically start running the task and generating logs. After a few minutes, you should be able to see the metrics populating several charts by navigating to CloudWatch > Dashboards > Custom Dashboards > MomentoMetricsCDKExampleDashboard in the AWS console.

## Deploying only the CloudWatch Dashboard

Follow the instructions in this section to deploy only the CloudWatch metric filters and dashboard. This configuration option assumes you have an existing application that uses the Node.js or .NET Momento SDK Experimental Metrics Middleware that will emit metrics to the log group created by this CDK stack.

First make sure to start Docker and install the dependencies in the `infrastructure` directory.

```bash
cd infrastructure
npm install
```

Then create a `.env` file in the `infrastructure` directory, which is where you will define all required configuration variables. 
You will need the Super User API key you generated from the [Momento Console](https://console.gomomento.com). You will also set the `EXAMPLE_MOMENTO_APPLICATION` and `LOG_GROUP_NAME` variables like so:

```bash
MOMENTO_API_KEY=<YOUR_MOMENTO_API_KEY>
EXAMPLE_MOMENTO_APPLICATION="dashboard-only"
LOG_GROUP_NAME="<YOUR_LOG_GROUP_NAME>"
```

Deploy the CDK stack for the metric filters and CloudWatch dashboard:

```
npm run cdk -- deploy
```

And then finally deploy your existing application in the usual way. Please note that this setup assumes your application will emit logs to the log group created for the dashboard, so be sure to double check that the log group names are aligned.
