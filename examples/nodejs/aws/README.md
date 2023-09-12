<head>
  <meta name="Momento Node.js Client Library Documentation" content="Node.js client software development kit for Momento Cache">
</head>
<img src="https://docs.momentohq.com/img/logo.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)

# Node.js Client SDK


## Example Requirements

- Node version 14 or higher is required
- To get started with Momento you will need a Momento API key. You can get one from the [Momento Console](https://console.gomomento.com).

To run any of the examples you will need to install the dependencies once first:

```bash
npm install
```

## Running the AWS Secrets Manager Example

This example demonstrates how to retrieve a Momento API key stored as a secret in AWS Secrets Manager and use it to create a cache.

```bash
# Run example code
MOMENTO_API_KEY=<YOUR API KEY> npm run secrets-example
```

[Example Code](doc-example-files/doc-examples-js-aws-secrets.ts)

If you have questions or need help experimenting further, please reach out to us!



