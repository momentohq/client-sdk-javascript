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


## Build :computer:

The easiest way to do your initial build of all the packages is to run:

```
./scripts/build-all-packages.sh
```

From that point you can change directories into any of the `package` subdirs to work on an individual package. Take a look at the `scripts` section of the `package.json` in each package directory to see what build commands are available. They all support `npm run build` to compile the code. Most also have `npm run unit-test` and `npm run integration-test` to run the unit and integration tests, respectively.

**NOTE**: if you make changes in the `core` or `common-integration-tests` packages, you will need to build your changes before the SDK packages can pick them up. You can do this via `npm run build` in the shared package directory, or `./scripts/build-all-packages.sh` from the root dir.

### Running integration tests

In a given package directory:

```
export TEST_AUTH_TOKEN=<YOUR_AUTH_TOKEN>
npm run integration-test
```

### Run all tests

In a given package directory:

```
export TEST_AUTH_TOKEN=<YOUR_AUTH_TOKEN>
npm run test
```

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
