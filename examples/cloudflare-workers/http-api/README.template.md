# Using Momento inside a Cloudflare Worker through the HTTP API

This example uses
[Wrangler](https://developers.cloudflare.com/workers/wrangler/) to create a
typescript worker and interacts with Momento using its HTTP API.

The HTTP APIs is lighter-weight than the Web SDK; you don't need to add any dependencies, you can just use the standard `fetch` HTTP
client methods. However, it only provides a basic subset of all of the Momento APIs, such as `get`, `set`, and `delete`.

To use Momento's Web SDK instead, click [here](../web-sdk).

## How to use

1. Clone and install the example:

```bash
git clone https://github.com/momentohq/client-sdk-javascript.git
cd client-sdk-javascript/examples/cloudflare-workers/http-api
npm install
```

1. Create a cache inside of the [Momento console](https://console.gomomento.com/caches). Note that the Momento Cache HTTP API required for Cloudflare support is currently only available in AWS. Make note of the region you created your cache in, as you'll need it for the next step.
1. Generate an [API key for your cache](https://console.gomomento.com/tokens), making sure to choose the same AWS region you used to create the cache. You'll want to use a `Fine-Grained Access Key` with read/write permissions for the cache you created.
   ![Console API Key Screen](https://assets.website-files.com/628fadb065a50abf13a11485/64b97cb50a7e1d8d752ae539_3fU8mYh6gAhMwUYzrLOEiEXQc-KO79zANMtiH141Js2tZydZ7sFxZtr5TWLcC3OzFJTIEMZQOkLtWtBOOTEOEXmpinv1Ah3AC_LdkovI3FU7iUGY_N35cB0op1PXTNHAW0kZ-9wZ6qrCol5wrz_nuA.png)
1. Copy the `API key` and `HTTP Endpoint` values from the API key generation screen for use in the next two steps.
   ![API key generation results](https://assets.website-files.com/628fadb065a50abf13a11485/64b97cb50d9a0db6b03c40e8_JZLnsjtwN5RaGx83NX424WKmvauAuqcUD3YeWLx2LFFIwLiXHupq1XF3MOyggObfaC8LE1fQUN4b-9nDTOwGYUHugfZYqYTK92HybD2X1OsuRF-DxmJKekTWgV0SY0LzWpE9vvA0To8sGmNXkG-geQ.png)
1. Cloudflare uses a file called wrangler.toml to configure the development and publishing of a worker. More information about Cloudflare configuration can be found [on their website](https://developers.cloudflare.com/workers/wrangler/configuration/). In the example directory, update the `wrangler.toml` file with the cache name and HTTP endpoint as they appeared in the Momento Console. Note that we need to explicitly uncomment the below 3 lines by removing the `#` sign and with the updated data.
```bash
[vars]
MOMENTO_HTTP_ENDPOINT = "myEndpoint"
MOMENTO_CACHE_NAME =  "myCache"
```
1. Update the `.dev.vars` file in the example directory with the Momento API key. Since this is a secret key, we don’t store it as an environment variable, instead storing it as a Cloudflare secret.
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

If you would like to deploy this example to your own Cloudflare worker, make sure you add the MOMENTO_API_KEY as a secret inside of your Cloudflare account:

```shell

npx wrangler secret put MOMENTO_API_KEY
> Enter a secret value: **************************
> 🌀 Creating the secret for the Worker "momento-cloudflare-worker-http"
> ✨ Success! Uploaded secret MOMENTO_API_KEY
```

Then you can run `npm run deploy`. You will be prompted for a Cloudflare login before deploying to your Cloudflare account.
