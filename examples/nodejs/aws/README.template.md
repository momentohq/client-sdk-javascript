{{ ossHeader }}

# Momento Node.js SDK - AWS Examples

This directory contains examples for integrations between Momento and AWS services.

Examples include:

- [AWS Secrets Manager Example](./secrets-manager) - an example of how to retrieve a Momento API key stored as a secret in AWS Secrets Manager and use it to create a cache.
- [AWS Lambda - Simple Cache `get` Example](./lambda-examples/simple-get) - an example of how to use the Momento Node.js SDK to retrieve a value from a cache in an AWS Lambda function.
- [AWS Lambda - CloudWatch Metrics Example](./lambda-examples/cloudwatch-metrics) - an example of how to use Momento middleware to generate client-side metrics for interactions with the Momento cache, and publish them to a CloudWatch dashboard.
- [AWS Lambda - Advanced compression](./lambda-examples/advanced-compression) - a lambda that demonstrates how to package the `@gomomento/sdk-nodejs-compression-zstd` dependency in your lambda, if you have an advanced compression use case that requires the `zstd` extension rather than the default `@gomomento/sdk-nodejs-compression` extension.


If you have questions or need help experimenting further, please reach out to us!

{{ ossFooter }}
