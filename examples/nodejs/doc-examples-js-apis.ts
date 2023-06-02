/**
 *
 * This file contains examples of consuming the JavaScript APIs, for use as examples
 * in the public dev docs.  Each function name that begins with `example_` is available
 * to the dev docs to inject into the code snippets widget for the specified API.
 *
 * These examples should all be JavaScript; we can add TypeScript-specific examples in
 * a second file in the future if desired.
 *
 */
import {
  CacheClient,
  Configurations,
  CredentialProvider,
  CreateCache,
  DeleteCache,
  CacheFlush,
  ListCaches,
  CacheSet,
  CacheGet,
  CacheDelete,
  AuthClient,
  AllDataReadWrite,
  ExpiresIn,
  GenerateAuthToken,
  RefreshAuthToken,
  CacheIncrement,
  ItemGetType,
  CacheSetIfNotExists,
  CacheListFetch,
  CacheListConcatenateBack,
  CacheListConcatenateFront,
  CacheListLength,
  CacheListPopBack,
  CacheListPopFront,
  CacheListPushBack,
  CacheListPushFront,
  CacheListRemoveValue,
  CacheListRetain,
  ItemType,
  CacheDictionaryFetch,
  CacheDictionaryGetField,
  CacheDictionaryGetFields,
  CacheDictionarySetField,
  CacheDictionarySetFields,
  CacheDictionaryIncrement,
  CacheDictionaryRemoveField,
  CacheDictionaryRemoveFields,
  CacheSetAddElement,
  CacheSetAddElements,
  CacheSetFetch,
  CacheSetRemoveElement,
  CacheSetRemoveElements,
  CacheSortedSetPutElement,
  CacheSortedSetPutElements,
  CacheSortedSetFetch,
  CacheSortedSetGetRank,
  CacheSortedSetGetScore,
  CacheSortedSetGetScores,
  CacheSortedSetIncrementScore,
  CacheSortedSetRemoveElement,
  CacheSortedSetRemoveElements,
  TopicClient,
  TopicPublish,
  TopicSubscribe,
} from '@gomomento/sdk';
import {InternalNodeGrpcPingClient} from '../../packages/client-sdk-nodejs/src/internal/ping-client';
import {ExampleMetricMiddleware} from './doc-example-files/example-metric-middleware';

function retrieveAuthTokenFromYourSecretsManager(): string {
  // this is not a valid API key but conforms to the syntax requirements.
  const fakeTestV1ApiKey =
    'eyJhcGlfa2V5IjogImV5SjBlWEFpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5leUpwYzNNaU9pSlBibXhwYm1VZ1NsZFVJRUoxYVd4a1pYSWlMQ0pwWVhRaU9qRTJOemd6TURVNE1USXNJbVY0Y0NJNk5EZzJOVFV4TlRReE1pd2lZWFZrSWpvaUlpd2ljM1ZpSWpvaWFuSnZZMnRsZEVCbGVHRnRjR3hsTG1OdmJTSjkuOEl5OHE4NExzci1EM1lDb19IUDRkLXhqSGRUOFVDSXV2QVljeGhGTXl6OCIsICJlbmRwb2ludCI6ICJ0ZXN0Lm1vbWVudG9ocS5jb20ifQo=';
  return fakeTestV1ApiKey;
}

function example_API_CredentialProviderFromEnvVar() {
  CredentialProvider.fromEnvironmentVariable({environmentVariableName: 'MOMENTO_AUTH_TOKEN'});
}

function example_API_CredentialProviderFromString() {
  const authToken = retrieveAuthTokenFromYourSecretsManager();
  CredentialProvider.fromString({authToken: authToken});
}

function example_API_ConfigurationLaptop() {
  Configurations.Laptop.v1();
}

function example_API_ConfigurationInRegionDefault() {
  Configurations.InRegion.Default.v1();
}

function example_API_ConfigurationInRegionDefaultLatest() {
  Configurations.InRegion.Default.latest();
}

function example_API_ConfigurationInRegionLowLatency() {
  Configurations.InRegion.LowLatency.v1();
}

function example_API_InstantiateCacheClient() {
  new CacheClient({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_AUTH_TOKEN',
    }),
    defaultTtlSeconds: 60,
  });
}

function example_API_InstantiateCacheClientWithMiddleware() {
  new CacheClient({
    configuration: Configurations.Laptop.v1().addMiddleware(new ExampleMetricMiddleware()),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_AUTH_TOKEN',
    }),
    defaultTtlSeconds: 60,
  });
}

async function example_API_ErrorHandlingHitMiss(cacheClient: CacheClient) {
  const result = await cacheClient.get('test-cache', 'test-key');
  if (result instanceof CacheGet.Hit) {
    console.log(`Retrieved value for key 'test-key': ${result.valueString()}`);
  } else if (result instanceof CacheGet.Miss) {
    console.log("Key 'test-key' was not found in cache 'test-cache'");
  } else if (result instanceof CacheGet.Error) {
    throw new Error(
      `An error occurred while attempting to get key 'test-key' from cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_ErrorHandlingSuccess(cacheClient: CacheClient) {
  const result = await cacheClient.set('test-cache', 'test-key', 'test-value');
  if (result instanceof CacheSet.Success) {
    console.log("Key 'test-key' stored successfully");
  } else if (result instanceof CacheSet.Error) {
    throw new Error(
      `An error occurred while attempting to store key 'test-key' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_CreateCache(cacheClient: CacheClient) {
  const result = await cacheClient.createCache('test-cache');
  if (result instanceof CreateCache.Success) {
    console.log("Cache 'test-cache' created");
  } else if (result instanceof CreateCache.AlreadyExists) {
    console.log("Cache 'test-cache' already exists");
  } else if (result instanceof CreateCache.Error) {
    throw new Error(
      `An error occurred while attempting to create cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_DeleteCache(cacheClient: CacheClient) {
  const result = await cacheClient.deleteCache('test-cache');
  if (result instanceof DeleteCache.Success) {
    console.log("Cache 'test-cache' deleted");
  } else if (result instanceof DeleteCache.Error) {
    throw new Error(
      `An error occurred while attempting to delete cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_ListCaches(cacheClient: CacheClient) {
  const result = await cacheClient.listCaches();
  if (result instanceof ListCaches.Success) {
    console.log(
      `Caches:\n${result
        .getCaches()
        .map(c => c.getName())
        .join('\n')}\n\n`
    );
  } else if (result instanceof ListCaches.Error) {
    throw new Error(`An error occurred while attempting to list caches: ${result.errorCode()}: ${result.toString()}`);
  }
}

async function example_API_FlushCache(cacheClient: CacheClient) {
  const result = await cacheClient.flushCache('test-cache');
  if (result instanceof CacheFlush.Success) {
    console.log("Cache 'test-cache' flushed");
  } else if (result instanceof CacheFlush.Error) {
    throw new Error(
      `An error occurred while attempting to flush cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_Set(cacheClient: CacheClient) {
  const result = await cacheClient.set('test-cache', 'test-key', 'test-value');
  if (result instanceof CacheSet.Success) {
    console.log("Key 'test-key' stored successfully");
  } else if (result instanceof CacheSet.Error) {
    throw new Error(
      `An error occurred while attempting to store key 'test-key' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_Get(cacheClient: CacheClient) {
  const result = await cacheClient.get('test-cache', 'test-key');
  if (result instanceof CacheGet.Hit) {
    console.log(`Retrieved value for key 'test-key': ${result.valueString()}`);
  } else if (result instanceof CacheGet.Miss) {
    console.log("Key 'test-key' was not found in cache 'test-cache'");
  } else if (result instanceof CacheGet.Error) {
    throw new Error(
      `An error occurred while attempting to get key 'test-key' from cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_Delete(cacheClient: CacheClient) {
  const result = await cacheClient.delete('test-cache', 'test-key');
  if (result instanceof CacheDelete.Success) {
    console.log("Key 'test-key' deleted successfully");
  } else if (result instanceof CacheDelete.Error) {
    throw new Error(
      `An error occurred while attempting to delete key 'test-key' from cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_Increment(cacheClient: CacheClient) {
  await cacheClient.set('test-cache', 'test-key', '10');
  const result = await cacheClient.increment('test-cache', 'test-key', 1);
  if (result instanceof CacheIncrement.Success) {
    console.log(`Key 'test-key' incremented successfully. New value in key test-key: ${result.valueNumber()}`);
  } else if (result instanceof CacheIncrement.Error) {
    throw new Error(
      `An error occurred while attempting to increment the value of key 'test-key' from cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_ItemGetType(cacheClient: CacheClient) {
  const result = await cacheClient.itemGetType('test-cache', 'test-key');
  if (result instanceof ItemGetType.Hit) {
    console.log(`Item type retrieved successfully: ${ItemType[result.itemType()]}`);
  } else if (result instanceof ItemGetType.Miss) {
    console.log("Key 'test-key' was not found in cache 'test-cache'");
  } else if (result instanceof ItemGetType.Error) {
    throw new Error(
      `An error occurred while attempting to get the type of key 'test-key' from cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_SetIfNotExists(cacheClient: CacheClient) {
  const result = await cacheClient.setIfNotExists('test-cache', 'test-key', 'test-field');
  if (result instanceof CacheSetIfNotExists.Stored) {
    console.log("Field 'test-field' set in key 'test-key'");
  } else if (result instanceof CacheSetIfNotExists.NotStored) {
    console.log("Key 'test-key' already exists in cache 'test-cache', so we did not overwrite it");
  } else if (result instanceof CacheSetIfNotExists.Error) {
    throw new Error(
      `An error occurred while attempting to call setIfNotExists for the key 'test-key' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_ListFetch(cacheClient: CacheClient) {
  await cacheClient.listConcatenateBack('test-cache', 'test-list', ['a', 'b', 'c']);
  const result = await cacheClient.listFetch('test-cache', 'test-list');
  if (result instanceof CacheListFetch.Hit) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`List fetched successfully: ${result.valueList()}`);
  } else if (result instanceof CacheListFetch.Miss) {
    console.log("List 'test-list' was not found in cache 'test-cache'");
  } else if (result instanceof CacheListFetch.Error) {
    throw new Error(
      `An error occurred while attempting to fetch the list 'test-list' from cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_ListConcatenateBack(cacheClient: CacheClient) {
  await cacheClient.listConcatenateBack('test-cache', 'test-list', ['a', 'b', 'c']);
  const result = await cacheClient.listConcatenateBack('test-cache', 'test-list', ['x', 'y', 'z']);
  if (result instanceof CacheListConcatenateBack.Success) {
    console.log(`Values added successfully to the back of the list 'test-list'. Result - ${result.toString()}`);
  } else if (result instanceof CacheListConcatenateBack.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheListConcatenateBack on list 'test-list' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_ListConcatenateFront(cacheClient: CacheClient) {
  await cacheClient.listConcatenateFront('test-cache', 'test-list', ['a', 'b', 'c']);
  const result = await cacheClient.listConcatenateFront('test-cache', 'test-list', ['x', 'y', 'z']);
  if (result instanceof CacheListConcatenateFront.Success) {
    console.log(`Values added successfully to the front of the list 'test-list'. Result - ${result.toString()}`);
  } else if (result instanceof CacheListConcatenateFront.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheListConcatenateFront on list 'test-list' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_ListLength(cacheClient: CacheClient) {
  await cacheClient.listConcatenateBack('test-cache', 'test-list', ['one', 'two', 'three']);
  const result = await cacheClient.listLength('test-cache', 'test-list');
  if (result instanceof CacheListLength.Hit) {
    console.log(`Length of list 'test-list' is ${result.length()}`);
  } else if (result instanceof CacheListLength.Miss) {
    console.log("List 'test-list' was not found in cache 'test-cache'");
  } else if (result instanceof CacheListLength.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheListLength on list 'test-list' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_ListPopBack(cacheClient: CacheClient) {
  await cacheClient.listConcatenateBack('test-cache', 'test-list', ['one', 'two', 'three']);
  const result = await cacheClient.listPopBack('test-cache', 'test-list');
  if (result instanceof CacheListPopBack.Hit) {
    console.log(`Last value was removed successfully from list 'test-list': ${result.valueString()}`);
  } else if (result instanceof CacheListPopBack.Miss) {
    console.log("List 'test-list' was not found in cache 'test-cache'");
  } else if (result instanceof CacheListPopBack.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheListPopBack on list 'test-list' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_ListPopFront(cacheClient: CacheClient) {
  await cacheClient.listConcatenateFront('test-cache', 'test-list', ['one', 'two', 'three']);
  const result = await cacheClient.listPopFront('test-cache', 'test-list');
  if (result instanceof CacheListPopFront.Hit) {
    console.log(`First value was removed successfully from list 'test-list': ${result.valueString()}`);
  } else if (result instanceof CacheListPopFront.Miss) {
    console.log("List 'test-list' was not found in cache 'test-cache'");
  } else if (result instanceof CacheListPopFront.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheListPopFront on list 'test-list' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_ListPushBack(cacheClient: CacheClient) {
  await cacheClient.listConcatenateBack('test-cache', 'test-list', ['a', 'b', 'c']);
  const result = await cacheClient.listPushBack('test-cache', 'test-list', 'x');
  if (result instanceof CacheListPushBack.Success) {
    console.log("Value 'x' added successfully to back of list 'test-list'");
  } else if (result instanceof CacheListPushBack.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheListPushBack on list 'test-list' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_ListPushFront(cacheClient: CacheClient) {
  await cacheClient.listConcatenateFront('test-cache', 'test-list', ['a', 'b', 'c']);
  const result = await cacheClient.listPushFront('test-cache', 'test-list', 'x');
  if (result instanceof CacheListPushFront.Success) {
    console.log("Value 'x' added successfully to front of list 'test-list'");
  } else if (result instanceof CacheListPushFront.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheListPushFront on list 'test-list' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_ListRemoveValue(cacheClient: CacheClient) {
  await cacheClient.listConcatenateFront('test-cache', 'test-list', ['a', 'b', 'c']);
  const result = await cacheClient.listRemoveValue('test-cache', 'test-list', 'b');
  if (result instanceof CacheListRemoveValue.Success) {
    console.log("Value 'b' removed successfully from list 'test-list'");
  } else if (result instanceof CacheListRemoveValue.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheListRemoveValue on list 'test-list' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_ListRetain(cacheClient: CacheClient) {
  await cacheClient.listConcatenateFront('test-cache', 'test-list', ['a', 'b', 'c', 'd', 'e', 'f']);
  const result = await cacheClient.listRetain('test-cache', 'test-list', {startIndex: 1, endIndex: 4});
  if (result instanceof CacheListRetain.Success) {
    console.log("Retaining elements from index 1 to 4 from list 'test-list'");
  } else if (result instanceof CacheListRetain.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheListRetain on list 'test-list' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_DictionaryFetch(cacheClient: CacheClient) {
  await cacheClient.dictionarySetField('test-cache', 'test-dictionary', 'test-field', 'test-value');
  const result = await cacheClient.dictionaryFetch('test-cache', 'test-dictionary');
  if (result instanceof CacheDictionaryFetch.Hit) {
    console.log('Dictionary fetched successfully- ');
    result.valueMapStringString().forEach((value, key) => {
      console.log(`${key} : ${value}`);
    });
  } else if (result instanceof CacheDictionaryFetch.Miss) {
    console.log("Dictionary 'test-dictionary' was not found in cache 'test-cache'");
  } else if (result instanceof CacheDictionaryFetch.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheDictionaryFetch on dictionary 'test-dictionary' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_DictionaryGetField(cacheClient: CacheClient) {
  await cacheClient.dictionarySetField('test-cache', 'test-dictionary', 'test-field', 'test-value');
  const result = await cacheClient.dictionaryGetField('test-cache', 'test-dictionary', 'test-field');
  if (result instanceof CacheDictionaryGetField.Hit) {
    console.log(
      `Field ${result.fieldString()} fetched successfully from cache 'test-cache' with value: ${result.valueString()}`
    );
  } else if (result instanceof CacheDictionaryGetField.Miss) {
    console.log("Dictionary 'test-dictionary' was not found in cache 'test-cache'");
  } else if (result instanceof CacheDictionaryGetField.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheDictionaryGetField on dictionary 'test-dictionary' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_DictionaryGetFields(cacheClient: CacheClient) {
  await cacheClient.dictionarySetFields(
    'test-cache',
    'test-dictionary',
    new Map<string, string>([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ])
  );
  const result = await cacheClient.dictionaryGetFields('test-cache', 'test-dictionary', ['key1', 'key2']);
  if (result instanceof CacheDictionaryGetFields.Hit) {
    console.log('Values fetched successfully- ');
    result.valueMapStringString().forEach((value, key) => {
      console.log(`${key} : ${value}`);
    });
  } else if (result instanceof CacheDictionaryGetFields.Miss) {
    console.log("Dictionary 'test-dictionary' was not found in cache 'test-cache'");
  } else if (result instanceof CacheDictionaryGetFields.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheDictionaryGetFields on dictionary 'test-dictionary' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_DictionarySetField(cacheClient: CacheClient) {
  const result = await cacheClient.dictionarySetField('test-cache', 'test-dictionary', 'test-field', 'test-value');
  if (result instanceof CacheDictionarySetField.Success) {
    console.log("Field set successfully into cache 'test-cache'");
  } else if (result instanceof CacheDictionarySetField.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheDictionarySetField on dictionary 'test-dictionary' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_DictionarySetFields(cacheClient: CacheClient) {
  const result = await cacheClient.dictionarySetFields(
    'test-cache',
    'test-dictionary',
    new Map<string, string>([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ])
  );
  if (result instanceof CacheDictionarySetFields.Success) {
    console.log("Fields set successfully into cache 'test-cache'");
  } else if (result instanceof CacheDictionarySetFields.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheDictionarySetFields on dictionary 'test-dictionary' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_DictionaryIncrement(cacheClient: CacheClient) {
  await cacheClient.dictionarySetField('test-cache', 'test-dictionary', 'test-field', '10');
  const result = await cacheClient.dictionaryIncrement('test-cache', 'test-dictionary', 'test-field', 1);
  if (result instanceof CacheDictionaryIncrement.Success) {
    console.log(`Field value incremented by 1. Result - ${result.valueNumber()}`);
  } else if (result instanceof CacheDictionaryIncrement.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheDictionaryIncrement on dictionary 'test-dictionary' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_DictionaryRemoveField(cacheClient: CacheClient) {
  await cacheClient.dictionarySetField('test-cache', 'test-dictionary', 'test-field', '10');
  const result = await cacheClient.dictionaryRemoveField('test-cache', 'test-dictionary', 'test-field');
  if (result instanceof CacheDictionaryRemoveField.Success) {
    console.log("Field removed successfully from dictionary 'test-dictionary'");
  } else if (result instanceof CacheDictionaryRemoveField.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheDictionaryRemoveField on dictionary 'test-dictionary' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_DictionaryRemoveFields(cacheClient: CacheClient) {
  await cacheClient.dictionarySetFields(
    'test-cache',
    'test-dictionary',
    new Map<string, string>([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ])
  );
  const result = await cacheClient.dictionaryRemoveFields('test-cache', 'test-dictionary', ['key1', 'key2']);
  if (result instanceof CacheDictionaryRemoveFields.Success) {
    console.log("Fields removed successfully from dictionary 'test-dictionary'");
  } else if (result instanceof CacheDictionaryRemoveFields.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheDictionaryRemoveFields on dictionary 'test-dictionary' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_SetAddElement(cacheClient: CacheClient) {
  const result = await cacheClient.setAddElement('test-cache', 'test-set', 'test-element');
  if (result instanceof CacheSetAddElement.Success) {
    console.log("Element added successfully to set 'test-set'");
  } else if (result instanceof CacheSetAddElement.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheSetAddElement on set 'test-set' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_SetAddElements(cacheClient: CacheClient) {
  const result = await cacheClient.setAddElements('test-cache', 'test-set', ['test-element1', 'test-element2']);
  if (result instanceof CacheSetAddElements.Success) {
    console.log("Elements added successfully to set 'test-set'");
  } else if (result instanceof CacheSetAddElements.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheSetAddElements on set 'test-set' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_SetFetch(cacheClient: CacheClient) {
  await cacheClient.setAddElements('test-cache', 'test-set', ['test-element1', 'test-element2']);
  const result = await cacheClient.setFetch('test-cache', 'test-set');
  if (result instanceof CacheSetFetch.Hit) {
    console.log('Set fetched successfully- ');
    result.valueSet().forEach((value, key) => {
      console.log(`${key} : ${value}`);
    });
  } else if (result instanceof CacheSetFetch.Miss) {
    console.log("Set 'test-set' was not found in cache 'test-cache'");
  } else if (result instanceof CacheSetFetch.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheSetFetch on set 'test-set' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_SetRemoveElement(cacheClient: CacheClient) {
  await cacheClient.setAddElement('test-cache', 'test-set', 'test-element');
  const result = await cacheClient.setRemoveElement('test-cache', 'test-set', 'test-element');
  if (result instanceof CacheSetRemoveElement.Success) {
    console.log("Element 'test-element' removed successfully from set 'test-set'");
  } else if (result instanceof CacheSetRemoveElement.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheSetRemoveElement on set 'test-set' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_SetRemoveElements(cacheClient: CacheClient) {
  await cacheClient.setAddElements('test-cache', 'test-set', ['test-element1', 'test-element2']);
  const result = await cacheClient.setRemoveElements('test-cache', 'test-set', ['test-element1', 'test-element2']);
  if (result instanceof CacheSetRemoveElements.Success) {
    console.log("Elements 'test-element1' and 'test-element2' removed successfully from set 'test-set'");
  } else if (result instanceof CacheSetRemoveElements.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheSetRemoveElements on set 'test-set' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_SortedSetPutElement(cacheClient: CacheClient) {
  const result = await cacheClient.sortedSetPutElement('test-cache', 'test-sorted-set', 'test-value', 5);
  if (result instanceof CacheSortedSetPutElement.Success) {
    console.log("Value 'test-value' with score '5' added successfully to sorted set 'test-sorted-set'");
  } else if (result instanceof CacheSortedSetPutElement.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheSortedSetPutElement on sorted set 'test-sorted-set' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_SortedSetPutElements(cacheClient: CacheClient) {
  const result = await cacheClient.sortedSetPutElements(
    'test-cache',
    'test-sorted-set',
    new Map<string, number>([
      ['key1', 10],
      ['key2', 20],
    ])
  );
  if (result instanceof CacheSortedSetPutElements.Success) {
    console.log("Elements added successfully to sorted set 'test-sorted-set'");
  } else if (result instanceof CacheSortedSetPutElements.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheSortedSetPutElements on sorted set 'test-sorted-set' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_SortedSetFetchByRank(cacheClient: CacheClient) {
  await cacheClient.sortedSetPutElements(
    'test-cache',
    'test-sorted-set',
    new Map<string, number>([
      ['key1', 10],
      ['key2', 20],
    ])
  );
  const result = await cacheClient.sortedSetFetchByRank('test-cache', 'test-sorted-set');
  if (result instanceof CacheSortedSetFetch.Hit) {
    console.log("Values from sorted set 'test-sorted-set' fetched by rank successfully- ");
    result.valueArray().forEach(res => {
      console.log(`${res.value} : ${res.score}`);
    });
  } else if (result instanceof CacheSortedSetFetch.Miss) {
    console.log("Sorted Set 'test-sorted-set' was not found in cache 'test-cache'");
  } else if (result instanceof CacheSortedSetFetch.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheSortedSetFetchByRank on sorted set 'test-sorted-set' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_SortedSetFetchByScore(cacheClient: CacheClient) {
  await cacheClient.sortedSetPutElements(
    'test-cache',
    'test-sorted-set',
    new Map<string, number>([
      ['key1', 100],
      ['key2', 25],
    ])
  );
  const result = await cacheClient.sortedSetFetchByScore('test-cache', 'test-sorted-set');
  if (result instanceof CacheSortedSetFetch.Hit) {
    console.log("Values from sorted set 'test-sorted-set' fetched by score successfully- ");
    result.valueArray().forEach(res => {
      console.log(`${res.value} : ${res.score}`);
    });
  } else if (result instanceof CacheSortedSetFetch.Miss) {
    console.log("Sorted Set 'test-sorted-set' was not found in cache 'test-cache'");
  } else if (result instanceof CacheSortedSetFetch.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheSortedSetFetchByScore on sorted set 'test-sorted-set' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_SortedSetGetRank(cacheClient: CacheClient) {
  await cacheClient.sortedSetPutElements(
    'test-cache',
    'test-sorted-set',
    new Map<string, number>([
      ['key1', 10],
      ['key2', 20],
      ['key3', 30],
    ])
  );
  const result = await cacheClient.sortedSetGetRank('test-cache', 'test-sorted-set', 'key2');
  if (result instanceof CacheSortedSetGetRank.Hit) {
    console.log(`Element with value 'key1' has rank: ${result.rank()}`);
  } else if (result instanceof CacheSortedSetGetRank.Miss) {
    console.log("Sorted Set 'test-sorted-set' was not found in cache 'test-cache'");
  } else if (result instanceof CacheSortedSetGetRank.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheSortedSetFetchGetRank on sorted set 'test-sorted-set' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_SortedSetGetScore(cacheClient: CacheClient) {
  await cacheClient.sortedSetPutElements(
    'test-cache',
    'test-sorted-set',
    new Map<string, number>([
      ['key1', 10],
      ['key2', 20],
    ])
  );
  const result = await cacheClient.sortedSetGetScore('test-cache', 'test-sorted-set', 'key1');
  if (result instanceof CacheSortedSetGetScore.Hit) {
    console.log(`Element with value 'key1' has score: ${result.score()}`);
  } else if (result instanceof CacheSortedSetGetScore.Miss) {
    console.log("Sorted Set 'test-sorted-set' was not found in cache 'test-cache'");
  } else if (result instanceof CacheSortedSetGetScore.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheSortedSetFetchGetScore on sorted set 'test-sorted-set' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_SortedSetGetScores(cacheClient: CacheClient) {
  await cacheClient.sortedSetPutElements(
    'test-cache',
    'test-sorted-set',
    new Map<string, number>([
      ['key1', 10],
      ['key2', 20],
    ])
  );
  const result = await cacheClient.sortedSetGetScores('test-cache', 'test-sorted-set', ['key1', 'key2']);
  if (result instanceof CacheSortedSetGetScores.Hit) {
    console.log('Element scores retrieved successfully -');
    result.valueMap().forEach((value, key) => {
      console.log(`${key} : ${value}`);
    });
  } else if (result instanceof CacheSortedSetGetScores.Miss) {
    console.log("Sorted Set 'test-sorted-set' was not found in cache 'test-cache'");
  } else if (result instanceof CacheSortedSetGetScores.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheSortedSetFetchGetScores on sorted set 'test-sorted-set' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_SortedSetIncrementScore(cacheClient: CacheClient) {
  await cacheClient.sortedSetPutElement('test-cache', 'test-sorted-set', 'test-value', 10);
  const result = await cacheClient.sortedSetIncrementScore('test-cache', 'test-sorted-set', 'test-value', 1);
  if (result instanceof CacheSortedSetIncrementScore.Success) {
    console.log(`Score for value 'test-value' incremented successfully. New score - ${result.score()}`);
  } else if (result instanceof CacheSortedSetIncrementScore.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheSortedSetIncrementScore on sorted set 'test-sorted-set' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_SortedSetRemoveElement(cacheClient: CacheClient) {
  await cacheClient.sortedSetPutElement('test-cache', 'test-sorted-set', 'test-value', 10);
  const result = await cacheClient.sortedSetRemoveElement('test-cache', 'test-sorted-set', 'test-value');
  if (result instanceof CacheSortedSetRemoveElement.Success) {
    console.log("Element with value 'test-value' removed successfully");
  } else if (result instanceof CacheSortedSetRemoveElement.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheSortedSetRemoveElement on sorted set 'test-sorted-set' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_SortedSetRemoveElements(cacheClient: CacheClient) {
  await cacheClient.sortedSetPutElements(
    'test-cache',
    'test-sorted-set',
    new Map<string, number>([
      ['key1', 10],
      ['key2', 20],
    ])
  );
  const result = await cacheClient.sortedSetRemoveElements('test-cache', 'test-sorted-set', ['key1', 'key2']);
  if (result instanceof CacheSortedSetRemoveElements.Success) {
    console.log("Elements with value 'key1' and 'key2 removed successfully");
  } else if (result instanceof CacheSortedSetRemoveElements.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheSortedSetRemoveElements on sorted set 'test-sorted-set' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

function example_API_InstantiateAuthClient() {
  new AuthClient({
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_AUTH_TOKEN',
    }),
  });
}

function example_API_InstantiateTopicClient() {
  new TopicClient({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_AUTH_TOKEN',
    }),
  });
}

async function example_API_GenerateAuthToken(authClient: AuthClient) {
  const generateTokenResponse = await authClient.generateAuthToken(AllDataReadWrite, ExpiresIn.minutes(30));
  if (generateTokenResponse instanceof GenerateAuthToken.Success) {
    console.log('Generated an auth token with AllDataReadWrite scope!');
    // logging only a substring of the tokens, because logging security credentials is not advisable :)
    console.log(`Auth token starts with: ${generateTokenResponse.authToken.substring(0, 10)}`);
    console.log(`Refresh token starts with: ${generateTokenResponse.refreshToken.substring(0, 10)}`);
    console.log(`Expires At: ${generateTokenResponse.expiresAt.epoch()}`);
  }
}

async function example_API_RefreshAuthToken(authClient: AuthClient) {
  const generateTokenResponse = await authClient.generateAuthToken(AllDataReadWrite, ExpiresIn.minutes(30));
  if (generateTokenResponse instanceof GenerateAuthToken.Success) {
    console.log('Generated auth token; refreshing!');
    const refreshAuthClient = new AuthClient({
      credentialProvider: CredentialProvider.fromString({authToken: generateTokenResponse.authToken}),
    });
    const refreshTokenResponse = await refreshAuthClient.refreshAuthToken(generateTokenResponse.refreshToken);
    if (refreshTokenResponse instanceof RefreshAuthToken.Success) {
      console.log('Auth token refreshed!');
      // logging only a substring of the tokens, because logging security credentials is not advisable :)
      console.log(`Refreshed auth token starts with: ${refreshTokenResponse.authToken.substring(0, 10)}`);
      console.log(`New refresh token starts with: ${refreshTokenResponse.refreshToken.substring(0, 10)}`);
      console.log(`Refreshed auth token expires At: ${refreshTokenResponse.expiresAt.epoch()}`);
    }
  }
}

async function example_API_TopicPublish(topicClient: TopicClient) {
  const result = await topicClient.publish('test-cache', 'test-topic', 'test-topic-value');
  if (result instanceof TopicPublish.Success) {
    console.log("Value published to topic 'test-topic'");
  } else if (result instanceof TopicPublish.Error) {
    throw new Error(
      `An error occurred while attempting to publish to the topic 'test-topic' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_TopicSubscribe(topicClient: TopicClient) {
  const result = await topicClient.subscribe('test-cache', 'test-topic', {
    onError: () => {
      return;
    },
    onItem: () => {
      console.log("Publishing values to the topic 'test-topic'!");
      return;
    },
  });
  if (result instanceof TopicSubscribe.Subscription) {
    console.log("Successfully subscribed to topic 'test-topic'");

    // Wait for stream to start.
    setTimeout(() => {
      console.log('Waiting for the stream to start');
    }, 2000);

    // Publish a value
    await topicClient.publish('test-cache', 'test-topic', 'test-value');

    // Wait for published values to be received.
    setTimeout(() => {
      console.log('Waiting for the published values');
    }, 2000);

    // Need to close the stream before the example ends or else the example will hang.
    result.unsubscribe();
  } else if (result instanceof TopicSubscribe.Error) {
    throw new Error(
      `An error occurred while attempting to subscribe to the topic 'test-topic' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

function example_API_InstantiatePingClient() {
  new InternalNodeGrpcPingClient({
    endpoint: 'some.url',
    configuration: Configurations.Laptop.latest(),
  });
}

async function example_API_Ping(pingClient: InternalNodeGrpcPingClient) {
  await pingClient
    .ping()
    .then(() => {
      console.log('pinged successfully!');
    })
    .catch(err => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.log(`failed to ping: ${err}`);
    });
}

async function main() {
  const originalAuthToken = process.env['MOMENTO_AUTH_TOKEN'];
  process.env['MOMENTO_AUTH_TOKEN'] = retrieveAuthTokenFromYourSecretsManager();
  example_API_CredentialProviderFromEnvVar();
  process.env['MOMENTO_AUTH_TOKEN'] = originalAuthToken;

  example_API_CredentialProviderFromString();
  example_API_ConfigurationLaptop();
  example_API_ConfigurationInRegionDefault();
  example_API_ConfigurationInRegionDefaultLatest();
  example_API_ConfigurationInRegionLowLatency();

  example_API_InstantiateCacheClient();
  example_API_InstantiateCacheClientWithMiddleware();
  const cacheClient = new CacheClient({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_AUTH_TOKEN',
    }),
    defaultTtlSeconds: 60,
  });

  await example_API_CreateCache(cacheClient);
  await example_API_ErrorHandlingHitMiss(cacheClient);
  await example_API_ErrorHandlingSuccess(cacheClient);

  await example_API_DeleteCache(cacheClient);
  await example_API_CreateCache(cacheClient);
  await example_API_ListCaches(cacheClient);
  await example_API_FlushCache(cacheClient);

  await example_API_Set(cacheClient);
  await example_API_Get(cacheClient);
  await example_API_Delete(cacheClient);
  await example_API_Increment(cacheClient);
  await example_API_ItemGetType(cacheClient);
  await example_API_SetIfNotExists(cacheClient);

  await example_API_ListFetch(cacheClient);
  await example_API_ListConcatenateBack(cacheClient);
  await example_API_ListConcatenateFront(cacheClient);
  await example_API_ListLength(cacheClient);
  await example_API_ListPopBack(cacheClient);
  await example_API_ListPopFront(cacheClient);
  await example_API_ListPushBack(cacheClient);
  await example_API_ListPushFront(cacheClient);
  await example_API_ListRemoveValue(cacheClient);
  await example_API_ListRetain(cacheClient);

  await example_API_DictionaryFetch(cacheClient);
  await example_API_DictionaryGetField(cacheClient);
  await example_API_DictionaryGetFields(cacheClient);
  await example_API_DictionarySetField(cacheClient);
  await example_API_DictionarySetFields(cacheClient);
  await example_API_DictionaryIncrement(cacheClient);
  await example_API_DictionaryRemoveField(cacheClient);
  await example_API_DictionaryRemoveFields(cacheClient);

  await example_API_SetAddElement(cacheClient);
  await example_API_SetAddElements(cacheClient);
  await example_API_SetFetch(cacheClient);
  await example_API_SetRemoveElement(cacheClient);
  await example_API_SetRemoveElements(cacheClient);

  await example_API_SortedSetPutElement(cacheClient);
  await example_API_SortedSetPutElements(cacheClient);
  await example_API_SortedSetFetchByRank(cacheClient);
  await example_API_SortedSetFetchByScore(cacheClient);
  await example_API_SortedSetGetRank(cacheClient);
  await example_API_SortedSetGetScore(cacheClient);
  await example_API_SortedSetGetScores(cacheClient);
  await example_API_SortedSetIncrementScore(cacheClient);
  await example_API_SortedSetRemoveElement(cacheClient);
  await example_API_SortedSetRemoveElements(cacheClient);

  example_API_InstantiateAuthClient();
  const authClient = new AuthClient({
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_AUTH_TOKEN',
    }),
  });
  await example_API_GenerateAuthToken(authClient);
  await example_API_RefreshAuthToken(authClient);

  example_API_InstantiateTopicClient();
  const topicClient = new TopicClient({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_AUTH_TOKEN',
    }),
  });
  await example_API_TopicPublish(topicClient);
  await example_API_TopicSubscribe(topicClient);

  example_API_InstantiatePingClient();
  const pingClient = new InternalNodeGrpcPingClient({
    endpoint: 'bad.url',
    configuration: Configurations.Laptop.latest(),
  });
  await example_API_Ping(pingClient);
}

main().catch(e => {
  throw e;
});
