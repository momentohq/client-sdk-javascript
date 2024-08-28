/* eslint-disable @typescript-eslint/no-unused-vars */
import {CacheClient, Configurations} from '@gomomento/sdk';

async function main() {
  const cacheClient = await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    defaultTtlSeconds: 60,
  });
}

main().catch(e => {
  console.error(`Uncaught exception while running example: ${JSON.stringify(e)}`);
  throw e;
});
