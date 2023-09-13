# Using Momento Cache and Web SDK Inside a Deno Runtime

This example shows how to use Momento Cache via the Momento Web SDK inside of a [Deno](https://deno.land/) runtime.

The Web SDK supports the full Momento API (including collections like Dictionaries and SortedSets, plus the ability to publish to Momento Topics). It also has a complete TypeScript/JavaScript API that makes it simpler to write code to interact with Momento. This can save you time and effort when developing your Worker.

## Getting Started

1. [Install deno](https://deno.land/manual@v1.36.1/getting_started/installation) using your preferred method.

2. Clone this repo and navigate to the deno example directory:
  ```
  git clone https://github.com/momentohq/client-sdk-javascript.git
  cd client-sdk-javascript/examples/deno
  ```

3. Create a `.env` file and provide the name of your Momento Cache and a corresponding fine-grained access key. You can create a both a cache and an API key in the [Momento Console](https://console.gomomento.com/). Check out the [getting started](https://docs.momentohq.com/getting-started) guide for more information on creating a cache and API key.
  ```
  MOMENTO_API_KEY="<your-api-key>"
  MOMENTO_CACHE_NAME="<your-cache-name>"
  ```

4. Run the program from the terminal then checkout http://localhost:8000 in your browser:
  ```
  deno task start
  ```

## Deploying Deno

[Deno Deploy](https://deno.com/deploy) does not yet support npm specifiers so this example can't be deployed there.

You can use Deno's [other suggested methods](https://deno.land/manual@v1.36.1/advanced/deploying_deno) for deploying your runtime on the edge instead.
