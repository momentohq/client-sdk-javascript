<img src="https://docs.momentohq.com/img/momento-logo-forest.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)


# Momento Node.js SDK - AWS Lambda Examples

Working example projects, with all required build configuration files, for using the Momento Node.js SDK in AWS Lambda functions.

* [Simple cache get](./simple-get) - a very basic lambda that just illustrates how to initialize a cache client and do some basic reads
* [Cloudwatch metrics](./cloudwatch-metrics) - a lambda that demonstrates how to use metrics middleware to generate CloudWatch metrics for cache operations that occur in your lambda, including an example CloudWatch dashboard!
* [Advanced compression](./advanced-compression) - a lambda that demonstrates how to package the `@gomomento/sdk-nodejs-compression-zstd` dependency in your lambda, if you have an advanced compression use case that requires the `zstd` extension rather than the default `@gomomento/sdk-nodejs-compression` extension.

----------------------------------------------------------------------------------------
For more info, visit our website at [https://gomomento.com](https://gomomento.com)!
