import { DynamoDB } from 'aws-sdk'; // Import AWS SDK for DynamoDB
import { v4 as uuidv4 } from 'uuid'; // Import UUID generation function
import { getGlobalCache } from "./global";
import * as https from 'https'; // Import the https module

const dynamoDb = new DynamoDB.DocumentClient({});

export const handler = async function(batch: any = {}) {
  if (!batch.Records) {
    console.warn('No records found in the batch');

    // Check if the required properties exist in the batch object
    if (batch.tntid && batch.metricId) {
      // Transform the input into the expected batch.Records format
      batch.Records = [{
        body: JSON.stringify({ tntid: batch.tntid, metricId: batch.metricId })
      }];
    } else {
      console.error('Invalid input format');
      return; // Exit the function if the required properties are missing
    }
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

      const currentDate = new Date();
      const year = currentDate.getFullYear().toString();
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // getMonth() is zero-based; add 1 to make it 1-indexed
      const day = currentDate.getDate().toString().padStart(2, '0');

        // Assuming dayBucketInc needs tntid and metricId as arguments
      await cache.dayBucketInc(tntid, `${metricId}_${year}`);
      await cache.dayBucketInc(tntid, `${metricId}_${year}_${month}`);
      await cache.dayBucketInc(tntid, `${metricId}_${year}_${month}_${day}`);

      // Randomly write to DynamoDB with a probability of 10%
      if (Math.random() < 0.5) {
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
