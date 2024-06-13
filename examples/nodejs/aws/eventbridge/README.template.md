# Welcome to Momento <-> Eventbridge Integration Example Project

The project demonstrates a write-through cache pattern for DynamoDB using DynamoDB Streams, AWS EventBridge and Momento.
The app can be used to create, update and delete items in a DynamoDB table and the changes will be reflected in the cache/topic in real-time.

### **Prerequisites:**

- Momento Cache: momento-eventbridge-cache. If cache does not exists, can create one using the [momento console](https://console.gomomento.com/) .
- Momento API Key, can be created using [momento console](https://console.gomomento.com/) if you haven’t already created one
- HTTP API endpoint the same region as Momento API Key. You can copy the endpoint from the console after creating the API Key or refer to the [Regions Section here in the documentation](https://docs.momentohq.com/topics/develop/api-reference/http-api#regions)
- AWS Account AccessId, Aws Secret Key (and AWS Session Token if you are using temporary credentials)

### **Configuration**

The source code for the CDK application lives in the `infrastructure` directory, and web application source code lives in the `webapp` directory.
You need to create a `.env` file in the root directory of the project with the following environment variables:

```bash
MOMENTO_API_KEY=<your-momento-api-key>
MOMENTO_API_ENDPOINT=<your-momento-api-endpoint>
AWS_ACCESS_KEY_ID=<your-aws-access-key-id>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-access-key>
AWS_REGION=<your-aws-region>
AWS_SESSION_TOKEN=<your-aws-session-token> # Optional, if you are using temporary credentials
```

### **Deploying the CDK Application:**
To deploy the CDK application, run the following script:

```bash
./deploy-stack.sh
```
This script will deploy the CDK application and create the necessary resources in your AWS account.

### **Deploying and Running the Demo WebApp:**
To run the web application, run the following script:


```bash
./run-webapp.sh
```
This script load the environment variables from the `.env` file and start the web application on `http://localhost:5173`.

---

OPTIONAL: If you want to test the application using the CLI-App, follow the steps below:
### **Testing using CLI-App:**

To run the CLI-App, run the following script:

```bash
./run-typescript-cli-app.sh
```
This script load the environment variables from the `.env` file and start the CLI-App.


---
OPTIONAL: If you want to test the application using the CLI, follow the steps below:
### **Testing using CLI:**

To test the application using cli, you need to first install momento-cli. You can install it using the following command:

```bash
# Install Momento CLI
brew tap momentohq/tap
brew install momento-cli
brew upgrade momento-cli

# Configure Momento CLI.
# This will prompt you to enter the API Key. Use the same API Key that you used in the .env file.
# You can press enter for the other prompts to use the default values.
momento configure
```

Now, open another terminal and run the following commands:

```bash
- In the first terminal, run the following commands to subscribe to the Momento topic:

```bash
./subscribe-to-topic.sh
```
- In the second terminal, run the following command to test the application:

```bash
./run-bash-cli-app.sh
```

The first terminal will subscribe to the Momento topic. The second terminal will create a dummy record in the DynamoDB table. The changes will be reflected in the Momento cache/topic.
