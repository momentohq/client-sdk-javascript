import { getGlobalCache } from "./global";

export const handler = async function(batch: any = {}) {
  console.log('request: ', JSON.stringify(batch, undefined, 2));

  const cache = await getGlobalCache();

  // Check if metricIds is an array and iterate over it
  if (Array.isArray(batch.metricIds)) {
    for (const metricId of batch.metricIds) {
      await cache.dayBucketInc(batch.tntid, metricId);
    }
  }
}
