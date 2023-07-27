## About

This is an example project showing how Momento topics and secure tokens can be used within a nextjs application. A deployed example can be found [here](https://momento-nextjs-chat.vercel.app).

This example project is a browser-based chat application that allows pub/sub communication between your users via [Momento Topics](https://docs.momentohq.com/introduction/momento-topics). Each browser will need a Momento auth token in order to communicate with the Momento Topics server, and those tokens can be scoped to provide permissions to only the necessary caches and topics using the [Momento JavaScript SDK](https://github.com/momentohq/client-sdk-javascript).

A version of this project has been deployed on [Vercel](https://momento-nextjs-chat.vercel.app).

## Prerequisites

You will need a Momento auth token which you can generate in the [Momento Console](https://console.gomomento.com). Check out the [getting started](https://docs.momentohq.com/getting-started) guide for more information on obtaining a server side token.

## Getting Started

First, create a new file called `.env.local` that looks like: 

```
MOMENTO_AUTH_TOKEN=<Put your token here>
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

