import * as AWS from 'aws-sdk';

// Configure the AWS SDK
AWS.config.update({ region: 'us-west-2' });

const lambda = new AWS.Lambda();

// Function to invoke the Lambda with multiple metrics
async function invokeLambda(tntid: string, metricIds: string[]) {
  const params = {
    FunctionName: 'MomentoCDT', // Replace with your Lambda function name
    InvocationType: 'Event', // Async invocation
    Payload: JSON.stringify({ tntid, metricIds }),
  };

  try {
    await lambda.invoke(params).promise();
    // console.log('Lambda invoked:', result);
  } catch (error) {
    console.error('Error invoking Lambda:', error);
  }
}

// Generate a random user or metrics
function getRandomElement(array: string[]) {
  return array[Math.floor(Math.random() * array.length)];
}

// Generate a random number of metrics
function getRandomMetrics(metricsArray: string[], min: number, max: number) {
  const numberOfMetrics = Math.floor(Math.random() * (max - min + 1)) + min;
  return Array.from({ length: numberOfMetrics }, () => getRandomElement(metricsArray));
}

// Users and metrics arrays
const users = Array.from({ length: 20 }, (_, i) => `user${i + 1}`);
const metrics = Array.from({ length: 100 }, (_, i) => `metric${i + 1}`);

// Main loop to achieve around 100 TPS
setInterval(() => {
  for (let i = 0; i < 100; i++) {
    const tntid = getRandomElement(users);
    const metricIds = getRandomMetrics(metrics, 2, 8); // Get 2-8 random metrics
    console.log(`Calling Lambda with tntid: ${tntid} and metricIds: ${metricIds.join(', ')}`);
    invokeLambda(tntid, metricIds);
  }
}, 1000 /* interval */);
