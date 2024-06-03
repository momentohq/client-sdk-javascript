# Welcome to Momento <-> Eventbridge Integration Example Project

The project demonstrates a write-through cache pattern for DynamoDB using DynamoDB Streams, AWS EventBridge and Momento.

### **Prerequisites:**

- Momento API Key, can be created using [momento console](https://console.gomomento.com/) if you haven’t already created one
- [Token Vending Machine](https://github.com/momentohq/client-sdk-javascript/tree/main/examples/nodejs/token-vending-machine) deployed to AWS account
- AWS Account AccessId and Secret Key

### **Deploying the Demo App:**

The source code for the CDK application lives in the `infrastructure` directory. To build and deploy it you will first need to install the dependencies:

```bash
cd infrastructure
npm install
```

To deploy the CDK app you will need to have [configured your AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-authentication.html#cli-chap-authentication-precedence).

You will also need a superuser API key generated from the [Momento Console](https://console.gomomento.com/).

Then run:

```tsx
npm run deploy -- --parameters MomentoApiKey=<YOUR_MOMENTO_API_KEY>
```

## **Running the Demo:**

First, install all dependencies:

```bash
cd webapp
npm install
```

Then, edit the `.env.development` file with your token vending machine url and your cache name:

```bash

VITE_APP_AWS_ACCESS_KEY_ID=<AWS_ACCESS_KEY_ID>
VITE_APP_AWS_SECRET_ACCESS_KEY=<AWS_SECRET_ACCESS_KEY>
VITE_TOKEN_VENDING_MACHINE_URL="https://..."
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173/) with your browser to explore the demo app.
