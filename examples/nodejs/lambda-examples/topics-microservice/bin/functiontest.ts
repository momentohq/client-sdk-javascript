// Import required AWS SDK clients and commands for Node.js
const { LambdaClient, CreateFunctionCommand } = require("@aws-sdk/client-lambda");

// Set the AWS region
const REGION = "us-west-2"; //e.g. "us-west-2"

// Create initialized Lambda service object
const lambda = new LambdaClient({ region: REGION });

// Define the Lambda function parameters
const params = {
  Code: { /* required */
    S3Bucket: 'BUCKET_NAME',  // Replace with your Bucket name
    S3Key: 'ZIP_FILE_NAME',  // Replace with your Zip file name
  },
  FunctionName: 'FUNCTION_NAME', // Replace with your function's name
  Handler: 'index.handler',  // Replace with your Lambda function's file name and the export name
  Role: 'EXECUTION_ROLE_ARN', // Replace with your function's execution role ARN
  Runtime: 'nodejs18.x', // Or whatever runtime you prefer
  Description: 'A Lambda function writes data to Momento Topics', // Provide a description
  Timeout: 5,
  MemorySize: 128,
};

// Create a new Lambda function
const run = async () => {
  try {
    const data = await lambda.send(new CreateFunctionCommand(params));
    console.log("Function created: ", data);
  } catch (err) {
    console.error("Error creating function: ", err);
  }
};

run();
