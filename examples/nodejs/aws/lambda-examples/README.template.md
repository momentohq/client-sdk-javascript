{{ ossHeader }}

# Momento Node.js SDK - AWS Lambda Examples

Working example projects, with all required build configuration files, for using the Momento Node.js SDK in AWS Lambda functions.

* [Simple cache get](./simple-get) - a very basic lambda that just illustrates how to initialize a cache client and do some basic reads
* [Cloudwatch metrics](./cloudwatch-metrics) - a lambda that demonstrates how to use metrics middleware to generate CloudWatch metrics for cache operations that occur in your lambda, including an example CloudWatch dashboard!
* [Advanced compression](./advanced-compression) - a lambda that demonstrates how to package the `@gomomento/sdk-nodejs-compression-zstd` dependency in your lambda, if you have an advanced compression use case that requires the `zstd` extension rather than the default `@gomomento/sdk-nodejs-compression` extension.

{{ ossFooter }}
