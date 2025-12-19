import {
  CredentialProvider,
  CacheClient,
  CacheDictionaryFetchResponse,
  CacheDictionaryGetFieldResponse,
  CacheDictionaryGetFieldsResponse,
  CacheDictionarySetFieldResponse,
  CacheDictionarySetFieldsResponse,
  CollectionTtl,
  Configurations,
  CreateCacheResponse,
  DefaultMomentoLoggerFactory,
  MomentoLoggerFactory,
} from '@gomomento/sdk';

const cacheName = 'cache';
const dictionaryName = 'dictionary';

const credentialsProvider = CredentialProvider.fromEnvVarV2();

const loggerFactory: MomentoLoggerFactory = new DefaultMomentoLoggerFactory();

const defaultTtl = 60;
let momento: CacheClient;

const main = async () => {
  momento = await CacheClient.create({
    configuration: Configurations.Laptop.v1(loggerFactory),
    credentialProvider: credentialsProvider,
    defaultTtlSeconds: defaultTtl,
  });

  const createCacheResponse = await momento.createCache(cacheName);
  switch (createCacheResponse.type) {
    case CreateCacheResponse.AlreadyExists:
      console.log('cache already exists');
      break;
    case CreateCacheResponse.Success:
      console.log('cache created');
      break;
    case CreateCacheResponse.Error:
      throw createCacheResponse.innerException();
  }

  // Set a value
  const dictionarySetFieldResponse = await momento.dictionarySetField(cacheName, dictionaryName, 'field1', 'value1');
  if (dictionarySetFieldResponse.type === CacheDictionarySetFieldResponse.Error) {
    console.log(`Error setting a value in a dictionary: ${dictionarySetFieldResponse.message()}`);
    process.exitCode = 1;
  }

  // Set multiple values
  const dictionarySetFieldsResponse = await momento.dictionarySetFields(
    cacheName,
    dictionaryName,
    new Map([
      ['field2', 'value2'],
      ['field3', 'value3'],
    ]),
    {
      // this optional parameter can be used to control whether or not the ttl is refreshed if a collection already exists;
      // for more info see the CollectionTtl class.
      ttl: CollectionTtl.of(30).withNoRefreshTtlOnUpdates(),
    }
  );
  if (dictionarySetFieldsResponse.type === CacheDictionarySetFieldsResponse.Error) {
    console.log(`Error setting multiple values in a dictionary: ${dictionarySetFieldsResponse.message()}`);
    process.exitCode = 1;
  }

  // Get a value
  console.log('\nGetting a single dictionary value');
  const field = 'field1';
  const dictionaryGetFieldResponse = await momento.dictionaryGetField(cacheName, dictionaryName, field);
  switch (dictionaryGetFieldResponse.type) {
    case CacheDictionaryGetFieldResponse.Miss:
      // In this example you can get here if you:
      // - change the field name to one that does not exist, or if you
      // - set a short TTL, then add a sleep so that it expires.
      console.log(`Dictionary get of ${field}: status=MISS`);
      break;
    case CacheDictionaryGetFieldResponse.Hit:
      console.log(`Dictionary get of ${field}: status=HIT; value=${dictionaryGetFieldResponse.value()}`);
      break;
    case CacheDictionaryGetFieldResponse.Error:
      console.log(`Error getting value from dictionary: ${dictionaryGetFieldResponse.message()}`);
      process.exitCode = 1;
      break;
  }

  // Get multiple values
  console.log('\nGetting multiple dictionary values');
  const fieldsList = ['field1', 'field2', 'field3', 'field4'];
  const dictionaryGetFieldsResponse = await momento.dictionaryGetFields(cacheName, dictionaryName, fieldsList);
  switch (dictionaryGetFieldsResponse.type) {
    case CacheDictionaryGetFieldsResponse.Miss:
      console.log('Got a MISS on dictionaryGetFields!');
      break;
    case CacheDictionaryGetFieldsResponse.Hit:
      console.log(`Got dictionary fields: ${JSON.stringify(dictionaryGetFieldsResponse.value(), null, 2)}`);
      break;
    case CacheDictionaryGetFieldsResponse.Error:
      console.log(`Error getting values from a dictionary: ${dictionaryGetFieldsResponse.message()}`);
      process.exitCode = 1;
      break;
  }

  // Get the whole dictionary
  console.log('\nGetting an entire dictionary');
  const dictionaryFetchResponse = await momento.dictionaryFetch(cacheName, dictionaryName);
  switch (dictionaryFetchResponse.type) {
    case CacheDictionaryFetchResponse.Miss:
      // You can reach here by:
      // - fetching a dictionary that does not exist, e.g. changing the name above, or
      // - setting a short TTL and adding a Task.Delay so the dictionary expires
      console.log(`Expected ${dictionaryName} to be a hit; got a miss.`);
      break;
    case CacheDictionaryFetchResponse.Hit: {
      const dictionary = dictionaryFetchResponse.value();
      console.log(`Fetched dictionary: ${JSON.stringify(dictionary, null, 2)}`);
      break;
    }
    case CacheDictionaryFetchResponse.Error:
      console.log(`Error while fetching ${dictionaryName}: ${dictionaryFetchResponse.message()}`);
      process.exitCode = 1;
      break;
  }
};

main()
  .then(() => {
    console.log('success!!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running dictionary example: ${e.message}`);
    throw e;
  });
