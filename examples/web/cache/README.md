<img src="https://docs.momentohq.com/img/momento-logo-forest.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)


# Momento JavaScript Web SDK - Basic Cache Examples

_Read this in other languages_: [日本語](README.ja.md)

<br>

## Example Requirements

- Node version 16 or higher is required
- A Momento API key is required, you can generate one using the [Momento CLI](https://github.com/momentohq/momento-cli)

To run any of the examples you will need to install the dependencies once first:

```bash
npm install
```

## Running the Basic Example

```bash
# Run example code
MOMENTO_API_KEY=<YOUR API KEY> npm run example
```

Example Code: [basic.ts](basic.ts)

## Running the Advanced Example

```bash
# Run example code
MOMENTO_API_KEY=<YOUR API KEY> npm run advanced
```

Example Code: [advanced.ts](advanced.ts)

## Running the Dictionary Example

This example demonstrates how to use the dictionary data type.

```bash
# Run example code
MOMENTO_API_KEY=<YOUR API KEY> npm run dictionary
```

Example Code: [dictionary.ts](dictionary.ts)

## Running the TopicClient example with auto-refreshing disposable tokens

This example implements TokenRefreshingTopicClient, an example wrapper class around the TopicClient that refreshes disposable tokens before they expire. Getting a new disposable token requires creating a new TopicClient that accepts a CredentialProvider that uses the new token. After the new TopicClient is created, existing subscriptions must be transferred to the new client. All of this occurs within the TokenRefreshingTopicClient. 

If you run the example using the `localTokenVendingMachine()` method passed to the wrapped client (this is the default for this example):

```typescript
  const wrappedTopicClient = await TokenRefreshingTopicClient.create({
    refreshBeforeExpiryMs: 10_000, // 10 seconds before token expires, refresh it.
    getDisposableToken: localTokenVendingMachine,
  });
```

Run the example using:

```bash
# Run example code
MOMENTO_API_KEY=<YOUR API KEY> npm run tokens
```

If you have deployed a token vending machine to generate disposable tokens like so:

```typescript
  const wrappedTopicClient = await TokenRefreshingTopicClient.create({
    refreshBeforeExpiryMs: 10_000, // 10 seconds before token expires, refresh it.
    getDisposableToken: tokenVendingMachine,
  });
```

Run the example using:

```bash
# Run example code
TVM_ENDPOINT=<YOUR TVM URL> npm run tokens
```

Example Code: [refresh-disposable-tokens.ts](refresh-disposable-tokens.ts)

If you have questions or need help experimenting further, please reach out to us!

----------------------------------------------------------------------------------------
For more info, visit our website at [https://gomomento.com](https://gomomento.com)!
