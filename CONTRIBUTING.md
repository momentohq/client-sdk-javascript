# Welcome to client-sdk-nodejs contributing guide :wave:

Thank you for taking your time to contribute to our Node.js SDK!
<br/>
This guide will provide you information to start your own development and testing.
<br/>
Happy coding :dancer:
<br/>

## Requirements :coffee:

- Node version [16 or higher](https://nodejs.org/en/download/) is required
- A Momento Auth Token is required, you can generate one using the [Momento CLI](https://github.com/momentohq/momento-cli)

<br/>

## First-time setup :wrench:

```
# Install dependencies
npm install
```

<br />

## Build :computer:

```
npm run build
```

<br/>

## Linting :flashlight:

```
npm run lint
```

<br/>

## Tests :zap:

### Run unit tests

```
npm run unit-test
```

### Run integration tests

```
export TEST_AUTH_TOKEN=<YOUR_AUTH_TOKEN>
npm run integration-test
```

### Run all tests

```
export TEST_AUTH_TOKEN=<YOUR_AUTH_TOKEN>
npm run test
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
