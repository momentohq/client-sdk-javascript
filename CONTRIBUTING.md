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
npm run test
```

### Run integration tests

```
export TEST_AUTH_TOKEN=<YOUR_AUTH_TOKEN>
npm run integration
```
