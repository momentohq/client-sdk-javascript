# Welcome to Momento <-> Eventbridge Integration Example Project

The project demonstrates a write-through cache pattern for DynamoDB using DynamoDB Streams, AWS EventBridge and Momento.
The app can be used to create, update and delete items in a DynamoDB table and the changes will be reflected in the cache/topic in real-time.

### **Prerequisites:**

- Momento API Key, can be created using [momento console](https://console.gomomento.com/) if you haven’t already created one
- HTTP API endpoint the same region as Momento API Key. You can copy the endpoint from the console after creating the API Key or refer to the [Regions Section here in the documentation](https://docs.momentohq.com/topics/develop/api-reference/http-api#regions)
- AWS Account AccessId and Secret Key

### **Deploying the Demo App:**

The source code for the CDK application lives in the `infrastructure` directory. To build and deploy it you will first need to install the dependencies:

```bash
cd infrastructure
npm install
```

To deploy the CDK app you will need to have [configured your AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-authentication.html#cli-chap-authentication-precedence).

You will also need a superuser API key generated from the [Momento Console](https://console.gomomento.com/), and the HTTP API endpoint URL for the region you are deploying to.


Then run:

```tsx
npm run deploy -- --parameters MomentoApiKey=<YOUR_MOMENTO_API_KEY> --parameters MomentoApiEndpoint=<YOUR_MOMENTO_API_ENDPOINT>
```

## **Running the Demo:**

First, edit the `.env.development` file with your token vending machine url and your cache name:

```bash
VITE_APP_AWS_ACCESS_KEY_ID=<AWS_ACCESS_KEY_ID>
VITE_APP_AWS_SECRET_ACCESS_KEY=<AWS_SECRET_ACCESS_KEY>
VITE_MOMENTO_API_KEY=<YOUR_MOMENTO_API_KEY>
```

Then,  install all dependencies and run the development server:

```bash
cd webapp
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173/) with your browser to explore the demo app.
