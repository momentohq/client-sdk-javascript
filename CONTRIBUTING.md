# Welcome to client-sdk-nodejs contributing guide :wave:

Thank you for taking your time to contribute to our JavaScript SDKs!
<br/>
This guide will provide you information to start your own development and testing.
<br/>
Happy coding :dancer:
<br/>

## Requirements :coffee:

- Node version [16 or higher](https://nodejs.org/en/download/) is required
- A Momento Auth Token is required, you can generate one using the [Momento Console](https://console.gomomento.com)

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

For example you will probably need to limit Jest `maxWorkers` to avoid throttling errors due to concurrency, and you will want to skip the auth tests unless you have a session token, etc. So here is an example command you might use to run all of the integration tests other than the auth tests:

```
TEST_AUTH_TOKEN=<your_token_here> npx jest integration --maxWorkers 1 --testPathIgnorePatterns auth-client-test.ts
```

Or, if you only want to run the dictionary tests:

```
TEST_AUTH_TOKEN=<your_token_here> npx jest dictionary
```

**NOTE**: if you make changes in the `core` or `common-integration-tests` packages, you will need to build your changes before the SDK packages can pick them up. You can do this via `npm run build` in the shared package directory, or `./scripts/build-all-packages.sh` from the root dir.

### Run auth integration tests

In either the `client-sdk-nodejs` or `client-sdk-web` directories:

```
export TEST_AUTH_TOKEN=<YOUR_AUTH_TOKEN>
export TEST_SESSION_TOKEN=<YOUR_SESSION_TOKEN>
npm run integration-test-auth
```

### Limit the test concurrency

By default, jest runs tests concurrently. Sometimes if you allow too many tests to run concurrently you
will hit Momento throttling limits.  To limit the concurrency to ensure you don't hit throttling limits,
you can use jest's `--maxWorkers` flag:

```
export TEST_AUTH_TOKEN=<YOUR_AUTH_TOKEN>
npx jest --maxWorkers 1
```

### Build integration tests as part of test run, pass args to jest

If you make changes to `common-integration-tests` you will need to rebuild them before you try to
run them from the `client-sdk-nodejs` or `client-sdk-web` packages.  We provide an npm script
`build-and-run-tests` that can be used for this, during development.  You can also pass a pattern
to jest in order to limit the set of tests that you want to run.

e.g. to re-build and run the integration tests, and filter to only the dictionary tests:

```
export TEST_AUTH_TOKEN=<YOUR_AUTH_TOKEN>
npm run build-and-run-tests -- dictionary
```
