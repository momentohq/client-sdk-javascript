/* eslint-disable @typescript-eslint/no-unused-vars */
import {CacheClient} from '@gomomento/sdk';

async function main() {
  const cacheClient = await CacheClient.create({
    defaultTtlSeconds: 60,
  });
}

main().catch(e => {
  console.error(`Uncaught exception while running example: ${JSON.stringify(e)}`);
  throw e;
});
