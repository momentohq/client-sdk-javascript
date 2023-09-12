# Using Momento Inside of Fastly Compute@Edge

This example shows how to use the Momento HTTP API inside of a [Fastly Compute@Edge](https://www.fastly.com/products/edge-compute) edge worker.

## Getting Started

1. Create a Momento cache and corresponding fine-grained access token in the [Momento Console](https://console.gomomento.com/). Check out the [getting started](https://docs.momentohq.com/getting-started) guide for more information on creating a cache and API key.

2. Sign into the [Fastly console](https://manage.fastly.com/account/company) and [create a user API token](https://docs.fastly.com/en/guides/using-api-tokens#creating-api-tokens). Make sure to copy it for the next step.

3. [Install the Fastly CLI](https://developer.fastly.com/learning/compute/#install-the-fastly-cli) and follow instructions for providing the API token you just created:
  ```
  brew install fastly/tap/fastly
  fastly profile create
  ```

4. Clone this repo, navigate to the fastly example directory, and install dependencies:
  ```
  git clone https://github.com/momentohq/client-sdk-javascript.git
  cd client-sdk-javascript/examples/fastly-compute
  npm install
  ```

5. Create a `secrets.json` file with the following contents:
  ```
  {
      "MOMENTO_HTTP_ENDPOINT": "api.cache.cell-4-us-west-2-1.prod.a.momentohq.com",
      "MOMENTO_BACKEND": "aws_us_west_2_http",
      "MOMENTO_CACHE": "<YOUR-CACHE>",
      "MOMENTO_API_KEY": "<ADD-YOUR-API-KEY-WITH-RW-ACCESS-TO-THE-CACHE>
  }
  ```

  You can change the name of your backend ("MOMENTO_BACKEND" variable) to anything you want, just make sure your HTTP endpoint corresponds to the region that your cache is in. You will also want to make sure the contents of your `secrets.json` file match what's under the `local` and `setup` headers in the `fastly.toml` file.

  More information about the `fastly.toml` can be [found here](https://developer.fastly.com/reference/compute/fastly-toml/).

  **Note**: for production environments, the Momento API key should be saved in a [Fastly Secret Store](https://developer.fastly.com/reference/api/services/resources/secret-store/). However, this is a feature currently restricted to beta users, so this example saves the API key in a [Config Store](https://developer.fastly.com/reference/api/services/resources/config-store/) instead.

6. Start a local server to check that it's running at http://127.0.0.1:7676
  ```
  fastly compute serve
  ```

  The localhost server will use the information supplied under the `local` heading of your `fastly.toml` file to set up the appropriate backend and config store.

7. Deploy the service to Fastly, making sure to enter "yes" and/or "enter" for each command line prompt:
  ```
  fastly compute publish
  ```

  Fastly will use the information supplied under the `setup` heading of your `fastly.toml` file to set up the appropriate backend and config store.
  More information about deploying to Fastly can be [found here](https://developer.fastly.com/learning/compute/#deploy-to-a-fastly-service):


8. If you want to see logs from your deployed worker, run this:
  ```
  fastly log-tail
  ```

  More information about logging and monitoring your Fastly instance can be [found here](https://developer.fastly.com/learning/compute/testing/#live-log-monitoring-in-your-console).
