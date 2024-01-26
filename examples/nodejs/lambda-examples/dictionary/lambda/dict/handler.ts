import {getGlobalCache} from "./global";

export const handler = async function(batch: any = {}) {
  console.log('request: ', JSON.stringify(batch, undefined, 2));

  const cache = await getGlobalCache();
  await cache.dayBucketInc(batch.tntid, batch.metricId);
}
