{{ ossHeader }}

# Momento Node.js SDK - AWS Lambda Advanced (`zstd`) Compression Example

## What's this example all about?

Enabling compression in the Momento SDK can result in significant reductions in bandwidth consumption and costs, if your
cache values are, for example, large text strings (such as JSON objects). The default Momento compression extensions
library (`@gomomento/sdk-nodejs-compression`) uses the `zlib` library, which is built-in to the Node.js standard library,
so it doesn't require any special packaging considerations when running in a lambda environment.

For advanced use cases, the `@gomomento/sdk-nodejs-compression-zstd` library offers support for compression via `zstd`,
which can offer some amount of performance benefits for especially large payloads (100kb or more). However, this extension
relies on a native binary that must match the architecture of your target deployment environment, so it requires some
special packaging considerations.

Unless you are certain that the extra performance is important, we recommend that you stick with the simpler
`@gomomento/sdk-nodejs-compression` package. For advanced use cases, this directory contains an example of how to deploy
the `@gomomento/sdk-nodejs-compression-zstd` dependency in your lambda.

**NOTE: this binary will increase the size of your deployed lambda by approximately 1MB.**

## Packaging Notes

### `package.json`: Specifying the dependency for the target platform

The key to successfully packaging your lambda when using `@gomomento/sdk-nodejs-compression-zstd` is to make sure that you
package the appropriate native `zstd` binary for your target environment. This example project targets a Linux, x64 Lambda
runtime, but assumes that you may be building / deploying the code from MacOS or another non-linux platform.

The `zstd` binaries are installed into the `node_modules` directory by `npm`. By default, `npm` will only install the appropriate
binary for the platform that you are running the build from. When developing locally, running `npm install` will do the right thing,
but the lambda runtime is a different platform, so you need to ensure that the correct binary is included in the final package.

Though not recommended for the normal development process, you may run `npm install --platform=linux --arch=x64`. This will
install the correct binary for the lambda runtime. However, we recommend using a docker build to isolate the production
build from your development environment (see [Building the Example](#building-the-example) below).

### `esbuild.ts`: Special handling for `.node` files

This project uses `esbuild` to create the final files that we will deploy to the lambda. `npm` installs the native binaries
into the `node_modules` with a file extension of `.node`, and by default, `esbuild` will not include these files in the
build output. Therefore we need to configure `esbuild` to include these files.

For example code on how to achieve this, see the `esbuild.ts` file. If you are using another build system besides esbuild,
you will need to take similar steps to ensure that the `.node` files are included and accessible in your final lambda package.

### `postbuild.ts`: Building the final `.zip` artifact

This script is responsible for creating the final `.zip` artifact that we will deploy to the lambda. It processes the
`dist` directory created by `esbuild` and ensures that all the required files are present, and then produces the `.zip`.

## Building the Example

### Production Build

To build the code and package the lambda .zip artifact, run:

```bash
npm run build:aws
```

**Note: this depends on docker to build the lambda package. See the script in [package.json](package.json) for details.**

At this point, you should have a `function.zip` file that contains the esbuild output and the linux x64 `zstd` binary.

### Local Development

In order to do local development, run:

```bash
npm run build
```

This will build the code and package but using a `node` binary that is appropriate for your local development environment.

## Deploy via AWS SAM

**NOTE: in this example project, we have the SAM `SkipBuild` metadata set to `True`, which means that the `sam build` command
will just use our `function.zip` file and create the template; it will not try to build the nodejs code itself. This is necessary
because we need to pass the `--force` flag to `npm install` when building the code, and SAM does not currently support this.**

See the `template.yaml` file to see how this `sam` project is setting up the lambda function. Note that the architecture
is set to `x86_64` (which matches our `zstd` binary dependency in `package.json`), and the runtime is set to `nodejs20.x`

Here are the commands you need to run to deploy the lambda via SAM:

```bash
sam build
sam deploy --stack-name <YOUR PREFERRED STACK NAME HERE> \
           --resolve-s3 \
           --capabilities CAPABILITY_IAM \
           --parameter-overrides MomentoApiKey=<YOUR MOMENTO API KEY HERE>
```

**NOTE: in this example we are passing the `MomentoApiKey` parameter to `sam` as a plain-text Parameter. This is not recommended
for production use cases; you should use AWS Secrets Manager or another secure way of storing your key.**

If you are running the `sam build` and `sam deploy` commands from the same target architecture that you are using for the
lambda, then you won't need the `--force` flag, so you can allow SAM to manage the `esbuild` step for you. To do that you
could modify the `template.yml` file to set `CodeUri` to `./src/index.ts`, and include this build metadata:

```yaml
Metadata:
  SkipBuild: True
  BuildMethod: esbuild
  BuildProperties:
    UseNpmCi: true
    Minify: false
    Target: "es2020"
    Sourcemap: true
    Loader:
      - ".node=copy"
    EntryPoints:
      - src/index.ts
```

### Deploy Via AWS CLI

To deploy via the AWS CLI, you will first need to create the Lambda function. The easiest way to do this is in the
AWS Console. **Make sure you choose the `NodeJS 20` runtime and the `x86_64` architecture.**

You will also need to set the `MOMENTO_API_KEY` environment variable for the function. You can do this through the Configuration
tab in the AWS Console.

Once you have created your lambda function, you can deploy the code to it with this command:

```bash
aws lambda update-function-code --function-name <YOUR FUNCTION NAME HERE> --zip-file fileb://function.zip
```

And then you can invoke it with this command:

```bash
aws lambda invoke --function-name <YOUR FUNCTION NAME HERE> --log-type Tail result.json | jq -r .LogResult | base64 -d
```

{{ ossFooter }}
