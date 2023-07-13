# Using Momento inside a Cloudflare Worker

This example uses
[Wrangler](https://developers.cloudflare.com/workers/wrangler/) to create a
typescript worker

## How to use

1. Clone and install the example

```bash
git clone https://github.com/momentohq/client-sdk-javascript.git
cd client-sdk-javascript/examples/cloudflare-workers
npm install
```

1. Create a Momento cache inside of the [console](https://console.gomomento.com)
1. Create a [token for your cache](https://console.gomomento.com/tokens)
1. Copy the `Auth Token`, `Rest Endpoint`, and cache name to the `wranger.toml` file
1. Start the development server

```bash
npm run start
```

1. Open your browser at [localhost:8787](http://localhost:8787)

A deployed example can be found [here](https://momento-cloudflare-worker-http.mst-a09.workers.dev)