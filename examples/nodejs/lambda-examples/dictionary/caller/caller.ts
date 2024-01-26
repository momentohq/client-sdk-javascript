import * as AWS from 'aws-sdk';

// Configure the AWS SDK
AWS.config.update({ region: 'us-west-2' }); // Change to your region

const lambda = new AWS.Lambda();

// Function to invoke the Lambda
async function invokeLambda(tntid: string, metricId: string) {
  const params = {
    FunctionName: 'MomentoCDT', // Replace with your Lambda function name
    InvocationType: 'Event', // Async invocation
    Payload: JSON.stringify({ tntid, metricId }),
  };

  try {
    await lambda.invoke(params).promise();
    // console.log('Lambda invoked:', result);
  } catch (error) {
    console.error('Error invoking Lambda:', error);
  }
}

// Generate a random user or metric
function getRandomElement(array: string[]) {
  return array[Math.floor(Math.random() * array.length)];
}

// Users and metrics arrays
const users = Array.from({ length: 20 }, (_, i) => `user${i + 1}`);
const metrics = Array.from({ length: 100 }, (_, i) => `metric${i + 1}`);

// Main loop to achieve around 100 TPS
setInterval(() => {
  for (let i = 0; i < 100; i++) {
    const tntid = getRandomElement(users);
    const metricId = getRandomElement(metrics);
    console.log(`Calling Lambda with tntid: ${tntid} and metricId: ${metricId}`);
    invokeLambda(tntid, metricId);
  }
}, 100);

