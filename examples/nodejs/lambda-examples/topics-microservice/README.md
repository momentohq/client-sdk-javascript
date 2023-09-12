# An example microservice utilizing Momento Topics

This example code creates a microservice using API Gateway and an AWS Lambda function to ingest data into a topic in Momento Topics.

NOTE: This is just an example usage of Momento Topics to create a generic microservice. You do not need this service; you can borrow the code if it helps you to write your own app to connect to Topics directly.

## Prerequisites
- An AWS account
- A Momento API key from the [Momento console](https://console.gomomento.com).
- The Momento API key [stored in AWS Secrets Manager](https://docs.momentohq.com/develop/integrations/aws-secrets-manager) as text.
- AWS CDK command line tool installed (optional as you can run CDK via npm with `npm run cdk`)
- Node.js installed

## Useful commands
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
* `cdk destroy`     destroys this stack in your default AWS account/Region
*
