## About

This is an example project showing how Momento topics and secure tokens can be used within a nextjs application. A deployed example can be found [here](https://momento-nextjs-chat.vercel.app).

This example project is a browser-based chat application that allows pub/sub communication between your users via [Momento Topics](https://docs.momentohq.com/introduction/momento-topics). Each browser will need a Momento API key in order to communicate with the Momento Topics server, and those tokens can be scoped to provide permissions to only the necessary caches and topics using the [Momento JavaScript SDK](https://github.com/momentohq/client-sdk-javascript).

A version of this project has been deployed on [Vercel](https://momento-nextjs-chat.vercel.app).

## Prerequisites

You will need a Momento API key and a cache, both of which you can create in the [Momento Console](https://console.gomomento.com). Check out the [getting started](https://docs.momentohq.com/getting-started) guide for more information on obtaining a server side token and creating a cache.

## Getting Started

First, create a new file called `.env.local` that looks like:

```
MOMENTO_API_KEY=<Put your token here>
NEXT_PUBLIC_MOMENTO_CACHE_NAME=<Put your cache name here>
```

Second, go to the [config.ts file](./src/app/api/momento/token/config.ts) and configure the scope of permissions and the expiry duration for the tokens that the nextjs app will use to talk to the Momento service. For example, you can restrict the permissions for these browser tokens so that they have read-only access or read-write access, and you can also restrict them to specific caches or topics.

You may also configure the authentication method in the [config.ts file](./src/app/api/momento/token/config.ts) and by adding additional environment variables:

```
NEXT_PUBLIC_AUTH_METHOD=<"open" or "credentials">
MOMENTO_AUTH_USERNAME=<Choose a username>
MOMENTO_AUTH_PASSWORD=<Choose a password>
NEXTAUTH_SECRET=<Choose a random string>
```

The default setting is "open", meaning there is no authentication. An example for the "credentials" option involves a basic check of a username and password is provided in the [token/route.ts file](./src/app/api/momento/token/route.ts). Additional auth methods can be set up using a library such as [NextAuth.js](https://next-auth.js.org/).

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

