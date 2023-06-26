# Welcome to the Momento auth token vendor microservice.

This microservice is deployed using AWS CDK to deploy resources to AWS using AWS API Gateway, AWS Lambda, and Momento Cache or Momento Token. The Lambda function will take in

Configure `resources/config.json` with the AWS region name you want this service name deployed in.

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
