# Using Momento Inside of Fastly Compute@Edge 

This example shows how to use the Momento HTTP API inside of a [Fastly Compute@Edge](https://www.fastly.com/products/edge-compute) edge worker.

## Getting Started

1. Create a Momento cache and corresponding fine-grained access token in the [Momento Console](https://console.gomomento.com/). Check out the [getting started](https://docs.momentohq.com/getting-started) guide for more information on creating a cache and auth token.

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

5. Start a local server to check that it's running at http://127.0.0.1:7676 
  ```
  fastly compute serve
  ```

6. Then follow [instructions for deploying to Fastly](https://developer.fastly.com/learning/compute/#deploy-to-a-fastly-service):
  ```
  fastly compute deploy
  ```

  You may need to add your Fastly service ID to the `fastly.toml` file.
  If you want to see logs from your deployed worker, follow [instructions for turning on log tailing](https://developer.fastly.com/learning/compute/testing/#live-log-monitoring-in-your-console):
  ```
  fastly log-tail
  ```