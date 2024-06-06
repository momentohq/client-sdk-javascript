# Welcome to Momento <-> Eventbridge Integration Example Project

The project demonstrates a write-through cache pattern for DynamoDB using DynamoDB Streams, AWS EventBridge and Momento.
The app can be used to create, update and delete items in a DynamoDB table and the changes will be reflected in the cache/topic in real-time.

### **Prerequisites:**

- Momento Cache: momento-eventbridge-cache. If cache does not exists, can create one using the [momento console](https://console.gomomento.com/) .
- Momento API Key, can be created using [momento console](https://console.gomomento.com/) if you haven’t already created one
- HTTP API endpoint the same region as Momento API Key. You can copy the endpoint from the console after creating the API Key or refer to the [Regions Section here in the documentation](https://docs.momentohq.com/topics/develop/api-reference/http-api#regions)
- AWS Account AccessId, Aws Secret Key (and AWS Session Token if you are using temporary credentials)

### **Deploying and Running the Demo App:**

The source code for the CDK application lives in the `infrastructure` directory, and web application source code lives in the `webapp` directory.
You need to create a `.env` file in the root directory of the project with the following environment variables:

```bash
MOMENTO_API_KEY=<your-momento-api-key>
MOMENTO_API_ENDPOINT=<your-momento-api-endpoint>
AWS_ACCESS_KEY_ID=<your-aws-access-key-id>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-access-key>
AWS_SESSION_TOKEN=<your-aws-session-token>
```

To deploy and run the application, run the following script:

```bash
./deploy-and-run.sh
```
