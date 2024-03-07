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
  TokenScopes,
  DisposableTokenScopes,
  AllCaches,
  AllTopics,
  CacheRole,
  TopicRole,
  GenerateApiKey,
  RefreshApiKey,
  GenerateDisposableToken,
  CacheIncrement,
  CacheItemGetType,
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
  TopicItem,
  TopicConfigurations,
  PreviewLeaderboardClient,
  LeaderboardConfigurations,
  ILeaderboard,
  LeaderboardDelete,
  LeaderboardFetch,
  LeaderboardLength,
  LeaderboardOrder,
  LeaderboardRemoveElements,
  LeaderboardUpsert,
  ListWebhooks,
  DeleteWebhook,
  PutWebhook,
  RotateWebhookSecret,
  GetWebhookSecret,
  GetBatch,
  SetBatch,
} from '@gomomento/sdk';
import {delay} from '../utils/time';

function retrieveApiKeyFromYourSecretsManager(): string {
  // this is not a valid API key but conforms to the syntax requirements.
  const fakeTestV1ApiKey =
    'eyJhcGlfa2V5IjogImV5SjBlWEFpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5leUpwYzNNaU9pSlBibXhwYm1VZ1NsZFVJRUoxYVd4a1pYSWlMQ0pwWVhRaU9qRTJOemd6TURVNE1USXNJbVY0Y0NJNk5EZzJOVFV4TlRReE1pd2lZWFZrSWpvaUlpd2ljM1ZpSWpvaWFuSnZZMnRsZEVCbGVHRnRjR3hsTG1OdmJTSjkuOEl5OHE4NExzci1EM1lDb19IUDRkLXhqSGRUOFVDSXV2QVljeGhGTXl6OCIsICJlbmRwb2ludCI6ICJ0ZXN0Lm1vbWVudG9ocS5jb20ifQo=';
  return fakeTestV1ApiKey;
}

function example_API_CredentialProviderFromEnvVar() {
  CredentialProvider.fromEnvironmentVariable({environmentVariableName: 'MOMENTO_API_KEY'});
}

function example_API_CredentialProviderFromString() {
  const apiKey = retrieveApiKeyFromYourSecretsManager();
  CredentialProvider.fromString({apiKey: apiKey});
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

function example_API_ConfigurationLambdaLatest() {
  Configurations.Lambda.latest();
}

async function example_API_InstantiateCacheClient() {
  return await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
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
  if (result instanceof CacheItemGetType.Hit) {
    console.log(`Item type retrieved successfully: ${ItemType[result.itemType()]}`);
  } else if (result instanceof CacheItemGetType.Miss) {
    console.log("Key 'test-key' was not found in cache 'test-cache'");
  } else if (result instanceof CacheItemGetType.Error) {
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

async function example_API_SetBatch(cacheClient: CacheClient) {
  const values = new Map<string, string>([['abc', '123'], ['xyz', '321'], ['123', 'xyz'], ['321', 'abc']]);
  const result = await cacheClient.setBatch('test-cache', values);
  if (result instanceof SetBatch.Success) {
    console.log('Keys and values stored successfully');
  } else if (result instanceof SetBatch.Error) {
    throw new Error(
      `An error occurred while attempting to batch set in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_GetBatch(cacheClient: CacheClient) {
  const keys = ['abc', 'xyz', '123', '321'];
  const result = await cacheClient.getBatch('test-cache', keys);
  if (result instanceof GetBatch.Success) {
    const values = (result as GetBatch.Success).values();
    for (const key of keys) {
      console.log(`Retrieved value for key '${key}': ${values[key]}`);
    }
  } else if (result instanceof GetBatch.Error) {
    throw new Error(
      `An error occurred while attempting to batch get in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
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
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
  });
}

function example_API_InstantiateTopicClient() {
  new TopicClient({
    configuration: TopicConfigurations.Default.latest(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
  });
}

async function example_API_GenerateApiKey(authClient: AuthClient) {
  // Generate a token that allows all data plane APIs on all caches and topics.
  const allDataRWTokenResponse = await authClient.generateApiKey(AllDataReadWrite, ExpiresIn.minutes(30));
  if (allDataRWTokenResponse instanceof GenerateApiKey.Success) {
    console.log('Generated an API key with AllDataReadWrite scope!');
    // logging only a substring of the tokens, because logging security credentials is not advisable :)
    console.log(`API key starts with: ${allDataRWTokenResponse.apiKey.substring(0, 10)}`);
    console.log(`Refresh token starts with: ${allDataRWTokenResponse.refreshToken.substring(0, 10)}`);
    console.log(`Expires At: ${allDataRWTokenResponse.expiresAt.epoch()}`);
  } else if (allDataRWTokenResponse instanceof GenerateApiKey.Error) {
    throw new Error(
      `An error occurred while attempting to call generateApiKey with AllDataReadWrite scope: ${allDataRWTokenResponse.errorCode()}: ${allDataRWTokenResponse.toString()}`
    );
  }

  // Generate a token that can only call read-only data plane APIs on a specific cache foo. No topic apis (publish/subscribe) are allowed.
  const singleCacheROTokenResponse = await authClient.generateApiKey(
    TokenScopes.cacheReadOnly('foo'),
    ExpiresIn.minutes(30)
  );
  if (singleCacheROTokenResponse instanceof GenerateApiKey.Success) {
    console.log('Generated an API key with read-only access to cache foo!');
    // logging only a substring of the tokens, because logging security credentials is not advisable :)
    console.log(`API key starts with: ${singleCacheROTokenResponse.apiKey.substring(0, 10)}`);
    console.log(`Refresh token starts with: ${singleCacheROTokenResponse.refreshToken.substring(0, 10)}`);
    console.log(`Expires At: ${singleCacheROTokenResponse.expiresAt.epoch()}`);
  } else if (singleCacheROTokenResponse instanceof GenerateApiKey.Error) {
    throw new Error(
      `An error occurred while attempting to call generateApiKey with single cache read-only scope: ${singleCacheROTokenResponse.errorCode()}: ${singleCacheROTokenResponse.toString()}`
    );
  }

  // Generate a token that can call all data plane APIs on all caches. No topic apis (publish/subscribe) are allowed.
  const allCachesRWTokenResponse = await authClient.generateApiKey(
    TokenScopes.cacheReadWrite(AllCaches),
    ExpiresIn.minutes(30)
  );
  if (allCachesRWTokenResponse instanceof GenerateApiKey.Success) {
    console.log('Generated an API key with read-write access to all caches!');
    // logging only a substring of the tokens, because logging security credentials is not advisable :)
    console.log(`API key starts with: ${allCachesRWTokenResponse.apiKey.substring(0, 10)}`);
    console.log(`Refresh token starts with: ${allCachesRWTokenResponse.refreshToken.substring(0, 10)}`);
    console.log(`Expires At: ${allCachesRWTokenResponse.expiresAt.epoch()}`);
  } else if (allCachesRWTokenResponse instanceof GenerateApiKey.Error) {
    throw new Error(
      `An error occurred while attempting to call generateApiKey with all caches read-write scope: ${allCachesRWTokenResponse.errorCode()}: ${allCachesRWTokenResponse.toString()}`
    );
  }

  // Generate a token that can call publish and subscribe on all topics within cache bar
  const singleCacheAllTopicsRWTokenResponse = await authClient.generateApiKey(
    TokenScopes.topicPublishSubscribe({name: 'bar'}, AllTopics),
    ExpiresIn.minutes(30)
  );
  if (singleCacheAllTopicsRWTokenResponse instanceof GenerateApiKey.Success) {
    console.log('Generated an API key with publish-subscribe access to all topics within cache bar!');
    // logging only a substring of the tokens, because logging security credentials is not advisable :)
    console.log(`API key starts with: ${singleCacheAllTopicsRWTokenResponse.apiKey.substring(0, 10)}`);
    console.log(`Refresh token starts with: ${singleCacheAllTopicsRWTokenResponse.refreshToken.substring(0, 10)}`);
    console.log(`Expires At: ${singleCacheAllTopicsRWTokenResponse.expiresAt.epoch()}`);
  } else if (singleCacheAllTopicsRWTokenResponse instanceof GenerateApiKey.Error) {
    throw new Error(
      `An error occurred while attempting to call generateApiKey with read-write scope for all topics in a single cache: ${singleCacheAllTopicsRWTokenResponse.errorCode()}: ${singleCacheAllTopicsRWTokenResponse.toString()}`
    );
  }

  // Generate a token that can only call subscribe on topic where_is_mo within cache mo_nuts
  const oneCacheOneTopicRWTokenResponse = await authClient.generateApiKey(
    TokenScopes.topicSubscribeOnly('mo_nuts', 'where_is_mo'),
    ExpiresIn.minutes(30)
  );
  if (oneCacheOneTopicRWTokenResponse instanceof GenerateApiKey.Success) {
    console.log('Generated an API key with subscribe-only access to topic where_is_mo within cache mo_nuts!');
    // logging only a substring of the tokens, because logging security credentials is not advisable :)
    console.log(`API key starts with: ${oneCacheOneTopicRWTokenResponse.apiKey.substring(0, 10)}`);
    console.log(`Refresh token starts with: ${oneCacheOneTopicRWTokenResponse.refreshToken.substring(0, 10)}`);
    console.log(`Expires At: ${oneCacheOneTopicRWTokenResponse.expiresAt.epoch()}`);
  } else if (oneCacheOneTopicRWTokenResponse instanceof GenerateApiKey.Error) {
    throw new Error(
      `An error occurred while attempting to call generateApiKey with read-write scope for single topic in a single cache: ${oneCacheOneTopicRWTokenResponse.errorCode()}: ${oneCacheOneTopicRWTokenResponse.toString()}`
    );
  }

  // Generate a token with multiple permissions
  const cachePermission1 = {
    role: CacheRole.ReadWrite, // Managed role that grants access to read as well as write apis on caches
    cache: 'acorns', // Scopes the access to a single cache named 'acorns'
  };
  const cachePermission2 = {
    role: CacheRole.ReadOnly, // Managed role that grants access to only read data apis on caches
    cache: AllCaches, // Built-in value for access to all caches in the account
  };
  const topicPermission1 = {
    role: TopicRole.PublishSubscribe, // Managed role that grants access to subscribe as well as publish apis
    cache: 'walnuts', // Scopes the access to a single cache named 'walnuts'
    topic: 'mo_favorites', // Scopes the access to a single topic named 'mo_favorites' within cache 'walnuts'
  };
  const topicPermission2 = {
    role: TopicRole.SubscribeOnly, // Managed role that grants access to only subscribe api
    cache: AllCaches, // Built-in value for all cache(s) in the account.
    topic: AllTopics, // Built-in value for access to all topics in the listed cache(s).
  };

  const permissions = {
    permissions: [cachePermission1, cachePermission2, topicPermission1, topicPermission2],
  };

  const multiplePermsTokenResponse = await authClient.generateApiKey(permissions, ExpiresIn.minutes(30));
  if (multiplePermsTokenResponse instanceof GenerateApiKey.Success) {
    console.log('Generated an API key with multiple cache and topic permissions!');
    // logging only a substring of the tokens, because logging security credentials is not advisable :)
    console.log(`API key starts with: ${multiplePermsTokenResponse.apiKey.substring(0, 10)}`);
    console.log(`Refresh token starts with: ${multiplePermsTokenResponse.refreshToken.substring(0, 10)}`);
    console.log(`Expires At: ${multiplePermsTokenResponse.expiresAt.epoch()}`);
  } else if (multiplePermsTokenResponse instanceof GenerateApiKey.Error) {
    throw new Error(
      `An error occurred while attempting to call generateApiKey with multiple permissions: ${multiplePermsTokenResponse.errorCode()}: ${multiplePermsTokenResponse.toString()}`
    );
  }
}

async function example_API_RefreshApiKey(authClient: AuthClient) {
  const generateTokenResponse = await authClient.generateApiKey(AllDataReadWrite, ExpiresIn.minutes(30));
  if (generateTokenResponse instanceof GenerateApiKey.Success) {
    console.log('Generated API key; refreshing!');
    const refreshAuthClient = new AuthClient({
      credentialProvider: CredentialProvider.fromString({apiKey: generateTokenResponse.apiKey}),
    });
    const refreshTokenResponse = await refreshAuthClient.refreshApiKey(generateTokenResponse.refreshToken);
    if (refreshTokenResponse instanceof RefreshApiKey.Success) {
      console.log('API key refreshed!');
      // logging only a substring of the tokens, because logging security credentials is not advisable :)
      console.log(`Refreshed API key starts with: ${refreshTokenResponse.apiKey.substring(0, 10)}`);
      console.log(`New refresh token starts with: ${refreshTokenResponse.refreshToken.substring(0, 10)}`);
      console.log(`Refreshed API key expires At: ${refreshTokenResponse.expiresAt.epoch()}`);
    }
  }
}

async function example_API_GenerateDisposableToken(authClient: AuthClient) {
  // Generate a disposable token with read-write access to a specific key in one cache
  const oneKeyOneCacheToken = await authClient.generateDisposableToken(
    DisposableTokenScopes.cacheKeyReadWrite('squirrels', 'mo'),
    ExpiresIn.minutes(30)
  );
  if (oneKeyOneCacheToken instanceof GenerateDisposableToken.Success) {
    console.log('Generated a disposable API key with access to the "mo" key in the "squirrels" cache!');
    // logging only a substring of the tokens, because logging security credentials is not advisable :)
    console.log(`API key starts with: ${oneKeyOneCacheToken.authToken.substring(0, 10)}`);
    console.log(`Expires At: ${oneKeyOneCacheToken.expiresAt.epoch()}`);
  } else if (oneKeyOneCacheToken instanceof GenerateDisposableToken.Error) {
    throw new Error(
      `An error occurred while attempting to call generateApiKey with disposable token scope: ${oneKeyOneCacheToken.errorCode()}: ${oneKeyOneCacheToken.toString()}`
    );
  }

  // Generate a disposable token with read-write access to a specific key prefix in all caches
  const keyPrefixAllCachesToken = await authClient.generateDisposableToken(
    DisposableTokenScopes.cacheKeyPrefixReadWrite(AllCaches, 'squirrel'),
    ExpiresIn.minutes(30)
  );
  if (keyPrefixAllCachesToken instanceof GenerateDisposableToken.Success) {
    console.log('Generated a disposable API key with access to keys prefixed with "squirrel" in all caches!');
    // logging only a substring of the tokens, because logging security credentials is not advisable :)
    console.log(`API key starts with: ${keyPrefixAllCachesToken.authToken.substring(0, 10)}`);
    console.log(`Expires At: ${keyPrefixAllCachesToken.expiresAt.epoch()}`);
  } else if (keyPrefixAllCachesToken instanceof GenerateDisposableToken.Error) {
    throw new Error(
      `An error occurred while attempting to call generateApiKey with disposable token scope: ${keyPrefixAllCachesToken.errorCode()}: ${keyPrefixAllCachesToken.toString()}`
    );
  }

  // Generate a disposable token with read-only access to all topics in one cache
  const allTopicsOneCacheToken = await authClient.generateDisposableToken(
    TokenScopes.topicSubscribeOnly('squirrel', AllTopics),
    ExpiresIn.minutes(30)
  );
  if (allTopicsOneCacheToken instanceof GenerateDisposableToken.Success) {
    console.log('Generated a disposable API key with access to all topics in the "squirrel" cache!');
    // logging only a substring of the tokens, because logging security credentials is not advisable :)
    console.log(`API key starts with: ${allTopicsOneCacheToken.authToken.substring(0, 10)}`);
    console.log(`Expires At: ${allTopicsOneCacheToken.expiresAt.epoch()}`);
  } else if (allTopicsOneCacheToken instanceof GenerateDisposableToken.Error) {
    throw new Error(
      `An error occurred while attempting to call generateApiKey with disposable token scope: ${allTopicsOneCacheToken.errorCode()}: ${allTopicsOneCacheToken.toString()}`
    );
  }

  // Generate a disposable token with write-only access to a single topic in all caches
  const oneTopicAllCachesToken = await authClient.generateDisposableToken(
    TokenScopes.topicPublishOnly(AllCaches, 'acorn'),
    ExpiresIn.minutes(30)
  );
  if (oneTopicAllCachesToken instanceof GenerateDisposableToken.Success) {
    console.log('Generated a disposable API key with access to all topics in the "squirrel" cache!');
    // logging only a substring of the tokens, because logging security credentials is not advisable :)
    console.log(`API key starts with: ${oneTopicAllCachesToken.authToken.substring(0, 10)}`);
    console.log(`Expires At: ${oneTopicAllCachesToken.expiresAt.epoch()}`);
  } else if (oneTopicAllCachesToken instanceof GenerateDisposableToken.Error) {
    throw new Error(
      `An error occurred while attempting to call generateApiKey with disposable token scope: ${oneTopicAllCachesToken.errorCode()}: ${oneTopicAllCachesToken.toString()}`
    );
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
    onItem: (item: TopicItem) => {
      console.log(`Publishing values to the topic 'test-topic': ${item.value().toString()}`);
      return;
    },
  });
  if (result instanceof TopicSubscribe.Subscription) {
    console.log("Successfully subscribed to topic 'test-topic'");

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

async function example_API_ListWebhooks(topicClient: TopicClient) {
  const result = await topicClient.listWebhooks('test-cache');
  if (result instanceof ListWebhooks.Success) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`listed webhooks: ${result.getWebhooks()}`);
  } else if (result instanceof ListWebhooks.Error) {
    throw new Error(
      `An error occurred while attempting to list webhooks for cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_DeleteWebhook(topicClient: TopicClient) {
  const result = await topicClient.deleteWebhook('test-cache', 'a webhook');
  if (result instanceof DeleteWebhook.Success) {
    console.log('successfully deleted webhook');
  } else if (result instanceof ListWebhooks.Error) {
    throw new Error(
      `An error occurred while attempting to delete webhook 'a webhook' inside of cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_PutWebhook(topicClient: TopicClient) {
  const result = await topicClient.putWebhook('test-cache', 'examples webhook', {
    topicName: 'a topic',
    destination: 'https://www.thisisawebhookurl.com/v1/webhook',
  });
  if (result instanceof PutWebhook.Success) {
    console.log('successfully created webhook');
  } else if (result instanceof PutWebhook.Error) {
    throw new Error(
      `An error occurred while attempting to create a webhook 'examples webhook' inside of cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_RotateWebhookSecret(topicClient: TopicClient) {
  const result = await topicClient.rotateWebhookSecret('test-cache', 'examples webhook');
  if (result instanceof RotateWebhookSecret.Success) {
    console.log('successfully rotated the webhook secret');
  } else if (result instanceof RotateWebhookSecret.Error) {
    throw new Error(
      `An error occurred while attempting to rotate the secret for the webhook 'examples webhook' inside of cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_GetWebhookSecret(topicClient: TopicClient) {
  const result = await topicClient.getWebhookSecret('test-cache', 'examples webhook');
  if (result instanceof GetWebhookSecret.Success) {
    console.log('successfully retrieved the webhook secret');
  } else if (result instanceof GetWebhookSecret.Error) {
    throw new Error(
      `An error occurred while attempting to fetch the secret for the webhook 'examples webhook' inside of cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

function example_API_InstantiateLeaderboardClient() {
  new PreviewLeaderboardClient({
    configuration: LeaderboardConfigurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
  });
}

function example_API_CreateLeaderboard(leaderboardClient: PreviewLeaderboardClient) {
  // You can create multiple leaderboards using the same leaderboard client
  // but with different cache and leaderboard names
  leaderboardClient.leaderboard('test-cache', 'momento-leaderboard');
  leaderboardClient.leaderboard('test-cache', 'acorns-leaderboard');

  // Leaderboard and cache names must be non-empty strings
  try {
    leaderboardClient.leaderboard('test-cache', '   ');
  } catch (error) {
    console.log('Expected error creating a leaderboard with invalid leaderboard name:', error);
  }
}

async function example_API_LeaderboardUpsert(leaderboard: ILeaderboard) {
  // Upsert a set of elements as a Map
  const elements1: Map<number, number> = new Map([
    [123, 100.0],
    [234, 200.0],
    [345, 300.0],
    [456, 400.0],
  ]);
  const result1 = await leaderboard.upsert(elements1);
  if (result1 instanceof LeaderboardUpsert.Success) {
    console.log('Successfully upserted elements to leaderboard');
  } else if (result1 instanceof LeaderboardUpsert.Error) {
    console.log('Upsert error:', result1.message());
    throw new Error(
      `An error occurred while attempting to call upsert on leaderboard 'momento-leaderboard' in cache 'test-cache': ${result1.errorCode()}: ${result1.message()}`
    );
  }

  // Or upsert a set of elements as a Record
  const elements2: Record<number, number> = {
    567: 500,
    678: 600,
    789: 700,
    890: 800,
  };
  const result2 = await leaderboard.upsert(elements2);
  if (result2 instanceof LeaderboardUpsert.Success) {
    console.log('Successfully upserted elements to leaderboard');
  } else if (result2 instanceof LeaderboardUpsert.Error) {
    console.log('Upsert error:', result2.message());
    throw new Error(
      `An error occurred while attempting to call upsert on leaderboard 'momento-leaderboard' in cache 'test-cache': ${result2.errorCode()}: ${result2.message()}`
    );
  }
}

async function example_API_LeaderboardUpsertPagination(leaderboard: ILeaderboard) {
  // To upsert a large number of elements, you must upsert
  // in batches of up to 8192 elements at a time.
  const elements = [...Array(20000).keys()].map(i => {
    return {id: i + 1, score: i * Math.random()};
  });
  for (let i = 0; i < 20000; i += 8192) {
    // Create a Map containing 8192 elements at a time
    const batch = new Map(elements.slice(i, i + 8192).map(obj => [obj['id'], obj['score']]));

    // Then upsert one batch at a time until all elements have been ingested
    const result = await leaderboard.upsert(batch);
    if (result instanceof LeaderboardUpsert.Error) {
      console.log(`Error upserting batch [${i}, ${i + 8192})`);
    }
  }
}

async function example_API_LeaderboardFetchByScore(leaderboard: ILeaderboard) {
  // By default, FetchByScore will fetch the elements from the entire score range
  // with zero offset in ascending order. It can return 8192 elements at a time.
  const result1 = await leaderboard.fetchByScore();
  if (result1 instanceof LeaderboardFetch.Success) {
    console.log('Successfully fetched elements using open score range:');
    result1.values().forEach(element => {
      console.log(`\tId: ${element.id} | Rank: ${element.rank} | Score: ${element.score}`);
    });
  } else if (result1 instanceof LeaderboardFetch.Error) {
    throw new Error(
      `An error occurred while attempting to call fetchByScore with no options on leaderboard 'momento-leaderboard' in cache 'test-cache': ${result1.errorCode()}: ${result1.message()}`
    );
  }

  // Example specifying all FetchByScore options. You can provide any subset of these options
  // to modify your FetchByScore request.
  const result2 = await leaderboard.fetchByScore({
    minScore: 10,
    maxScore: 600,
    order: LeaderboardOrder.Descending,
    offset: 2,
    count: 10,
  });
  if (result2 instanceof LeaderboardFetch.Success) {
    console.log('Successfully fetched elements by score using all options:');
    result2.values().forEach(element => {
      console.log(`\tId: ${element.id} | Rank: ${element.rank} | Score: ${element.score}`);
    });
  } else if (result2 instanceof LeaderboardFetch.Error) {
    throw new Error(
      `An error occurred while attempting to call fetchByScore with all options on leaderboard 'momento-leaderboard' in cache 'test-cache': ${result2.errorCode()}: ${result2.message()}`
    );
  }
}

function processBatch(
  values: {
    id: number;
    score: number;
    rank: number;
  }[]
) {
  console.log('Empty function', values.length);
}

async function example_API_LeaderboardFetchByScorePagination(leaderboard: ILeaderboard) {
  // Use the offset option to paginate through your results if your leaderboard
  // has more than 8192 elements.
  for (let offset = 0; offset < 20000; offset += 8192) {
    const result = await leaderboard.fetchByScore({offset});
    if (result instanceof LeaderboardFetch.Success) {
      processBatch(result.values());
    } else if (result instanceof LeaderboardFetch.Error) {
      console.log(
        `Error fetching batch by score [${offset}, ${offset + 8192}) (${result.errorCode()}: ${result.message()})`
      );
    }
  }
}

async function example_API_LeaderboardFetchByRank(leaderboard: ILeaderboard) {
  // By default, FetchByRank will fetch the elements in the range [startRank, endRank)
  // in ascending order, meaning rank 0 is for the lowest score.
  const result1 = await leaderboard.fetchByRank(0, 10);
  if (result1 instanceof LeaderboardFetch.Success) {
    console.log('Successfully fetched elements in rank range [0,10)');
    result1.values().forEach(element => {
      console.log(`\tId: ${element.id} | Rank: ${element.rank} | Score: ${element.score}`);
    });
  } else if (result1 instanceof LeaderboardFetch.Error) {
    throw new Error(
      `An error occurred while attempting to call fetchByRank with no options on leaderboard 'momento-leaderboard' in cache 'test-cache': ${result1.errorCode()}: ${result1.message()}`
    );
  }
}

async function example_API_LeaderboardFetchByRankPagination(leaderboard: ILeaderboard) {
  // Use the startRank and endRank options to paginate through your leaderboard
  // if your leaderboard has more than 8192 elements
  for (let rank = 0; rank < 20000; rank += 8192) {
    const result = await leaderboard.fetchByRank(rank, rank + 8192, {order: LeaderboardOrder.Descending});
    if (result instanceof LeaderboardFetch.Success) {
      processBatch(result.values());
    } else if (result instanceof LeaderboardFetch.Error) {
      console.log(
        `Error fetching batch by rank [${rank}, ${rank + 8192}) (${result.errorCode()}: ${result.message()})`
      );
    }
  }
}

async function example_API_LeaderboardGetRank(leaderboard: ILeaderboard) {
  // Provide a list of element IDs to get their ranks in ascending or descending order
  const result = await leaderboard.getRank([123, 456, 789], {
    order: LeaderboardOrder.Descending,
  });
  if (result instanceof LeaderboardFetch.Success) {
    console.log('Successfully fetched the rank of 3 elements:');
    result.values().forEach(element => {
      console.log(`\tId: ${element.id} | Rank: ${element.rank} | Score: ${element.score}`);
    });
  } else if (result instanceof LeaderboardFetch.Error) {
    throw new Error(
      `An error occurred while attempting to call getRank on leaderboard 'momento-leaderboard' in cache 'test-cache': ${result.errorCode()}: ${result.message()}`
    );
  }
}

async function example_API_LeaderboardLength(leaderboard: ILeaderboard) {
  const result = await leaderboard.length();
  if (result instanceof LeaderboardLength.Success) {
    console.log('Successfully retrieved leaderboard length:', result.length());
  } else if (result instanceof LeaderboardLength.Error) {
    throw new Error(
      `An error occurred while attempting to call length on leaderboard 'momento-leaderboard' in cache 'test-cache': ${result.errorCode()}: ${result.message()}`
    );
  }
}

async function example_API_LeaderboardRemoveElements(leaderboard: ILeaderboard) {
  // Provide a list of element IDs to delete those elements
  const result = await leaderboard.removeElements([123, 456, 789]);
  if (result instanceof LeaderboardRemoveElements.Success) {
    console.log('Successfully removed elements');
  } else if (result instanceof LeaderboardRemoveElements.Error) {
    throw new Error(
      `An error occurred while attempting to call removeElements on leaderboard 'momento-leaderboard' in cache 'test-cache': ${result.errorCode()}: ${result.message()}`
    );
  }
}

async function example_API_LeaderboardRemoveElementsPagination(leaderboard: ILeaderboard) {
  // You can remove batches of 8192 elements at a time
  const ids = [...Array(20000).keys()];
  for (let i = 0; i < 20000; i += 8192) {
    const result = await leaderboard.removeElements(ids.slice(i, i + 8192));
    if (result instanceof LeaderboardRemoveElements.Error) {
      console.log(`Error removing batch [${i}, ${i + 8192}) (${result.errorCode()}: ${result.message()})`);
    }
  }
}

async function example_API_LeaderboardDelete(leaderboard: ILeaderboard) {
  const result = await leaderboard.delete();
  if (result instanceof LeaderboardDelete.Success) {
    console.log('Successfully deleted the leaderboard');
  } else if (result instanceof LeaderboardDelete.Error) {
    throw new Error(
      `An error occurred while attempting to call delete on leaderboard 'momento-leaderboard' in cache 'test-cache': ${result.errorCode()}: ${result.message()}`
    );
  }
}

async function main() {
  const originalApiKey = process.env['MOMENTO_API_KEY'];
  process.env['MOMENTO_API_KEY'] = retrieveApiKeyFromYourSecretsManager();
  example_API_CredentialProviderFromEnvVar();
  process.env['MOMENTO_API_KEY'] = originalApiKey;

  example_API_CredentialProviderFromString();
  example_API_ConfigurationLaptop();
  example_API_ConfigurationInRegionDefault();
  example_API_ConfigurationInRegionDefaultLatest();
  example_API_ConfigurationInRegionLowLatency();
  example_API_ConfigurationLambdaLatest();

  await example_API_InstantiateCacheClient();

  const cacheClient = await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
    defaultTtlSeconds: 60,
  });

  // Sleep for a sec to make sure we don't hit rate limits
  await delay(5_000);

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
  await example_API_SetBatch(cacheClient);
  await example_API_GetBatch(cacheClient);

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
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
  });
  await example_API_GenerateApiKey(authClient);
  await example_API_RefreshApiKey(authClient);
  await example_API_GenerateDisposableToken(authClient);

  example_API_InstantiateTopicClient();
  const topicClient = new TopicClient({
    configuration: TopicConfigurations.Default.latest(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
  });
  await example_API_TopicPublish(topicClient);
  await example_API_TopicSubscribe(topicClient);

  // Webhooks
  await example_API_ListWebhooks(topicClient);
  await example_API_DeleteWebhook(topicClient);
  await example_API_PutWebhook(topicClient);
  await example_API_RotateWebhookSecret(topicClient);
  await example_API_GetWebhookSecret(topicClient);

  example_API_InstantiateLeaderboardClient();
  const leaderboardClient = new PreviewLeaderboardClient({
    configuration: LeaderboardConfigurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
  });
  const leaderboard = leaderboardClient.leaderboard('test-cache', 'momento-leaderboard');
  example_API_CreateLeaderboard(leaderboardClient);
  await example_API_LeaderboardUpsert(leaderboard);
  await example_API_LeaderboardFetchByScore(leaderboard);
  await example_API_LeaderboardFetchByRank(leaderboard);
  await example_API_LeaderboardGetRank(leaderboard);
  await example_API_LeaderboardLength(leaderboard);
  await example_API_LeaderboardRemoveElements(leaderboard);
  await example_API_LeaderboardDelete(leaderboard);

  // Sleep for a while to replenish rate limits before running other tests
  await delay(20_000);

  await example_API_LeaderboardFetchByRankPagination(leaderboard);

  // Sleep for a while to replenish rate limits before running other tests
  await delay(20_000);

  await example_API_LeaderboardFetchByScorePagination(leaderboard);

  // Sleep for a while to replenish rate limits before running other tests
  await delay(20_000);

  await example_API_LeaderboardUpsertPagination(leaderboard);

  // Sleep for a while to replenish rate limits before running other tests
  await delay(20_000);

  await example_API_LeaderboardRemoveElementsPagination(leaderboard);

  // Sleep for a while to replenish rate limits before running other tests
  await delay(20_000);

  await example_API_LeaderboardUpsertPagination(leaderboard);

  // Sleep for a while to replenish rate limits before running other tests
  await delay(60_000);
}

main().catch(e => {
  throw e;
});
