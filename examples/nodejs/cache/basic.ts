import {
  CacheClient,
  CacheGetResponse,
  CacheSetResponse,
  CacheSortedSetFetchResponse,
  Configurations,
  CreateCacheResponse,
  CredentialProvider,
  SortedSetOrder,
} from '@gomomento/sdk';

async function main() {
  const momento = await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY'),
    defaultTtlSeconds: 60,
  });

  const createCacheResponse = await momento.createCache('cache');
  switch (createCacheResponse.type) {
    case CreateCacheResponse.AlreadyExists:
      console.log('cache already exists');
      break;
    case CreateCacheResponse.Success:
      console.log('cache created successfully');
      break;
    case CreateCacheResponse.Error:
      throw createCacheResponse.innerException();
  }

  console.log('Storing key=foo, value=FOO');
  const setResponse = await momento.set('cache', 'foo', 'FOO');
  switch (setResponse.type) {
    case CacheSetResponse.Success:
      console.log('Key stored successfully!');
      break;
    case CacheSetResponse.Error:
      console.log(`Error setting key: ${setResponse.toString()}`);
      break;
  }

  const getResponse = await momento.get('cache', 'foo');

  // simplified style; assume the value was found
  console.log(`cache hit: ${getResponse.value()!}`);

  // pattern-matching style; safer for production code
  switch (getResponse.type) {
    case CacheGetResponse.Hit:
      console.log(`cache hit: ${getResponse.valueString()}`);
      break;
    case CacheGetResponse.Miss:
      console.log('cache miss');
      break;
    case CacheGetResponse.Error:
      console.log(`Error: ${getResponse.message()}`);
      break;
  }

  await momento.sortedSetGetRank('my-cache', 'my-sorted-set', 'my-element', {
    order: SortedSetOrder.Descending,
  });

  const getRankRsp = await momento.sortedSetFetchByRank('myCache', 'mySortedSet', {
    order: SortedSetOrder.Ascending,
    // order: SortedSetOrder.Descending,
  });
  switch (getRankRsp.type) {
    case CacheSortedSetFetchResponse.Hit:
      console.log(JSON.stringify(getRankRsp.valueArray()));
      break;
    case CacheSortedSetFetchResponse.Miss:
      console.log('sorted set not found');
      break;
    case CacheSortedSetFetchResponse.Error:
      console.error(getRankRsp);
      break;
  }
}

main()
  .then(() => {
    console.log('success!!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
