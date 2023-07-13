## About

This is an example project showing how Momento topics and secure tokens can be used within a static web application.

## Prerequisites

In order for this project to run, a Momento cache is needed, as well as a [token vending machine](https://github.com/momentohq/client-sdk-javascript/tree/main/examples/nodejs/token-vending-machine). This is just a url that can be called to vend short lived Momento auth tokens for the browser.

## Getting Started

First, install all dependencies

```
npm install
```

Then, edit the `.env.development` file with your token vending machine url and your cache name

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
