import {CacheClient, CacheGetResponse} from '@gomomento/sdk';

async function main() {
  const cacheClient = await CacheClient.create({
    defaultTtlSeconds: 60,
  });

  await cacheClient.createCache('cache');
  await cacheClient.set('cache', 'foo', 'FOO');
  const getResponse = await cacheClient.get('cache', 'foo');
  if (getResponse.type === CacheGetResponse.Hit) {
    console.log(`Got value: ${getResponse.valueString()}`);
  }
}

main().catch(e => {
  throw e;
});
