

import { getGlobalCache } from "./global";

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
    } catch (error) {
      console.error('Error processing record', record, error);
    }
  }
};
