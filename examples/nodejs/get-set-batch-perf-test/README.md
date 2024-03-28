<head>
  <meta name="Momento Node.js Client Library Documentation" content="Node.js client software development kit for Momento Cache">
</head>
<img src="https://docs.momentohq.com/img/logo.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)

# Node.js Client SDK

_Read this in other languages_: [日本語](README.ja.md)

<br>

This directory contains example code illustrating how to generate load against Momento.
It also includes an example that shows how request coalescing can reduce latencies and
improve throughput for workloads that it is suitable for.

## Example Requirements

- Node version 14 or higher is required
- To get started with Momento you will need a Momento API key. You can get one from the [Momento Console](https://console.gomomento.com).

To run any of the examples you will need to install the dependencies once first:

```bash
npm install
```

## Running the get-set-batch-perf-test example

```bash
# Run example load generator
MOMENTO_API_KEY=<YOUR API KEY> npm run start-test
```

You can check out the example code in [perf-test.ts](get-set-batch-perf-test.ts). The configurable
settings are at the bottom of the file.

If you have questions or need help experimenting further, please reach out to us!



