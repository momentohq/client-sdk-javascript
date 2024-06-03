<img src="https://docs.momentohq.com/img/momento-logo-forest.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-stable.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)


# Momento Javascript NodeJS SDK - Momento <-> Eventbridge Project Example

## About
The project demonstrates a write-through cache pattern for DynamoDB using DynamoDB Streams, AWS EventBridge and Momento.

### **Prerequisites:**
- Momento API Key, can be created using [momento console](https://console.gomomento.com/) if you haven’t already created one
- AWS Account AccessId and Secret Key

## Getting Started
First, edit the `.env.development` file (create one if not exists) with your token vending machine url and your aws credentials:

```bash
VITE_AWS_ACCESS_KEY_ID=<AWS_ACCESS_KEY_ID>
VITE_AWS_SECRET_ACCESS_KEY=<AWS_SECRET_ACCESS_KEY>
VITE_MOMENTO_API_KEY=<YOUR_MOMENTO_API_KEY>
```

Then, install all dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) with your browser to explore the demo app.
