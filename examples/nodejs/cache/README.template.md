{{ ossHeader }}

# Node.js Client SDK - Basic cache Examples

_Read this in other languages_: [日本語](README.ja.md)

<br>

## Example Requirements

- Node version 16 or higher is required
- To get started with Momento you will need a Momento API key. You can get one from the [Momento Console](https://console.gomomento.com).

To run any of the examples you will need to install the dependencies once first:

```bash
npm install
```

## Running the Basic Example

This example demonstrates a basic set and get from a cache.

```bash
# Run example code
MOMENTO_API_KEY=<YOUR API KEY> npm run basic
```

Example Code: [basic.ts](basic.ts)

## Running the Advanced Example

This example demonstrates several slightly more advanced concepts, including:

- creating and listing caches
- deleting a key
- issuing multiple concurrent get requests
- using the Middleware API to wrap requests

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

## Running the BatchUtils Example

This example demonstrates how to use the `batchSet`, `batchGet`, and `batchDelete` functions.

```bash
# Run example code
MOMENTO_API_KEY=<YOUR API KEY> npm run batchutils
```

## Running the Leaderboard Example

This example demonstrates how to use the Leaderboard functions.

```bash
# Run example code
MOMENTO_API_KEY=<YOUR API KEY> npm run leaderboard
```

If you have questions or need help experimenting further, please reach out to us!

{{ ossFooter }}
