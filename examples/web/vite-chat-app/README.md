## About

This example project is a browser-based chat application that allows pub/sub communication between your users via [Momento Topics](https://docs.momentohq.com/introduction/momento-topics). Each browser will need a Momento auth token in order to communicate with the Momento Topics server, and Momento's [Token Vending Machine application](https://github.com/momentohq/client-sdk-javascript/tree/main/examples/nodejs/token-vending-machine) can provide those tokens, which can be scoped to provide permissions to only the necessary caches and topics.

## Prerequisites

In order for this project to run, you will need:

- A deployed [Token Vending Machine](https://github.com/momentohq/client-sdk-javascript/tree/main/examples/nodejs/token-vending-machine).
- A Momento cache, which you can create in the [Momento Console](https://console.gomomento.com). Check out the [getting started](https://docs.momentohq.com/getting-started) guide for more information on creating a cache.

## Getting Started

First, install all dependencies:

```
npm install
```

Then, edit the `.env.development` file with your token vending machine url and your cache name:

```
VITE_TOKEN_VENDING_MACHINE_URL="https://..."
VITE_MOMENTO_CACHE_NAME="my-cache"
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) with your browser to see the result.
