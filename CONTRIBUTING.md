# Welcome to client-sdk-nodejs contributing guide :wave:

Thank you for taking your time to contribute to our JavaScript SDKs!
<br/>
This guide will provide you information to start development and testing.
<br/>
Happy coding :dancer:
<br/>

## Requirements :coffee:

- Node version [16 or higher](https://nodejs.org/en/download/) is required
- A Momento API key is required. You can generate one using the [Momento Console](https://console.gomomento.com)

<br/>

## Repository Layout

This repo contains the source code for two different Momento SDKs: the Node.js SDK, and the Momento Web SDK (for use in browsers). The Node.js SDK uses the `grpc-js` library and communicates with the server via grpc. The Web SDK uses the `grpc-web` library, which requires a server that supports grpc-web. It is capable of communicating via HTTP/1.1 and works in most browsers, where we cannot establish and manage a long-lived TCP connection directly.

This repo contains four TypeScript packages, which all reside in the `packages` directory:

- `core`: contains common code that is used by both the Node.js and Web SDKs. The bulk of the code is the definition of the Momento API response types.
- `common-integration-tests`: contains source code for integration tests that can be run against both the Node.js and Web SDKs.
- `client-sdk-nodejs`: the source for the Node.js SDK. Has a dependency on `core` and `common-integration-tests`.
- `client-sdk-web`: the source code for the Web SDK. Has a dependency on `core` and `common-integration-tests`.

## Examples

All examples are in subdirectories of `examples/web` and `examples/nodejs`. We have different directories for different examples in order to keep the `package.json` files to a minimum for users who may be copying things from them. e.g., when we have examples that use CDK or the AWS SDK, we don't want users to think they need those deps for a basic momento project, so we put them in their own directory with their own package.json.

All examples specify an explicit dependency on a released version of the SDK. We use dependabot to detect when there are new SDK releases and automatically file a PR to update the examples; this ensures that our CI is testing the actual packages from npm.js.

When you are adding a new examples directory, add it to the dependabot config here:

https://github.com/momentohq/client-sdk-javascript/blob/c906f5c31b81d01696f8c162477976dd64201081/.github/dependabot.yml#L8-L48

We also run basic CI against the examples when PRs are submitted. When you are adding a new examples directory, add it to the PR checks here:

https://github.com/momentohq/client-sdk-javascript/blob/c906f5c31b81d01696f8c162477976dd64201081/.github/workflows/build.yml#L105-L126

## Build :computer:

The easiest way to do your initial build of all the packages is to run:

```
./scripts/build-all-packages.sh
```

From that point you can change directories into any of the `package` subdirs to work on an individual package. Take a look at the `scripts` section of the `package.json` in each package directory to see what build commands are available. They all support `npm run build` to compile the code.

## Running tests

Most packages.json files have script targets like `unit-test` and `integration-test` that show how the tests will get run in CI. You can use these as an example to set up a command to run the tests you want to run locally. Most will require a little tweaking in order to run just the things you're interested in and deal with other constraints.

For example, you will probably need to limit Jest `maxWorkers` to avoid throttling errors due to concurrency, and you will want to skip the auth tests unless you have a session token, etc. So here is an example command you might use to run all the integration tests other than the auth tests:

```
MOMENTO_API_KEY=<your_api_key_here> npx jest integration --maxWorkers 1 --testPathIgnorePatterns auth-client-test.ts
```

Or, if you only want to run the dictionary tests:

```
MOMENTO_API_KEY=<your_api_key_here> npx jest dictionary
```

**NOTE**: if you make changes in the `core` or `common-integration-tests` packages, you will need to build your changes before the SDK packages can pick them up. You can do this via `npm run build` in the shared package directory, or `./scripts/build-all-packages.sh` from the root dir.

### Run auth integration tests

In either the `client-sdk-nodejs` or `client-sdk-web` directories:

```
export MOMENTO_API_KEY=<YOUR_API_KEY>
export TEST_SESSION_TOKEN=<YOUR_SESSION_TOKEN>
npm run integration-test-auth
```

### Limit the test concurrency

By default, jest runs tests concurrently. Sometimes if you allow too many tests to run concurrently you
will hit Momento throttling limits.  To limit the concurrency to ensure you don't hit throttling limits,
you can use jest's `--maxWorkers` flag:

```
export MOMENTO_API_KEY=<YOUR_API_KEY>
npx jest --maxWorkers 1
```

### Build integration tests as part of test run, pass args to jest

If you make changes to `common-integration-tests` you will need to rebuild them before you try to
run them from the `client-sdk-nodejs` or `client-sdk-web` packages.  We provide an npm script
`build-and-run-tests` that can be used for this, during development.  You can also pass a pattern
to jest in order to limit the set of tests that you want to run.

e.g. to re-build and run the integration tests, and filter to only the dictionary tests:

```
export MOMENTO_API_KEY=<YOUR_API_KEY>
npm run build-and-run-tests -- dictionary
```

## Testing local changes to the NodeJS SDK

There are cases where you might want to run the examples with changes that you made to the SDK. One common use-case is
running the [load generator](examples/nodejs/load-gen) for any new configurations, interceptors, or other network related
changes.

### Laptop/VM

To test any existing or new example from your Laptop or a virtual machine, go to the example directory where it's `package.json` resides
and install the local version of your SDK through `npm`. For instance, if you want to run the basic example with your changes to the SDK,
the commands will look like:

```bash
./scripts/build-nodejs-sdk.sh
cd examples/nodejs/cache
npm install ../../../packages/client-sdk-nodejs
```

Notice that the `package.json` file in the `cache` directory now would link `@gomomento/sdk` dependency to the local
version in the filesystem:

`"@gomomento/sdk": "file:../../../packages/client-sdk-nodejs"`

Running the examples after this will pick up the local changes made to the SDK. Note that you have to build the SDK each
time you make a change through `./scripts/build-nodejs-sdk.sh`. If you have not made changes to `packages/core` or
`packages/common-integration-tests` (local dependencies of the SDK), you can save some time building only the SDK through
`./scripts/build-package.sh "client-sdk-nodejs"`.


### AWS Lambda

To run any existing or new example with your local changes to the SDK on an AWS Lambda environment, we need to follow some
extra steps. AWS Lambda deployment will fail if we try to follow the same approach as we did on Laptop/VM above. Hence, we
need to create a tarball of the SDK and point the examples to the tarball as the dependency instead of the SDK directory,
or it's `npmjs` version.

Since the `packages/client-sdk-nodejs` package takes a local dependency on `packages/core`, directly
pointing the tarball for the SDK fails as well. In theory, creating a tarball of the `packages/core` package and using that for the SDK
dependency, and then using the SDK dependency tarball for the examples dependency should work, but it doesn't as the Lambda
build gets resolution errors.

The steps that worked for one of the contributors was to remove the local `packages/core` directory altogether and use
the `@gomomento/sdk-core` live `npmjs` [version](https://www.npmjs.com/package/@gomomento/sdk-core) instead.
For instance, if you want to deploy the lambda `examples/nodejs/lambda-examples/simple-get` to your AWS account with your
local changes to the SDK, the steps will look like:

1. `rm -rf packages/core` Remove local core directory
2. `cd packages/common-integration-tests` - Since this package also takes a local dependency on core, we need to do some
   steps here as well.
3. Update `package.json` `dependencies` section for `@gomomento/sdk-core` to `1.31.0` (or the latest version available at
   [npmjs](https://www.npmjs.com/package/@gomomento/sdk-core) or what your IDE suggests.)
   `"@gomomento/sdk-core": "1.31.0"`
4. `npm install`
5. `../../scripts/build-package-lambda.sh "common-integration-tests"`
6. `cd ../client-sdk-nodejs` - Now we will repeat the same steps for the SDK package
7. Update `package.json` `dependencies` section for `@gomomento/sdk-core` to `1.31.0` (or the latest version available at
   [npmjs](https://www.npmjs.com/package/@gomomento/sdk-core) or what your IDE suggests.)
   `"@gomomento/sdk-core": "1.31.0",`
8. `npm install`
9. `../../scripts/build-package-lambda.sh "client-sdk-nodejs"`
10. `npm pack` - This will create the required tarball for AWS Lambda to successfully deploy our local changes to the SDK,
    and you should see a file called `gomomento-sdk-0.0.1.tgz` created in the current `packages/client-sdk-nodejs` directory
11. `cd ../../examples/nodejs/lambda-examples/simple-get/lambda/simple-get` - Now we go to our lambda example directory which
    has its own `package.json` and update the SDK dependency to the local tarball
  - `npm install ../../../../../../packages/client-sdk-nodejs/gomomento-sdk-0.0.1.tgz`
12. Follow steps to deploy your lambda detailed on the [README](examples/nodejs/lambda-examples/simple-get) for that example.

Note that you need to follow steps 9, 10, and 12 again for any further changes to the SDK after this deployment.
