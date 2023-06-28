# Welcome to an example microservice using Momento Topics

This example create an API Gateway configuration and deploys an AWS Lambda function to publish data to a topic in Momento Topics.

## Prerequisites
- An existing [Momento auth token](https://docs.momentohq.com/develop/integrations/aws-secrets-manager) stored in AWS Secrets Manager as text.
- An AWS account
- AWS CDK installed
- Node.js installed
- NPM installed

## Useful commands
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
