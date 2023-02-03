import {
  CreateCache,
  LogLevel,
  LogFormat,
  SimpleCacheClient,
  EnvMomentoTokenProvider,
  Configurations,
  LoggerOptions,
  CacheDictionarySetField,
  CacheDictionarySetFields,
  CacheDictionaryGetField,
  CacheDictionaryGetFields,
  CacheDictionaryFetch,
} from '@gomomento/sdk';

const cacheName = 'cache';
const dictionaryName = 'dictionary';

const credentialsProvider = new EnvMomentoTokenProvider({
  environmentVariableName: 'MOMENTO_AUTH_TOKEN',
});

const loggerOptions: LoggerOptions = {
  level: LogLevel.INFO,
  format: LogFormat.JSON,
};

const defaultTtl = 60;
const momento = new SimpleCacheClient({
  configuration: Configurations.Laptop.latest(loggerOptions),
  credentialProvider: credentialsProvider,
  defaultTtlSeconds: defaultTtl,
});

const main = async () => {
  const createCacheResponse = await momento.createCache(cacheName);
  if (createCacheResponse instanceof CreateCache.AlreadyExists) {
    console.log('cache already exists');
  } else if (createCacheResponse instanceof CreateCache.Error) {
    throw createCacheResponse.innerException();
  }

  // Set a value
  const dictionarySetFieldResponse = await momento.dictionarySetField(
    cacheName,
    dictionaryName,
    'field1',
    'value1'
  );
  if (dictionarySetFieldResponse instanceof CacheDictionarySetField.Error) {
    console.log(
      `Error setting a value in a dictionary: ${dictionarySetFieldResponse.message()}`
    );
    process.exitCode = 1;
  }

  // Set multiple values
  const dictionarySetFieldsResponse = await momento.dictionarySetFields(
    cacheName,
    dictionaryName,
    new Map([
      ['field2', 'value2'],
      ['field3', 'value3'],
    ])
  );
  if (dictionarySetFieldsResponse instanceof CacheDictionarySetFields.Error) {
    console.log(
      `Error setting multiple values in a dictionary: ${dictionarySetFieldsResponse.message()}`
    );
    process.exitCode = 1;
  }

  // Get a value
  console.log('\nGetting a single dictionary value');
  const field = 'field1';
  let getStatus = '';
  let getValue = '';
  const dictionaryGetFieldResponse = await momento.dictionaryGetField(
    cacheName,
    dictionaryName,
    field
  );
  if (dictionaryGetFieldResponse instanceof CacheDictionaryGetField.Hit) {
    getStatus = 'HIT';
    getValue = dictionaryGetFieldResponse.valueString();
  } else if (
    dictionaryGetFieldResponse instanceof CacheDictionaryGetField.Miss
  ) {
    // In this example you can get here if you:
    // - change the field name to one that does not exist, or if you
    // - set a short TTL, then add a Task.Delay so that it expires.
    getStatus = 'MISS';
    getValue = '<NONE; operation was a MISS>';
  } else if (
    dictionaryGetFieldResponse instanceof CacheDictionaryGetField.Error
  ) {
    console.log(
      `Error getting value from dictionary: ${dictionaryGetFieldResponse.message()}`
    );
    process.exitCode = 1;
  }
  console.log(
    `Dictionary get of ${field}: status=${getStatus}; value=${getValue}`
  );

  // Get multiple values
  console.log('\nGetting multiple dictionary values');
  const fieldsList = ['field1', 'field2', 'field3', 'field4'];
  const dictionaryGetFieldsResponse = await momento.dictionaryGetFields(
    cacheName,
    dictionaryName,
    fieldsList
  );
  if (dictionaryGetFieldsResponse instanceof CacheDictionaryGetFields.Hit) {
    console.log('Displaying the result of dictionary get fields:');
    dictionaryGetFieldsResponse.responsesList.forEach(response => {
      const field = response.fieldString();
      let status = 'MISS';
      let value = '<NONE; field was a MISS>';
      if (response instanceof CacheDictionaryGetField.Hit) {
        status = 'HIT';
        value = response.valueString();
      }
      console.log(`- field=${field}; status=${status}; value=${value}`);
    });
  } else if (
    dictionaryGetFieldsResponse instanceof CacheDictionaryGetFields.Error
  ) {
    console.log(
      `Error getting values from a dictionary: ${dictionaryGetFieldsResponse.message()}`
    );
    process.exitCode = 1;
  }

  // Get the whole dictionary
  console.log('\nGetting an entire dictionary');
  const dictionaryFetchResponse = await momento.dictionaryFetch(
    cacheName,
    dictionaryName
  );
  if (dictionaryFetchResponse instanceof CacheDictionaryFetch.Hit) {
    const dictionary = dictionaryFetchResponse.valueDictionaryStringString();
    // console.log(`Accessing an entry of ${dictionaryName} by field: ${dictionary['field1']}`);
    dictionary.forEach((value, key) => {
      console.log(`- field=${key}; value=${value}`);
    });
  } else if (dictionaryFetchResponse instanceof CacheDictionaryFetch.Miss) {
    // You can reach here by:
    // - fetching a dictionary that does not exist, e.g. changing the name above, or
    // - setting a short TTL and adding a Task.Delay so the dictionary expires
    console.log(`Expected ${dictionaryName} to be a hit; got a miss.`);
  } else if (dictionaryFetchResponse instanceof CacheDictionaryFetch.Error) {
    console.log(
      `Error while fetching ${dictionaryName}: ${dictionaryFetchResponse.message()}`
    );
    process.exitCode = 1;
  }
};

main()
  .then(() => {
    console.log('success!!');
  })
  .catch((e: Error) => {
    console.error(
      `Uncaught exception while running dictionary example: ${e.message}`
    );
    throw e;
  });
