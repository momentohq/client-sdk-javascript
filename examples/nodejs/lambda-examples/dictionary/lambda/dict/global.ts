
import { MomentoClient } from "./momento";

export class CvGlobalCache {

  private cli:MomentoClient;

  constructor(cli:MomentoClient) {
    this.cli = cli;
  }

  /**
   * Increment a global cache item -> key -> value
   *
   * @param ctx: the context, this will end up being something like tenant:2023-12-01 and is where the TTL applies
   * @param key: the key within the CDT dictionary
   * @param count: optional count to increase by (defaults to 1)
   * @returns boolean indicating if the value was successfully incremented
   */
  async dayBucketInc(ctx:string, key:string, count=1) {
    const dstamp =  this.getUTCDayStamp();
    const item = `${ctx}:${dstamp}`;

    console.log(`Incrementing ${item} -> ${key} by ${count}`);
    return await this.cli.inc(item, key, count);
  }

   getUTCDayStamp() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = (now.getUTCMonth() + 1).toString().padStart(2, '0'); // Adding 1 because getUTCMonth() returns 0-11
    const day = now.getUTCDate().toString().padStart(2, '0');

    // Format: YYYYMMDD
    return `${year}${month}${day}`;
  }
}

let _cache:CvGlobalCache|null = null;
let counter  = 0;

export async function getGlobalCache() {
  if (_cache !== null) {
    return _cache;
  }

  counter++;
  console.log(JSON.stringify({'cache-init-counter': counter}));
  const mcache = await MomentoClient.getClient();
  _cache = new CvGlobalCache(mcache);
  return _cache;
}
