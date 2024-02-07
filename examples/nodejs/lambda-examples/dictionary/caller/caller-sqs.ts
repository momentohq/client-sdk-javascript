import * as AWS from 'aws-sdk';

// Configure the AWS SDK
AWS.config.update({ region: 'us-west-2' });

const sqs = new AWS.SQS();

// Function to send a message to the SQS queue
async function sendMessageToSQS(tntid: string, metricId: string) {
  const queueUrl = 'https://sqs.us-west-2.amazonaws.com/616729109836/momento-cdt'; // Replace with your SQS queue URL
  const params = {
    MessageBody: JSON.stringify({ tntid, metricId }),
    QueueUrl: queueUrl,
  };

  try {
    const result = await sqs.sendMessage(params).promise();
    console.log('Message sent to SQS:', result);
  } catch (error) {
    console.error('Error sending message to SQS:', error);
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
async function mainLoop() {
  const promises = [];
  for (let i = 0; i < 100; i++) {
    const tntid = getRandomElement(users);
    const metricId = getRandomElement(metrics); // Get a single random metric
    console.log(`Sending message to SQS with tntid: ${tntid} and metricId: ${metricId}`);
    await sendMessageToSQS(tntid, metricId);
  }
  // await Promise.all(promises);
}

// Running the main loop every 200 ms
setInterval(mainLoop, 20);
