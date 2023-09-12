<head>
  <meta name="Momento Node.js Client Library Documentation" content="Node.js client software development kit for Momento Cache">
</head>
<img src="https://docs.momentohq.com/img/logo.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)

# Node.js Client SDK

_Read this in other languages_: [日本語](README.ja.md)

<br>

## Example Requirements

- Node version 14 or higher is required
- To get started with Momento you will need a Momento API key. You can get one from the [Momento Console](https://console.gomomento.com).

This directory contains a project that illustrates how to use Momento topics (aka PubSub).

To run the examples you will need to install the dependencies once first:

```bash
npm install
```

## Running the Pubsub Example

This example demonstrates how to subscribe to a topic and publish values to it.

In one terminal, subscribe to a topic on a cache:

```bash
MOMENTO_API_KEY=<YOUR API KEY> npm run topic-subscribe <cache-name> <topic-name>
```

Then in another terminal, publish a value to the topic:

```bash
MOMENTO_API_KEY=<YOUR API KEY> npm run topic-publish <cache-name> <topic-name> <value>
```

Note that you do not need to create the cache before running the examples; the examples take care of that. Also note the service creates a topic automatically.

As an example:

```bash
# in the first terminal
MOMENTO_API_KEY=<YOUR API KEY> npm run topic-subscribe my-cache dogs
# in another terminal
MOMENTO_API_KEY=<YOUR API KEY> npm run topic-publish my-cache dogs poodle
# "poodle" should soon appear on the first terminal
```

If you have questions or need help experimenting further, please reach out to us!



