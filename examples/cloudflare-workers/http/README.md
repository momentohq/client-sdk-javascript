# Using Momento inside a Cloudflare Worker

This example uses
[Wrangler](https://developers.cloudflare.com/workers/wrangler/) to create a
typescript worker

## How to use

1. Clone and install the example:

```bash
git clone https://github.com/momentohq/client-sdk-javascript.git
cd client-sdk-javascript/examples/cloudflare-workers/http
npm install
```

1. Create a cache inside of the [Momento console](https://console.gomomento.com/caches). Note that the Momento Cache HTTP API required for Cloudflare support is currently only available in AWS. Make note of the region you created your cache in, as you'll need it for the next step.
1. Generate a [token for your cache](https://console.gomomento.com/tokens), making sure to choose the same AWS region you used to create the cache. You'll want to use a `Fine-Grained Access Token` with read/write permissions for the cache you created.
   ![Console Token Screen](https://assets.website-files.com/628fadb065a50abf13a11485/64b97cb50a7e1d8d752ae539_3fU8mYh6gAhMwUYzrLOEiEXQc-KO79zANMtiH141Js2tZydZ7sFxZtr5TWLcC3OzFJTIEMZQOkLtWtBOOTEOEXmpinv1Ah3AC_LdkovI3FU7iUGY_N35cB0op1PXTNHAW0kZ-9wZ6qrCol5wrz_nuA.png)
1. Copy the `Auth Token` and `HTTP Endpoint` values from the token generation screen for use in the next two steps.
   ![Token generation results](https://assets.website-files.com/628fadb065a50abf13a11485/64b97cb50d9a0db6b03c40e8_JZLnsjtwN5RaGx83NX424WKmvauAuqcUD3YeWLx2LFFIwLiXHupq1XF3MOyggObfaC8LE1fQUN4b-9nDTOwGYUHugfZYqYTK92HybD2X1OsuRF-DxmJKekTWgV0SY0LzWpE9vvA0To8sGmNXkG-geQ.png)
1. Cloudflare uses a file called wrangler.toml to configure the development and publishing of a worker. More information about Cloudflare configuration can be found [on their website](https://developers.cloudflare.com/workers/wrangler/configuration/). In the example directory, update the `wrangler.toml` file with the cache name and HTTP endpoint as they appeared in the Momento Console.
1. Update the `.dev.vars` file in the example directory with the Momento auth token. Since this is a secret token, we don’t store it as an environment variable, instead storing it as a Cloudflare secret.
1. Start the development server:

```bash
npm run start
```

7. Open your browser to [localhost:8787](http://localhost:8787). The code in this example sets an item in the cache, gets it, and returns it as a JSON object:
   ```
    // setting a value into cache
    const setResp = await client.set(cache, key, value);
    console.log("setResp", setResp);

    // getting a value from cache
    const getResp = await client.get(cache, key)
    console.log("getResp", getResp);

    return new Response(JSON.stringify({ response: getResp }));
    ```

A deployed example can be found [here](https://momento-cloudflare-worker-http.mst-a09.workers.dev).

If you would like to deploy this example to your own Cloudflare worker, make sure you add the MOMENTO_AUTH_TOKEN as a secret inside of your Cloudflare account:

```shell

npx wrangler secret put MOMENTO_AUTH_TOKEN
> Enter a secret value: **************************
> 🌀 Creating the secret for the Worker "momento-cloudflare-worker-http"
> ✨ Success! Uploaded secret MOMENTO_AUTH_TOKEN
```

Then you can run `npm run deploy`. You will be prompted for a Cloudflare login before deploying to your Cloudflare account.
