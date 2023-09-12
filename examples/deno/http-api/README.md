# Using Momento Cache and HTTP API Inside a Deno Runtime

This example shows how to use Momento Cache via the Momento HTTP API inside of a [Deno](https://deno.land/) runtime. We use the HttpClient wrapper class provided by the [momento-http-client Deno package](https://deno.land/x/momento_http) to make the API calls.

The HTTP API is lightweight in that you won't need any additional dependencies beyond what Deno requires and you can use the standard `fetch` HTTP client methods if you prefer. However, it only provides a basic subset of all of the Momento APIs, such as `get`, `set`, and `delete`, and is currently only available if you use AWS as your cloud provider.

## Getting Started

1. [Install deno](https://deno.land/manual@v1.36.1/getting_started/installation) using your preferred method.

2. Clone this repo and navigate to the deno example directory:
  ```
  git clone https://github.com/momentohq/client-sdk-javascript.git
  cd client-sdk-javascript/examples/deno
  ```

3. Create a `.env` file and provide the name of your Momento Cache, a corresponding fine-grained access key, and the HTTP endpoint associated with your key. You can create a both a cache and an API key in the [Momento Console](https://console.gomomento.com/). Check out the [getting started](https://docs.momentohq.com/getting-started) guide for more information.
  ```
  MOMENTO_API_KEY="<your-api-key>"
  MOMENTO_CACHE_NAME="<your-cache-name>"
  MOMENTO_HTTP_ENDPOINT="<your-http-endpoint>"
  ```

4. Run the program from the terminal then checkout http://localhost:8000 in your browser:
  ```
  deno task start
  ```

## Deploying Deno

We will deploy this example using [Deno Deploy](https://deno.com/deploy/docs/get-started-guide) and [`deployctl`](https://deno.com/deploy/docs/deployctl). Note: Deno Deploy does not yet support npm specifiers, but the Momento HTTP API is lightweight and does not require any external dependencies so this is not a problem.

1. [Sign up for a Deno Deploy account](https://deno.com/deploy) if you do not already have one.

2. [Create a personal access token](https://dash.deno.com/account#access-tokens) within the Deno Deploy console.

3. Create an empty project in the Deno Deploy console. On the ["Projects" page](https://dash.deno.com/projects), click on "New Project", then click on the link that says "get started with an empty project using deployctl". The project name should be a couple of strings and a number, such as "lucky-spider-92".

4. Install the `deployctl` tool:

  ```
  deno install --allow-all --no-check -r -f https://deno.land/x/deploy/deployctl.ts
  ```

  You may also need to add `deployctl` to your PATH:

  ```
  export PATH="/Users/<your-username>/.deno/bin:$PATH"
  ```

5. Provide your project name and Deno Deploy access token when deploying your project:

  ```
  deployctl deploy --project="<your-project-name>" --token="<your-deno-token>" index.ts
  ```

  This command will upload all files from your curent directory, including the `.env` file. If you prefer, you can set [environment variables](https://deno.com/deploy/docs/environment-variables) using the Deno Deploy console instead. More information about using the `deployctl` command can be found [here](https://deno.com/deploy/docs/deployctl).

  Your deployed project will be published to a URL that begins with your project name, such as [https://lucky-spider-92.deno.dev/](https://lucky-spider-92.deno.dev/). This URL can be easily shared with others to show what you've built!
