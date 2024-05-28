{{ ossHeader }}

# Momento Node.js SDK - AWS Secrets Manager Example

This example demonstrates how to retrieve a Momento API key stored as a secret in AWS Secrets Manager and use it to create a cache.

## Example Requirements

- Node version 16 or higher is required
- To get started with Momento you will need a Momento API key. You can get one from the [Momento Console](https://console.gomomento.com).

To run any of the examples you will need to install the dependencies once first:

```bash
npm install
```

## Running the AWS Secrets Manager Example

```bash
# Run example code
MOMENTO_API_KEY=<YOUR API KEY> npm run secrets-example
```

[Example Code](doc-example-files/doc-examples-js-aws-secrets.ts)

If you have questions or need help experimenting further, please reach out to us!

{{ ossFooter }}
