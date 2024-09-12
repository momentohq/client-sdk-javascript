{{ ossHeader }}

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

```bash
# Run example code
MOMENTO_API_KEY=<YOUR API KEY> npm run tokens
```

Example Code: [refresh-disposable-tokens.ts](refresh-disposable-tokens.ts)


If you have questions or need help experimenting further, please reach out to us!

{{ ossFooter }}
