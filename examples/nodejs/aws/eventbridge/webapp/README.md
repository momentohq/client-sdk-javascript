<img src="https://docs.momentohq.com/img/momento-logo-forest.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)


# Momento Javascript NodeJS SDK - Momento <-> Eventbridge Project Example

## About

The project demonstrates a write-through cache pattern for DynamoDB using DynamoDB Streams, AWS EventBridge and Momento.
The app can be used to create, update and delete items in a DynamoDB table and the changes will be reflected in the cache/topic in real-time.

### **Prerequisites:**

- Momento Cache: momento-eventbridge-cache. If cache does not exists, can create one using the [momento console](https://console.gomomento.com/) .
- Momento API Key, can be created using [momento console](https://console.gomomento.com/) if you haven’t already created one
- AWS Account AccessId, AWS Secret Key, AWS Region, (and AWS Session Token if you are using temporary credentials)

## Getting Started

First, edit the `.env.development` file (create one if not exists) with your momento and aws credentials:

```bash
VITE_MOMENTO_API_KEY=<YOUR_MOMENTO_API_KEY>
VITE_AWS_ACCESS_KEY_ID=<AWS_ACCESS_KEY_ID>
VITE_AWS_SECRET_ACCESS_KEY=<AWS_SECRET_ACCESS_KEY>
VITE_AWS_REGION=<YOUR_AWS_REGION>
VITE_AWS_SESSION_TOKEN=<AWS_SESSION_TOKEN> (if you are using temporary credentials)
```

Then, install all dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) with your browser to explore the demo app.

----------------------------------------------------------------------------------------
For more info, visit our website at [https://gomomento.com](https://gomomento.com)!
