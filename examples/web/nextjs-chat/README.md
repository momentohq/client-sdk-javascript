## About

This is an example project showing how Momento topics and secure tokens can be used within a nextjs application. A deployed example can be found [here](https://momento-nextjs-chat.vercel.app).

## Prerequisites

In order for this project to run, a Momento auth token is required. Check out the [getting started](https://docs.momentohq.com/getting-started) guide for more information on obtaining a server side token.

## Getting Started

First, create a new file called `.env.local` that looks like 

```
MOMENTO_AUTH_TOKEN=<Put your token here>
```

Second, go to the [config.ts file](./src/app/api/momento/token/config.ts) and configure the scope of permissions and the expiry duration for the tokens that the nextjs app will use to talk to the Momento service. 

For example, you can restrict the permissions for these browser tokens so that they have read-only access or read-write access, and you can also restrict them to specific caches or topics.

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

