# Using Momento Inside a Deno Runtime

This example shows how to use Momento inside of a [Deno](https://deno.land/) runtime.

## Getting Started

1. [Install deno](https://deno.land/manual@v1.36.1/getting_started/installation) using your preferred method.

2. Clone this repo and navigate to the deno example directory:
  ```
  git clone https://github.com/momentohq/client-sdk-javascript.git
  cd client-sdk-javascript/examples/deno
  ```

3. Create a `.env` file and provide a Momento superuser token. You can create a new one in the [Momento Console](https://console.gomomento.com/) if you do not yet have one.
  ```
  MOMENTO_AUTH_TOKEN="<your-auth-token>"
  ```

4. Run the program from the terminal then checkout http://localhost:8000 in your browser:
  ```
  deno task start
  ```

## Deploying Deno

[Deno Deploy](https://deno.com/deploy) does not yet support npm specifiers so this example can't be deployed there.

You can use Deno's [other suggested methods](https://deno.land/manual@v1.36.1/advanced/deploying_deno) for deploying your runtime on the edge instead.