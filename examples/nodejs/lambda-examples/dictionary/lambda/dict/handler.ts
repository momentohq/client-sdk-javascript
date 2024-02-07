
import { DynamoDB } from 'aws-sdk'; // Import AWS SDK for DynamoDB
import { v4 as uuidv4 } from 'uuid'; // Import UUID generation function

import { getGlobalCache } from "./global";

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = async function(batch: any = {}) {

  if (!batch.Records) {
    console.error('No records found in the batch');
    return;
  }

  const cache = await getGlobalCache();

  console.log(JSON.stringify({batchSize: batch.Records.length}));

  for (const record of batch.Records) {
    try {
      const messageBody = JSON.parse(record.body);
      const tntid = messageBody.tntid;
      const metricId = messageBody.metricId;

      if (!tntid || !metricId) {
        console.error('tntid or metricId missing in the message', record);
        continue;
      }

      // Assuming dayBucketInc needs tntid and metricId as arguments
      await cache.dayBucketInc(tntid, metricId);

      // Randomly write to DynamoDB with a probability of 10%
      if (Math.random() < 0.1) {
        const item = {
          id: uuidv4(), // Generating a UUID for the key
          data: JSON.stringify(record) // Stringifying the record
        };

        await dynamoDb.put({
          TableName: 'metrics',
          Item: item
        }).promise();
      }
    } catch (error) {
      console.error('Error processing record', record, error);
    }
  }
};
