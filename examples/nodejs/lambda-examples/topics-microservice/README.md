# Welcome to an example microservice using Momento Topics

This example create an API Gateway configuration and deploys an AWS Lambda function to publish data to a topic in Momento Topics.

## Prerequisites
- An AWS account
- A Momento auth token from the [Momento console](https://console.gomomento.com).
- The Momento auth token [stored in AWS Secrets Manager](https://docs.momentohq.com/develop/integrations/aws-secrets-manager) as text.
- AWS CDK command line tool installed
- Node.js installed

## Useful commands
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
