import {
  CreateCache,
  CacheClient,
  EnvMomentoTokenProvider,
  Configurations,
  CacheDictionarySetField,
  CacheDictionarySetFields,
  CacheDictionaryGetField,
  CacheDictionaryGetFields,
  CacheDictionaryFetch,
  MomentoLoggerFactory,
  DefaultMomentoLoggerFactory,
  CollectionTtl,
} from '@gomomento/sdk';

const cacheName = 'cache';
const dictionaryName = 'dictionary';

const credentialsProvider = new EnvMomentoTokenProvider({
  environmentVariableName: 'MOMENTO_API_KEY',
});

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
  if (createCacheResponse instanceof CreateCache.AlreadyExists) {
    console.log('cache already exists');
  } else if (createCacheResponse instanceof CreateCache.Error) {
    throw createCacheResponse.innerException();
  }

  // Set a value
  const dictionarySetFieldResponse = await momento.dictionarySetField(cacheName, dictionaryName, 'field1', 'value1');
  if (dictionarySetFieldResponse instanceof CacheDictionarySetField.Error) {
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
  if (dictionarySetFieldsResponse instanceof CacheDictionarySetFields.Error) {
    console.log(`Error setting multiple values in a dictionary: ${dictionarySetFieldsResponse.message()}`);
    process.exitCode = 1;
  }

  // Get a value
  console.log('\nGetting a single dictionary value');
  const field = 'field1';
  const dictionaryGetFieldResponse = await momento.dictionaryGetField(cacheName, dictionaryName, field);
  if (dictionaryGetFieldResponse instanceof CacheDictionaryGetField.Hit) {
    console.log(`Dictionary get of ${field}: status=HIT; value=${dictionaryGetFieldResponse.valueString()}`);
  } else if (dictionaryGetFieldResponse instanceof CacheDictionaryGetField.Miss) {
    // In this example you can get here if you:
    // - change the field name to one that does not exist, or if you
    // - set a short TTL, then add a sleep so that it expires.
    console.log(`Dictionary get of ${field}: status=MISS`);
  } else if (dictionaryGetFieldResponse instanceof CacheDictionaryGetField.Error) {
    console.log(`Error getting value from dictionary: ${dictionaryGetFieldResponse.message()}`);
    process.exitCode = 1;
  } else {
    throw new Error(`Unexpected response: ${dictionaryGetFieldResponse.toString()}`);
  }

  // Get multiple values
  console.log('\nGetting multiple dictionary values');
  const fieldsList = ['field1', 'field2', 'field3', 'field4'];
  const dictionaryGetFieldsResponse = await momento.dictionaryGetFields(cacheName, dictionaryName, fieldsList);
  if (dictionaryGetFieldsResponse instanceof CacheDictionaryGetFields.Hit) {
    console.log(`Got dictionary fields: ${JSON.stringify(dictionaryGetFieldsResponse.valueRecord(), null, 2)}`);
  } else if (dictionaryGetFieldsResponse instanceof CacheDictionaryGetFields.Error) {
    console.log(`Error getting values from a dictionary: ${dictionaryGetFieldsResponse.message()}`);
    process.exitCode = 1;
  } else {
    throw new Error(`Unexpected response: ${dictionaryGetFieldsResponse.toString()}`);
  }

  // Get the whole dictionary
  console.log('\nGetting an entire dictionary');
  const dictionaryFetchResponse = await momento.dictionaryFetch(cacheName, dictionaryName);
  if (dictionaryFetchResponse instanceof CacheDictionaryFetch.Hit) {
    const dictionary = dictionaryFetchResponse.valueRecord();
    console.log(`Fetched dictionary: ${JSON.stringify(dictionary, null, 2)}`);
  } else if (dictionaryFetchResponse instanceof CacheDictionaryFetch.Miss) {
    // You can reach here by:
    // - fetching a dictionary that does not exist, e.g. changing the name above, or
    // - setting a short TTL and adding a Task.Delay so the dictionary expires
    console.log(`Expected ${dictionaryName} to be a hit; got a miss.`);
  } else if (dictionaryFetchResponse instanceof CacheDictionaryFetch.Error) {
    console.log(`Error while fetching ${dictionaryName}: ${dictionaryFetchResponse.message()}`);
    process.exitCode = 1;
  } else {
    throw new Error(`Unexpected response: ${dictionaryFetchResponse.toString()}`);
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
