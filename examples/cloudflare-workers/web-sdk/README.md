# Using Momento inside a Cloudflare Worker through the Web SDK

This example uses
[Wrangler](https://developers.cloudflare.com/workers/wrangler/) to create a
typescript worker and interacts with Momento using its Web SDK.

The Web SDK is heavier-weight than using Momento's HTTP API; you need to add a dependency on the SDK.
However, it supports the full Momento API (including collections like Dictionaries and SortedSets, plus the ability to publish to Momento Topics).
It also has a complete TypeScript/JavaScript API that makes it simpler to write code to interact with Momento. This can save you time
and effort when developing your Worker.

To use Momento's HTTP API instead, click [here](../http-api)

## How to use

- First, clone the example and install its dependencies:

```bash
git clone https://github.com/momentohq/client-sdk-javascript.git
cd client-sdk-javascript/examples/cloudflare-workers/web-sdk
npm install
```

- Next, if you don't have one already, create a cache inside the [Momento console](https://console.gomomento.com/caches).


### Setting up Momento Authentication
- In the Momento console, generate an [API key for your cache](https://console.gomomento.com/tokens), making sure to choose the same AWS region you used to create the cache. You'll want to use a `Fine-Grained Access Key` with read/write permissions for the cache you created.
   ![Console API Key Screen](https://assets.website-files.com/628fadb065a50abf13a11485/64b97cb50a7e1d8d752ae539_3fU8mYh6gAhMwUYzrLOEiEXQc-KO79zANMtiH141Js2tZydZ7sFxZtr5TWLcC3OzFJTIEMZQOkLtWtBOOTEOEXmpinv1Ah3AC_LdkovI3FU7iUGY_N35cB0op1PXTNHAW0kZ-9wZ6qrCol5wrz_nuA.png)
- Copy the `API key` value from the API key generation screen for use in the next two steps.
   ![API Key generation results](https://assets.website-files.com/628fadb065a50abf13a11485/64b97cb50d9a0db6b03c40e8_JZLnsjtwN5RaGx83NX424WKmvauAuqcUD3YeWLx2LFFIwLiXHupq1XF3MOyggObfaC8LE1fQUN4b-9nDTOwGYUHugfZYqYTK92HybD2X1OsuRF-DxmJKekTWgV0SY0LzWpE9vvA0To8sGmNXkG-geQ.png)
- Update the `.dev.vars` file in the example directory with the Momento API key. Since this is a secret key, we don’t store it as an environment variable, instead storing it as a Cloudflare secret.
- Cloudflare uses a file called wrangler.toml to configure the development and publishing of a worker. More information about Cloudflare configuration can be found [on their website](https://developers.cloudflare.com/workers/wrangler/configuration/). In the example directory, update the `wrangler.toml` file and set the `MOMENTO_CACHE` environment variable to match the name of the cache you created earlier. Note that we need to explicitly uncomment the below 2 lines by removing the `#` sign and with the updated data.
```bash
[vars]
MOMENTO_CACHE_NAME = "myCache"
```
- Start the development server:

### Running locally

```bash
npm run start
```

- Open your browser to [localhost:8787](http://localhost:8787). The code in this example sets an item in the cache, gets it, and returns it as a JSON object:
   ```
    // setting a value into cache
    await client.set(cache, key, value);

    // getting a value from cache
    const getResponse = await client.get(cache, key)

		return new Response(JSON.stringify({ response: getResponse.toString() }));
    ```

A deployed example can be found [here](https://momento-cloudflare-worker-web.pratik-37c.workers.dev/).

### Deploying to CloudFlare

If you would like to deploy this example to your own Cloudflare worker, make sure you add the MOMENTO_API_KEY as a secret inside your Cloudflare account:

```shell

npx wrangler secret put MOMENTO_API_KEY
> Enter a secret value: **************************
> 🌀 Creating the secret for the Worker "momento-cloudflare-worker-web"
> ✨ Success! Uploaded secret MOMENTO_API_KEY
```

Then you can run `npm run deploy`. You will be prompted for a Cloudflare login before deploying to your Cloudflare account.
