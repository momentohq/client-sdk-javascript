/* eslint-disable @typescript-eslint/restrict-template-expressions */

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
  AllCaches,
  AllDataReadWrite,
  AllTopics,
  AuthClient,
  CacheClient,
  CacheDeleteResponse,
  CacheDictionaryFetchResponse,
  CacheDictionaryGetFieldResponse,
  CacheDictionaryGetFieldsResponse,
  CacheDictionaryIncrementResponse,
  CacheDictionaryRemoveFieldResponse,
  CacheDictionaryRemoveFieldsResponse,
  CacheDictionarySetFieldResponse,
  CacheDictionarySetFieldsResponse,
  CacheGetBatchResponse,
  CacheGetResponse,
  CacheIncrementResponse,
  CacheItemGetTypeResponse,
  CacheKeyExistsResponse,
  CacheKeysExistResponse,
  CacheListConcatenateBackResponse,
  CacheListConcatenateFrontResponse,
  CacheListFetchResponse,
  CacheListLengthResponse,
  CacheListPopBackResponse,
  CacheListPopFrontResponse,
  CacheListPushBackResponse,
  CacheListPushFrontResponse,
  CacheListRemoveValueResponse,
  CacheListRetainResponse,
  CacheRole,
  CacheSetAddElementResponse,
  CacheSetAddElementsResponse,
  CacheSetBatchResponse,
  CacheSetFetchResponse,
  CacheSetIfAbsentOrEqualResponse,
  CacheSetIfAbsentOrHashEqualResponse,
  CacheSetIfAbsentOrHashNotEqualResponse,
  CacheSetIfAbsentResponse,
  CacheSetIfEqualResponse,
  CacheSetIfNotEqualResponse,
  CacheSetIfNotExistsResponse,
  CacheSetIfPresentAndNotEqualResponse,
  CacheSetIfPresentResponse,
  CacheSetIfPresentAndHashNotEqualResponse,
  CacheSetRemoveElementResponse,
  CacheSetRemoveElementsResponse,
  CacheSetResponse,
  CacheSetSampleResponse,
  CacheSortedSetFetchResponse,
  CacheSortedSetGetRankResponse,
  CacheSortedSetGetScoreResponse,
  CacheSortedSetGetScoresResponse,
  CacheSortedSetIncrementScoreResponse,
  CacheSortedSetPutElementResponse,
  CacheSortedSetPutElementsResponse,
  CacheSortedSetRemoveElementResponse,
  CacheSortedSetRemoveElementsResponse,
  CacheSortedSetUnionStoreResponse,
  CacheSetWithHashResponse,
  CacheGetWithHashResponse,
  Configurations,
  CreateCacheResponse,
  CredentialProvider,
  DeleteCacheResponse,
  DisposableTokenScopes,
  ExpiresIn,
  FlushCacheResponse,
  GenerateApiKey,
  GenerateApiKeyResponse,
  GenerateDisposableTokenResponse,
  ILeaderboard,
  ItemType,
  LeaderboardConfigurations,
  LeaderboardDeleteResponse,
  LeaderboardFetchResponse,
  LeaderboardLengthResponse,
  LeaderboardOrder,
  LeaderboardRemoveElementsResponse,
  LeaderboardUpsertResponse,
  ListCachesResponse,
  PreviewLeaderboardClient,
  ReadConcern,
  RefreshApiKeyResponse,
  SortedSetSource,
  TokenScopes,
  TopicClient,
  TopicConfigurations,
  TopicItem,
  TopicPublishResponse,
  TopicRole,
  TopicSubscribeResponse,
  CacheSetWithHash,
  CacheSetIfPresentAndHashEqualResponse,
} from '@gomomento/sdk';
import * as crypto from 'crypto';
import {TextEncoder} from 'util';

function retrieveApiKeyFromYourSecretsManager(): string {
  // this is not a valid API key but conforms to the syntax requirements.
  const fakeTestV1ApiKey =
    'eyJhcGlfa2V5IjogImV5SjBlWEFpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5leUpwYzNNaU9pSlBibXhwYm1VZ1NsZFVJRUoxYVd4a1pYSWlMQ0pwWVhRaU9qRTJOemd6TURVNE1USXNJbVY0Y0NJNk5EZzJOVFV4TlRReE1pd2lZWFZrSWpvaUlpd2ljM1ZpSWpvaWFuSnZZMnRsZEVCbGVHRnRjR3hsTG1OdmJTSjkuOEl5OHE4NExzci1EM1lDb19IUDRkLXhqSGRUOFVDSXV2QVljeGhGTXl6OCIsICJlbmRwb2ludCI6ICJ0ZXN0Lm1vbWVudG9ocS5jb20ifQo=';
  return fakeTestV1ApiKey;
}

function example_API_CredentialProviderFromEnvVar() {
  CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY');
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
    credentialProvider: CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY'),
    defaultTtlSeconds: 60,
  });
}

async function example_API_InstantiateCacheClientWithReadConcern() {
  return await CacheClient.create({
    configuration: Configurations.Laptop.v1().withReadConcern(ReadConcern.CONSISTENT),
    credentialProvider: CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY'),
    defaultTtlSeconds: 60,
  });
}

async function example_API_ErrorHandlingHitMiss(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.get(cacheName, 'test-key');
  switch (result.type) {
    case CacheGetResponse.Hit:
      console.log(`Retrieved value for key 'test-key': ${result.valueString()}`);
      break;
    case CacheGetResponse.Miss:
      console.log(`Key 'test-key' was not found in cache '${cacheName}'`);
      break;
    case CacheGetResponse.Error:
      throw new Error(
        `An error occurred while attempting to get key 'test-key' from cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_ErrorHandlingSuccess(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.set(cacheName, 'test-key', 'test-value');
  switch (result.type) {
    case CacheSetResponse.Success:
      console.log("Key 'test-key' stored successfully");
      break;
    case CacheSetResponse.Error:
      throw new Error(
        `An error occurred while attempting to store key 'test-key' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_CreateCache(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.createCache(cacheName);
  switch (result.type) {
    case CreateCacheResponse.AlreadyExists:
      console.log(`Cache '${cacheName}' already exists`);
      break;
    case CreateCacheResponse.Success:
      console.log(`Cache '${cacheName}' created`);
      break;
    case CreateCacheResponse.Error:
      throw new Error(
        `An error occurred while attempting to create cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_DeleteCache(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.deleteCache(cacheName);
  switch (result.type) {
    case DeleteCacheResponse.Success:
      console.log(`Cache '${cacheName}' deleted`);
      break;
    case DeleteCacheResponse.Error:
      throw new Error(
        `An error occurred while attempting to delete cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_ListCaches(cacheClient: CacheClient) {
  const result = await cacheClient.listCaches();
  switch (result.type) {
    case ListCachesResponse.Success:
      console.log(
        `Caches:\n${result
          .getCaches()
          .map(c => c.getName())
          .join('\n')}\n\n`
      );
      break;
    case ListCachesResponse.Error:
      throw new Error(`An error occurred while attempting to list caches: ${result.errorCode()}: ${result.toString()}`);
  }
}

async function example_API_FlushCache(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.flushCache(cacheName);
  switch (result.type) {
    case FlushCacheResponse.Success:
      console.log(`Cache '${cacheName}' flushed`);
      break;
    case FlushCacheResponse.Error:
      throw new Error(
        `An error occurred while attempting to flush cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_Set(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.set(cacheName, 'test-key', 'test-value');
  switch (result.type) {
    case CacheSetResponse.Success:
      console.log("Key 'test-key' stored successfully");
      break;
    case CacheSetResponse.Error:
      throw new Error(
        `An error occurred while attempting to store key 'test-key' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SetWithHash(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.setWithHash(cacheName, 'test-key', 'test-value');
  switch (result.type) {
    case CacheSetWithHashResponse.Stored:
      console.log(`Successfully set Key 'test-key' in cache, item has new hash '${result.hashString()}`);
      break;
    case CacheSetWithHashResponse.NotStored:
      console.log("Unable to set Key 'test-key' ");
      break;
    case CacheSetWithHashResponse.Error:
      throw new Error(
        `An error occurred while attempting to store key 'test-key' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_Get(cacheClient: CacheClient, cacheName: string) {
  const getResponse = await cacheClient.get(cacheName, 'test-key');
  // simplified style; assume the value was found
  console.log(`cache hit: ${getResponse.value()!}`);

  // pattern-matching style; safer for production code
  switch (getResponse.type) {
    case CacheGetResponse.Hit:
      console.log(`Retrieved value for key 'test-key': ${getResponse.valueString()}`);
      break;
    case CacheGetResponse.Miss:
      console.log(`Key 'test-key' was not found in cache '${cacheName}'`);
      break;
    case CacheGetResponse.Error:
      throw new Error(
        `An error occurred while attempting to get key 'test-key' from cache '${cacheName}': ${getResponse.errorCode()}: ${getResponse.toString()}`
      );
  }
}

async function example_API_GetWithHash(cacheClient: CacheClient, cacheName: string) {
  const getResponse = await cacheClient.getWithHash(cacheName, 'test-key');
  // simplified style; assume the value was found
  console.log(`cache hit: value: ${getResponse.value()!}, hash: ${getResponse.hash()!}`);

  // pattern-matching style; safer for production code
  switch (getResponse.type) {
    case CacheGetWithHashResponse.Hit:
      console.log(
        `Retrieved value for key 'test-key': ${getResponse.valueString()} with hash: ${getResponse.hashString()}`
      );
      break;
    case CacheGetWithHashResponse.Miss:
      console.log(`Key 'test-key' was not found in cache '${cacheName}'`);
      break;
    case CacheGetWithHashResponse.Error:
      throw new Error(
        `An error occurred while attempting to get key 'test-key' from cache '${cacheName}': ${getResponse.errorCode()}: ${getResponse.toString()}`
      );
  }
}

async function example_API_Delete(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.delete(cacheName, 'test-key');
  switch (result.type) {
    case CacheDeleteResponse.Success:
      console.log("Key 'test-key' deleted successfully");
      break;
    case CacheDeleteResponse.Error:
      throw new Error(
        `An error occurred while attempting to delete key 'test-key' from cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_Increment(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.set(cacheName, 'test-key', '10');
  const result = await cacheClient.increment(cacheName, 'test-key', 1);
  switch (result.type) {
    case CacheIncrementResponse.Success:
      console.log(`Key 'test-key' incremented successfully. New value in key test-key: ${result.valueNumber()}`);
      break;
    case CacheIncrementResponse.Error:
      throw new Error(
        `An error occurred while attempting to increment the value of key 'test-key' from cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_ItemGetType(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.itemGetType(cacheName, 'test-key');
  switch (result.type) {
    case CacheItemGetTypeResponse.Hit:
      console.log(`Item type retrieved successfully: ${ItemType[result.itemType()]}`);
      break;
    case CacheItemGetTypeResponse.Miss:
      console.log("Key 'test-key' was not found in cache '${cacheName}'");
      break;
    case CacheItemGetTypeResponse.Error:
      throw new Error(
        `An error occurred while attempting to get the type of key 'test-key' from cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SetIfNotExists(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.setIfNotExists(cacheName, 'test-key', 'test-field');
  switch (result.type) {
    case CacheSetIfNotExistsResponse.Stored:
      console.log("Field 'test-field' set in key 'test-key'");
      break;
    case CacheSetIfNotExistsResponse.NotStored:
      console.log(`Key 'test-key' already exists in cache '${cacheName}', so we did not overwrite it`);
      break;
    case CacheSetIfNotExistsResponse.Error:
      throw new Error(
        `An error occurred while attempting to call setIfNotExists for the key 'test-key' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SetIfPresent(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.setIfPresent(cacheName, 'test-key', 'test-field');
  switch (result.type) {
    case CacheSetIfPresentResponse.Stored:
      console.log("Field 'test-field' set in key 'test-key'");
      break;
    case CacheSetIfPresentResponse.NotStored:
      console.log(`Key 'test-key' does not exist in cache ${cacheName}, so we did not set the field`);
      break;
    case CacheSetIfPresentResponse.Error:
      throw new Error(
        `An error occurred while attempting to call setIfPresent for the key 'test-key' in cache cacheName: ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SetIfAbsent(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.setIfAbsent(cacheName, 'test-key', 'test-field');
  switch (result.type) {
    case CacheSetIfAbsentResponse.Stored:
      console.log("Field 'test-field' set in key 'test-key'");
      break;
    case CacheSetIfAbsentResponse.NotStored:
      console.log(`Key 'test-key' already exists in cache ${cacheName}, so we did not overwrite it`);
      break;
    case CacheSetIfAbsentResponse.Error:
      throw new Error(
        `An error occurred while attempting to call setIfAbsent for the key 'test-key' in cache cacheName: ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SetIfEqual(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.setIfEqual(cacheName, 'test-key', 'test-field', 'value-to-check');
  switch (result.type) {
    case CacheSetIfEqualResponse.Stored:
      console.log("Field 'test-field' set in key 'test-key'");
      break;
    case CacheSetIfEqualResponse.NotStored:
      console.log("Value of key 'test-key' does not equal 'value-to-check', so we did not set the field");
      break;
    case CacheSetIfEqualResponse.Error:
      throw new Error(
        `An error occurred while attempting to call setIfEqual for the key 'test-key' in cache cacheName: ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SetIfNotEqual(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.setIfNotEqual(cacheName, 'test-key', 'test-field', 'value-to-check');
  switch (result.type) {
    case CacheSetIfNotEqualResponse.Stored:
      console.log("Field 'test-field' set in key 'test-key'");
      break;
    case CacheSetIfNotEqualResponse.NotStored:
      console.log("Value of key 'test-key' equals 'value-to-check', so we did not set the field");
      break;
    case CacheSetIfNotEqualResponse.Error:
      throw new Error(
        `An error occurred while attempting to call setIfNotEqual for the key 'test-key' in cache cacheName: ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SetIfPresentAndNotEqual(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.setIfPresentAndNotEqual(cacheName, 'test-key', 'test-field', 'value-to-check');
  switch (result.type) {
    case CacheSetIfPresentAndNotEqualResponse.Stored:
      console.log("Field 'test-field' set in key 'test-key'");
      break;
    case CacheSetIfPresentAndNotEqualResponse.NotStored:
      console.log(
        `Key 'test-key' does not exist in cache ${cacheName} or equals 'value-to-check', so we did not set the field`
      );
      break;
    case CacheSetIfPresentAndNotEqualResponse.Error:
      throw new Error(
        `An error occurred while attempting to call setIfPresentAndNotEqual for the key 'test-key' in cache cacheName: ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SetIfAbsentOrEqual(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.setIfAbsentOrEqual(cacheName, 'test-key', 'test-field', 'value-to-check');
  switch (result.type) {
    case CacheSetIfAbsentOrEqualResponse.Stored:
      console.log("Field 'test-field' set in key 'test-key'");
      break;
    case CacheSetIfAbsentOrEqualResponse.NotStored:
      console.log(
        `Key 'test-key' exists in cache ${cacheName} and is not equal to 'value-to-check', so we did not set the field`
      );
      break;
    case CacheSetIfAbsentOrEqualResponse.Error:
      throw new Error(
        `An error occurred while attempting to call setIfAbsentOrEqual for the key 'test-key' in cache cacheName: ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SetIfPresentAndHashEqual(
  cacheClient: CacheClient,
  cacheName: string,
  hashValue: Uint8Array
) {
  const result = await cacheClient.setIfPresentAndHashEqual(cacheName, 'test-key', 'test-value', hashValue);
  switch (result.type) {
    case CacheSetIfPresentAndHashEqualResponse.Stored:
      console.log(`Value 'test-value' set in key 'test-key' with hash: ${result.hashString()}`);
      break;
    case CacheSetIfPresentAndHashEqualResponse.NotStored:
      console.log(
        `Key 'test-key' exists in cache ${cacheName} or is not equal to hashValue, so we did not set the field`
      );
      break;
    case CacheSetIfPresentAndHashEqualResponse.Error:
      throw new Error(
        `An error occurred while attempting to call setIfPresentAndHashEqual for the key 'test-key' in cache cacheName: ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SetIfPresentAndHasNotEqual(
  cacheClient: CacheClient,
  cacheName: string,
  hashValue: Uint8Array
) {
  const result = await cacheClient.setIfPresentAndHashNotEqual(cacheName, 'test-key', 'test-value', hashValue);
  switch (result.type) {
    case CacheSetIfPresentAndHashNotEqualResponse.Stored:
      console.log(`Value 'test-value' set in key 'test-key' with hash: ${result.hashString()}`);
      break;
    case CacheSetIfPresentAndHashNotEqualResponse.NotStored:
      console.log(`Key 'test-key' exists in cache ${cacheName} or is equal to hashValue, so we did not set the field`);
      break;
    case CacheSetIfPresentAndHashNotEqualResponse.Error:
      throw new Error(
        `An error occurred while attempting to call setIfPresentAndHashNotEqual for the key 'test-key' in cache cacheName: ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SetIfAbsentOrHashEqual(cacheClient: CacheClient, cacheName: string, hashValue: Uint8Array) {
  const result = await cacheClient.setIfAbsentOrHashEqual(cacheName, 'test-key', 'test-value', hashValue);
  switch (result.type) {
    case CacheSetIfAbsentOrHashEqualResponse.Stored:
      console.log(`Value 'test-value' set in key 'test-key' with hash: ${result.hashString()}`);
      break;
    case CacheSetIfAbsentOrHashEqualResponse.NotStored:
      console.log(
        `Key 'test-key' exists in cache ${cacheName} and is not equal to hashValue, so we did not set the field`
      );
      break;
    case CacheSetIfAbsentOrHashEqualResponse.Error:
      throw new Error(
        `An error occurred while attempting to call setIfAbsentOrHashEqual for the key 'test-key' in cache cacheName: ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SetIfAbsentOrHashNotEqual(
  cacheClient: CacheClient,
  cacheName: string,
  hashValue: Uint8Array
) {
  const result = await cacheClient.setIfAbsentOrHashNotEqual(cacheName, 'test-key', 'test-value', hashValue);
  switch (result.type) {
    case CacheSetIfAbsentOrHashNotEqualResponse.Stored:
      console.log(`Value 'test-value' set in key 'test-key' with hash: ${result.hashString()}`);
      break;
    case CacheSetIfAbsentOrHashNotEqualResponse.NotStored:
      console.log(`Key 'test-key' exists in cache ${cacheName} and is equal to hashValue, so we did not set the field`);
      break;
    case CacheSetIfAbsentOrHashNotEqualResponse.Error:
      throw new Error(
        `An error occurred while attempting to call setIfAbsentOrHashEqual for the key 'test-key' in cache cacheName: ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SetBatch(cacheClient: CacheClient, cacheName: string) {
  const values = new Map<string, string>([
    ['abc', '123'],
    ['xyz', '321'],
    ['123', 'xyz'],
    ['321', 'abc'],
  ]);
  const result = await cacheClient.setBatch(cacheName, values);
  switch (result.type) {
    case CacheSetBatchResponse.Success:
      console.log('Keys and values stored successfully');
      break;
    case CacheSetBatchResponse.Error:
      throw new Error(
        `An error occurred while attempting to batch set in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_GetBatch(cacheClient: CacheClient, cacheName: string) {
  const keys = ['abc', 'xyz', '123', '321'];
  const getBatchResponse = await cacheClient.getBatch(cacheName, keys);

  // simplified style; assume the value was found
  const values = getBatchResponse.values()!;
  for (const key of keys) {
    console.log(`Retrieved value for key '${key}': ${values[key]}`);
  }

  // pattern-matching style; safer for production code
  switch (getBatchResponse.type) {
    case CacheGetBatchResponse.Success: {
      const values = getBatchResponse.values();
      for (const key of keys) {
        console.log(`Retrieved value for key '${key}': ${values[key]}`);
      }
      break;
    }
    case CacheGetBatchResponse.Error:
      throw new Error(
        `An error occurred while attempting to batch get in cache '${cacheName}': ${getBatchResponse.errorCode()}: ${getBatchResponse.toString()}`
      );
  }
}

async function example_API_ListFetch(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.listConcatenateBack(cacheName, 'test-list', ['a', 'b', 'c']);
  const result = await cacheClient.listFetch(cacheName, 'test-list');

  // simplified style; assume the value was found
  console.log(`cache hit: ${result.value()!}`);

  // pattern-matching style; safer for production code
  switch (result.type) {
    case CacheListFetchResponse.Hit:
      console.log(`List fetched successfully: ${result.value()}`);
      break;
    case CacheListFetchResponse.Miss:
      console.log(`List 'test-list' was not found in cache '${cacheName}'`);
      break;
    case CacheListFetchResponse.Error:
      throw new Error(
        `An error occurred while attempting to fetch the list 'test-list' from cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_ListConcatenateBack(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.listConcatenateBack(cacheName, 'test-list', ['a', 'b', 'c']);
  const result = await cacheClient.listConcatenateBack(cacheName, 'test-list', ['x', 'y', 'z']);
  switch (result.type) {
    case CacheListConcatenateBackResponse.Success:
      console.log(`Values added successfully to the back of the list 'test-list'. Result - ${result.toString()}`);
      break;
    case CacheListConcatenateBackResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheListConcatenateBack on list 'test-list' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_ListConcatenateFront(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.listConcatenateFront(cacheName, 'test-list', ['a', 'b', 'c']);
  const result = await cacheClient.listConcatenateFront(cacheName, 'test-list', ['x', 'y', 'z']);
  switch (result.type) {
    case CacheListConcatenateFrontResponse.Success:
      console.log(`Values added successfully to the front of the list 'test-list'. Result - ${result.toString()}`);
      break;
    case CacheListConcatenateFrontResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheListConcatenateFront on list 'test-list' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_ListLength(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.listConcatenateBack(cacheName, 'test-list', ['one', 'two', 'three']);
  const result = await cacheClient.listLength(cacheName, 'test-list');

  // simplified style; assume the value was found
  console.log(`Length of list 'test-list' is: ${result.value()!}`);

  // pattern-matching style; safer for production code
  switch (result.type) {
    case CacheListLengthResponse.Hit:
      console.log(`Length of list 'test-list' is ${result.length()}`);
      break;
    case CacheListLengthResponse.Miss:
      console.log(`List 'test-list' was not found in cache '${cacheName}'`);
      break;
    case CacheListLengthResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheListLength on list 'test-list' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_ListPopBack(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.listConcatenateBack(cacheName, 'test-list', ['one', 'two', 'three']);
  const result = await cacheClient.listPopBack(cacheName, 'test-list');

  // simplified style; assume the value was found
  console.log(`Last value, removed from 'test-list' is: ${result.value()!}`);

  // pattern-matching style; safer for production code
  switch (result.type) {
    case CacheListPopBackResponse.Hit:
      console.log(`Last value was removed successfully from list 'test-list': ${result.value()}`);
      break;
    case CacheListPopBackResponse.Miss:
      console.log(`List 'test-list' was not found in cache '${cacheName}'`);
      break;
    case CacheListPopBackResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheListPopBack on list 'test-list' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_ListPopFront(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.listConcatenateFront(cacheName, 'test-list', ['one', 'two', 'three']);
  const result = await cacheClient.listPopFront(cacheName, 'test-list');

  // simplified style; assume the value was found
  console.log(`First value, removed from 'test-list' is: ${result.value()!}`);

  // pattern-matching style; safer for production code
  switch (result.type) {
    case CacheListPopFrontResponse.Hit:
      console.log(`First value was removed successfully from list 'test-list': ${result.value()}`);
      break;
    case CacheListPopFrontResponse.Miss:
      console.log(`List 'test-list' was not found in cache '${cacheName}'`);
      break;
    case CacheListPopFrontResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheListPopFront on list 'test-list' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_ListPushBack(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.listConcatenateBack(cacheName, 'test-list', ['a', 'b', 'c']);
  const result = await cacheClient.listPushBack(cacheName, 'test-list', 'x');
  switch (result.type) {
    case CacheListPushBackResponse.Success:
      console.log("Value 'x' added successfully to back of list 'test-list'");
      break;
    case CacheListPushBackResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheListPushBack on list 'test-list' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_ListPushFront(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.listConcatenateFront(cacheName, 'test-list', ['a', 'b', 'c']);
  const result = await cacheClient.listPushFront(cacheName, 'test-list', 'x');
  switch (result.type) {
    case CacheListPushFrontResponse.Success:
      console.log("Value 'x' added successfully to front of list 'test-list'");
      break;
    case CacheListPushFrontResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheListPushFront on list 'test-list' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_ListRemoveValue(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.listConcatenateFront(cacheName, 'test-list', ['a', 'b', 'c']);
  const result = await cacheClient.listRemoveValue(cacheName, 'test-list', 'b');
  switch (result.type) {
    case CacheListRemoveValueResponse.Success:
      console.log("Value 'b' removed successfully from list 'test-list'");
      break;
    case CacheListRemoveValueResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheListRemoveValue on list 'test-list' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_ListRetain(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.listConcatenateFront(cacheName, 'test-list', ['a', 'b', 'c', 'd', 'e', 'f']);
  const result = await cacheClient.listRetain(cacheName, 'test-list', {startIndex: 1, endIndex: 4});
  switch (result.type) {
    case CacheListRetainResponse.Success:
      console.log("Retaining elements from index 1 to 4 from list 'test-list'");
      break;
    case CacheListRetainResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheListRetain on list 'test-list' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_DictionaryFetch(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.dictionarySetField(cacheName, 'test-dictionary', 'test-field', 'test-value');
  const result = await cacheClient.dictionaryFetch(cacheName, 'test-dictionary');

  // simplified style; assume the value was found
  console.log(`Dictionary fetched: ${result.value()!}`);

  // pattern-matching style; safer for production code
  switch (result.type) {
    case CacheDictionaryFetchResponse.Hit:
      console.log('Dictionary fetched successfully- ');
      result.valueMap().forEach((value, key) => {
        console.log(`${key} : ${value}`);
      });
      break;
    case CacheDictionaryFetchResponse.Miss:
      console.log(`Dictionary 'test-dictionary' was not found in cache '${cacheName}'`);
      break;
    case CacheDictionaryFetchResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheDictionaryFetch on dictionary 'test-dictionary' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_DictionaryGetField(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.dictionarySetField(cacheName, 'test-dictionary', 'test-field', 'test-value');
  const result = await cacheClient.dictionaryGetField(cacheName, 'test-dictionary', 'test-field');

  // simplified style; assume the value was found
  console.log(`Field 'test-field' fetched from dictionary: ${result.value()!}`);

  // pattern-matching style; safer for production code
  switch (result.type) {
    case CacheDictionaryGetFieldResponse.Hit:
      console.log(
        `Field ${result.fieldString()} fetched successfully from cache '${cacheName}' with value: ${result.value()}`
      );
      break;
    case CacheDictionaryGetFieldResponse.Miss:
      console.log(`Dictionary 'test-dictionary' was not found in cache '${cacheName}'`);
      break;
    case CacheDictionaryGetFieldResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheDictionaryGetField on dictionary 'test-dictionary' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_DictionaryGetFields(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.dictionarySetFields(
    cacheName,
    'test-dictionary',
    new Map<string, string>([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ])
  );
  const result = await cacheClient.dictionaryGetFields(cacheName, 'test-dictionary', ['key1', 'key2']);

  // simplified style; assume the value was found
  console.log(`Got fields from dictionary: ${result.value()!}`);

  // pattern-matching style; safer for production code
  switch (result.type) {
    case CacheDictionaryGetFieldsResponse.Hit:
      console.log('Values fetched successfully- ');
      result.valueMap().forEach((value, key) => {
        console.log(`${key} : ${value}`);
      });
      break;
    case CacheDictionaryGetFieldsResponse.Miss:
      console.log(`Dictionary 'test-dictionary' was not found in cache '${cacheName}'`);
      break;
    case CacheDictionaryGetFieldsResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheDictionaryGetFields on dictionary 'test-dictionary' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_DictionarySetField(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.dictionarySetField(cacheName, 'test-dictionary', 'test-field', 'test-value');
  switch (result.type) {
    case CacheDictionarySetFieldResponse.Success:
      console.log(`Field set successfully into cache '${cacheName}'`);
      break;
    case CacheDictionarySetFieldResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheDictionarySetField on dictionary 'test-dictionary' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_DictionarySetFields(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.dictionarySetFields(
    cacheName,
    'test-dictionary',
    new Map<string, string>([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ])
  );
  switch (result.type) {
    case CacheDictionarySetFieldsResponse.Success:
      console.log(`Fields set successfully into cache '${cacheName}'`);
      break;
    case CacheDictionarySetFieldsResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheDictionarySetFields on dictionary 'test-dictionary' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_DictionaryIncrement(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.dictionarySetField(cacheName, 'test-dictionary', 'test-field', '10');
  const result = await cacheClient.dictionaryIncrement(cacheName, 'test-dictionary', 'test-field', 1);
  switch (result.type) {
    case CacheDictionaryIncrementResponse.Success:
      console.log(`Field value incremented by 1. Result - ${result.valueNumber()}`);
      break;
    case CacheDictionaryIncrementResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheDictionaryIncrement on dictionary 'test-dictionary' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_DictionaryRemoveField(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.dictionarySetField(cacheName, 'test-dictionary', 'test-field', '10');
  const result = await cacheClient.dictionaryRemoveField(cacheName, 'test-dictionary', 'test-field');
  switch (result.type) {
    case CacheDictionaryRemoveFieldResponse.Success:
      console.log("Field removed successfully from dictionary 'test-dictionary'");
      break;
    case CacheDictionaryRemoveFieldResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheDictionaryRemoveField on dictionary 'test-dictionary' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_DictionaryRemoveFields(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.dictionarySetFields(
    cacheName,
    'test-dictionary',
    new Map<string, string>([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ])
  );
  const result = await cacheClient.dictionaryRemoveFields(cacheName, 'test-dictionary', ['key1', 'key2']);
  switch (result.type) {
    case CacheDictionaryRemoveFieldsResponse.Success:
      console.log("Fields removed successfully from dictionary 'test-dictionary'");
      break;
    case CacheDictionaryRemoveFieldsResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheDictionaryRemoveFields on dictionary 'test-dictionary' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SetAddElement(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.setAddElement(cacheName, 'test-set', 'test-element');
  switch (result.type) {
    case CacheSetAddElementResponse.Success:
      console.log("Element added successfully to set 'test-set'");
      break;
    case CacheSetAddElementResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheSetAddElement on set 'test-set' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SetAddElements(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.setAddElements(cacheName, 'test-set', ['test-element1', 'test-element2']);
  switch (result.type) {
    case CacheSetAddElementsResponse.Success:
      console.log("Elements added successfully to set 'test-set'");
      break;
    case CacheSetAddElementsResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheSetAddElements on set 'test-set' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SetFetch(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.setAddElements(cacheName, 'test-set', ['test-element1', 'test-element2']);
  const result = await cacheClient.setFetch(cacheName, 'test-set');

  // simplified style; assume the value was found
  console.log(`Set fetched: ${result.value()!}`);

  // pattern-matching style; safer for production code
  switch (result.type) {
    case CacheSetFetchResponse.Hit:
      console.log('Set fetched successfully- ');
      result.value().forEach((value, key) => {
        console.log(`${key} : ${value}`);
      });
      break;
    case CacheSetFetchResponse.Miss:
      console.log(`Set 'test-set' was not found in cache '${cacheName}'`);
      break;
    case CacheSetFetchResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheSetFetch on set 'test-set' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SetRemoveElement(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.setAddElement(cacheName, 'test-set', 'test-element');
  const result = await cacheClient.setRemoveElement(cacheName, 'test-set', 'test-element');
  switch (result.type) {
    case CacheSetRemoveElementResponse.Success:
      console.log("Element 'test-element' removed successfully from set 'test-set'");
      break;
    case CacheSetRemoveElementResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheSetRemoveElement on set 'test-set' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SetRemoveElements(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.setAddElements(cacheName, 'test-set', ['test-element1', 'test-element2']);
  const result = await cacheClient.setRemoveElements(cacheName, 'test-set', ['test-element1', 'test-element2']);
  switch (result.type) {
    case CacheSetRemoveElementsResponse.Success:
      console.log("Elements 'test-element1' and 'test-element2' removed successfully from set 'test-set'");
      break;
    case CacheSetRemoveElementsResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheSetRemoveElements on set 'test-set' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SetSample(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.setAddElements(cacheName, 'test-set', ['test-element1', 'test-element2', 'test-element3']);
  const result = await cacheClient.setSample(cacheName, 'test-set', 2);

  // simplified style; assume the value was found
  console.log(`Sampled 2 elements from set: ${result.value()!}`);

  // pattern-matching style; safer for production code
  switch (result.type) {
    case CacheSetSampleResponse.Hit:
      console.log('Sample of 2 elements from set: ');
      result.valueSet().forEach((value, key) => {
        console.log(`${key} : ${value}`);
      });
      break;
    case CacheSetSampleResponse.Miss:
      console.log(`Set 'test-set' was not found in cache '${cacheName}'`);
      break;
    case CacheSetSampleResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheSetSample on set 'test-set' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SortedSetPutElement(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.sortedSetPutElement(cacheName, 'test-sorted-set', 'test-value', 5);
  switch (result.type) {
    case CacheSortedSetPutElementResponse.Success:
      console.log("Value 'test-value' with score '5' added successfully to sorted set 'test-sorted-set'");
      break;
    case CacheSortedSetPutElementResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheSortedSetPutElement on sorted set 'test-sorted-set' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SortedSetPutElements(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.sortedSetPutElements(
    cacheName,
    'test-sorted-set',
    new Map<string, number>([
      ['key1', 10],
      ['key2', 20],
    ])
  );
  switch (result.type) {
    case CacheSortedSetPutElementsResponse.Success:
      console.log("Elements added successfully to sorted set 'test-sorted-set'");
      break;
    case CacheSortedSetPutElementsResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheSortedSetPutElements on sorted set 'test-sorted-set' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SortedSetFetchByRank(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.sortedSetPutElements(
    cacheName,
    'test-sorted-set',
    new Map<string, number>([
      ['key1', 10],
      ['key2', 20],
    ])
  );
  const result = await cacheClient.sortedSetFetchByRank(cacheName, 'test-sorted-set');

  // simplified style; assume the value was found
  console.log(`Sorted set fetched: ${result.value()!}`);

  // pattern-matching style; safer for production code
  switch (result.type) {
    case CacheSortedSetFetchResponse.Hit:
      console.log("Values from sorted set 'test-sorted-set' fetched by rank successfully- ");
      result.value().forEach(res => {
        console.log(`${res.value} : ${res.score}`);
      });
      break;
    case CacheSortedSetFetchResponse.Miss:
      console.log(`Sorted Set 'test-sorted-set' was not found in cache '${cacheName}'`);
      break;
    case CacheSortedSetFetchResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheSortedSetFetchByRank on sorted set 'test-sorted-set' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SortedSetFetchByScore(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.sortedSetPutElements(
    cacheName,
    'test-sorted-set',
    new Map<string, number>([
      ['key1', 100],
      ['key2', 25],
    ])
  );
  const result = await cacheClient.sortedSetFetchByScore(cacheName, 'test-sorted-set');

  // simplified style; assume the value was found
  console.log(`Fetched values from sorted set: ${result.value()!}`);

  // pattern-matching style; safer for production code
  switch (result.type) {
    case CacheSortedSetFetchResponse.Hit:
      console.log("Values from sorted set 'test-sorted-set' fetched by score successfully- ");
      result.value().forEach(res => {
        console.log(`${res.value} : ${res.score}`);
      });
      break;
    case CacheSortedSetFetchResponse.Miss:
      console.log(`Sorted Set 'test-sorted-set' was not found in cache '${cacheName}'`);
      break;
    case CacheSortedSetFetchResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheSortedSetFetchByScore on sorted set 'test-sorted-set' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SortedSetGetRank(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.sortedSetPutElements(
    cacheName,
    'test-sorted-set',
    new Map<string, number>([
      ['key1', 10],
      ['key2', 20],
      ['key3', 30],
    ])
  );
  const result = await cacheClient.sortedSetGetRank(cacheName, 'test-sorted-set', 'key2');

  // simplified style; assume the value was found
  console.log(`Element with value 'key1' has rank: ${result.rank()!}`);

  // pattern-matching style; safer for production code
  switch (result.type) {
    case CacheSortedSetGetRankResponse.Hit:
      console.log(`Element with value 'key1' has rank: ${result.rank()}`);
      break;
    case CacheSortedSetGetRankResponse.Miss:
      console.log(`Sorted Set 'test-sorted-set' was not found in cache '${cacheName}'`);
      break;
    case CacheSortedSetGetRankResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheSortedSetFetchGetRank on sorted set 'test-sorted-set' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SortedSetGetScore(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.sortedSetPutElements(
    cacheName,
    'test-sorted-set',
    new Map<string, number>([
      ['key1', 10],
      ['key2', 20],
    ])
  );
  const result = await cacheClient.sortedSetGetScore(cacheName, 'test-sorted-set', 'key1');

  // simplified style; assume the value was found
  console.log(`Element with value 'key1' has score: ${result.score()!}`);

  // pattern-matching style; safer for production code
  switch (result.type) {
    case CacheSortedSetGetScoreResponse.Hit:
      console.log(`Element with value 'key1' has score: ${result.score()}`);
      break;
    case CacheSortedSetGetScoreResponse.Miss:
      console.log(`Sorted Set 'test-sorted-set' was not found in cache '${cacheName}'`);
      break;
    case CacheSortedSetGetScoreResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheSortedSetFetchGetScore on sorted set 'test-sorted-set' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SortedSetGetScores(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.sortedSetPutElements(
    cacheName,
    'test-sorted-set',
    new Map<string, number>([
      ['key1', 10],
      ['key2', 20],
    ])
  );
  const result = await cacheClient.sortedSetGetScores(cacheName, 'test-sorted-set', ['key1', 'key2']);

  // simplified style; assume the value was found
  console.log(`Retrieved scores from sorted set: ${result.value()!}`);

  // pattern-matching style; safer for production code
  switch (result.type) {
    case CacheSortedSetGetScoresResponse.Hit:
      console.log('Element scores retrieved successfully -');
      result.valueMap().forEach((value, key) => {
        console.log(`${key} : ${value}`);
      });
      break;
    case CacheSortedSetGetScoresResponse.Miss:
      console.log(`Sorted Set 'test-sorted-set' was not found in cache '${cacheName}'`);
      break;
    case CacheSortedSetGetScoresResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheSortedSetFetchGetScores on sorted set 'test-sorted-set' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SortedSetIncrementScore(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.sortedSetPutElement(cacheName, 'test-sorted-set', 'test-value', 10);
  const result = await cacheClient.sortedSetIncrementScore(cacheName, 'test-sorted-set', 'test-value', 1);
  switch (result.type) {
    case CacheSortedSetIncrementScoreResponse.Success:
      console.log(`Score for value 'test-value' incremented successfully. New score - ${result.score()}`);
      break;
    case CacheSortedSetIncrementScoreResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheSortedSetIncrementScore on sorted set 'test-sorted-set' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SortedSetRemoveElement(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.sortedSetPutElement(cacheName, 'test-sorted-set', 'test-value', 10);
  const result = await cacheClient.sortedSetRemoveElement(cacheName, 'test-sorted-set', 'test-value');
  switch (result.type) {
    case CacheSortedSetRemoveElementResponse.Success:
      console.log("Element with value 'test-value' removed successfully");
      break;
    case CacheSortedSetRemoveElementResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheSortedSetRemoveElement on sorted set 'test-sorted-set' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SortedSetRemoveElements(cacheClient: CacheClient, cacheName: string) {
  await cacheClient.sortedSetPutElements(
    cacheName,
    'test-sorted-set',
    new Map<string, number>([
      ['key1', 10],
      ['key2', 20],
    ])
  );
  const result = await cacheClient.sortedSetRemoveElements(cacheName, 'test-sorted-set', ['key1', 'key2']);
  switch (result.type) {
    case CacheSortedSetRemoveElementsResponse.Success:
      console.log("Elements with value 'key1' and 'key2 removed successfully");
      break;
    case CacheSortedSetRemoveElementsResponse.Error:
      throw new Error(
        `An error occurred while attempting to call cacheSortedSetRemoveElements on sorted set 'test-sorted-set' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_SortedSetUnionStore(cacheClient: CacheClient, cacheName: string) {
  const sources: SortedSetSource[] = [
    {sortedSetName: 'test-sorted-set', weight: 1},
    {sortedSetName: 'test-sorted-set-2', weight: -1},
  ];
  const result = await cacheClient.sortedSetUnionStore(cacheName, 'dest-sorted-set', sources);
  switch (result.type) {
    case CacheSortedSetUnionStoreResponse.Success:
      console.log(
        `Elements from sets 'test-sorted-set' and 'test-sorted-set-2' unioned and stored in 'dest-sorted-set' successfully with length ${result.length()}`
      );
      break;
    case CacheSortedSetUnionStoreResponse.Error:
      throw new Error(
        `An error occurred while attempting to call CacheSortedSetUnionStore on sorted sets 'test-sorted-set' and 'test-sorted-set-2' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_KeyExists(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.keyExists(cacheName, 'test-key');
  switch (result.type) {
    case CacheKeyExistsResponse.Success:
      console.log("Does 'test-key' exist in the cache?", result.exists());
      break;
    case CacheKeyExistsResponse.Error:
      throw new Error(
        `An error occurred while attempting to call keyExists on key 'test-key' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_KeysExist(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.keysExist(cacheName, ['test-key1', 'test-key2']);
  switch (result.type) {
    case CacheKeysExistResponse.Success:
      console.log("Do 'test-key1' and 'test-key2' exist in the cache?", result.exists());
      break;
    case CacheKeysExistResponse.Error:
      throw new Error(
        `An error occurred while attempting to call keysExist on keys 'test-key1' and 'test-key2' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

function example_API_InstantiateAuthClient() {
  new AuthClient({
    credentialProvider: CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY'),
  });
}

function example_API_InstantiateTopicClient() {
  new TopicClient({
    configuration: TopicConfigurations.Default.latest(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY'),
  });
}

async function example_API_GenerateApiKey(authClient: AuthClient) {
  // Generate a token that allows all data plane APIs on all caches and topics.
  const allDataRWTokenResponse = await authClient.generateApiKey(AllDataReadWrite, ExpiresIn.minutes(30));
  switch (allDataRWTokenResponse.type) {
    case GenerateApiKeyResponse.Success:
      console.log('Generated an API key with AllDataReadWrite scope!');
      // logging only a substring of the tokens, because logging security credentials is not advisable :)
      console.log(`API key starts with: ${allDataRWTokenResponse.apiKey.substring(0, 10)}`);
      console.log(`Refresh token starts with: ${allDataRWTokenResponse.refreshToken.substring(0, 10)}`);
      console.log(`Expires At: ${allDataRWTokenResponse.expiresAt.epoch()}`);
      break;
    case GenerateApiKeyResponse.Error:
      throw new Error(
        `An error occurred while attempting to call generateApiKey with AllDataReadWrite scope: ${allDataRWTokenResponse.errorCode()}: ${allDataRWTokenResponse.toString()}`
      );
  }

  // Generate a token that can only call read-only data plane APIs on a specific cache foo. No topic apis (publish/subscribe) are allowed.
  const singleCacheROTokenResponse = await authClient.generateApiKey(
    TokenScopes.cacheReadOnly('foo'),
    ExpiresIn.minutes(30)
  );
  switch (singleCacheROTokenResponse.type) {
    case GenerateApiKeyResponse.Success:
      console.log('Generated an API key with read-only access to cache foo!');
      // logging only a substring of the tokens, because logging security credentials is not advisable :)
      console.log(`API key starts with: ${singleCacheROTokenResponse.apiKey.substring(0, 10)}`);
      console.log(`Refresh token starts with: ${singleCacheROTokenResponse.refreshToken.substring(0, 10)}`);
      console.log(`Expires At: ${singleCacheROTokenResponse.expiresAt.epoch()}`);
      break;
    case GenerateApiKeyResponse.Error:
      throw new Error(
        `An error occurred while attempting to call generateApiKey with single cache read-only scope: ${singleCacheROTokenResponse.errorCode()}: ${singleCacheROTokenResponse.toString()}`
      );
  }

  // Generate a token that can call all data plane APIs on all caches. No topic apis (publish/subscribe) are allowed.
  const allCachesRWTokenResponse = await authClient.generateApiKey(
    TokenScopes.cacheReadWrite(AllCaches),
    ExpiresIn.minutes(30)
  );
  switch (allCachesRWTokenResponse.type) {
    case GenerateApiKeyResponse.Success:
      console.log('Generated an API key with read-write access to all caches!');
      // logging only a substring of the tokens, because logging security credentials is not advisable :)
      console.log(`API key starts with: ${allCachesRWTokenResponse.apiKey.substring(0, 10)}`);
      console.log(`Refresh token starts with: ${allCachesRWTokenResponse.refreshToken.substring(0, 10)}`);
      console.log(`Expires At: ${allCachesRWTokenResponse.expiresAt.epoch()}`);
      break;
    case GenerateApiKeyResponse.Error:
      throw new Error(
        `An error occurred while attempting to call generateApiKey with all caches read-write scope: ${allCachesRWTokenResponse.errorCode()}: ${allCachesRWTokenResponse.toString()}`
      );
  }

  // Generate a token that can call publish and subscribe on all topics within cache bar
  const singleCacheAllTopicsRWTokenResponse = await authClient.generateApiKey(
    TokenScopes.topicPublishSubscribe({name: 'bar'}, AllTopics),
    ExpiresIn.minutes(30)
  );
  switch (singleCacheAllTopicsRWTokenResponse.type) {
    case GenerateApiKeyResponse.Success:
      console.log('Generated an API key with publish-subscribe access to all topics within cache bar!');
      // logging only a substring of the tokens, because logging security credentials is not advisable :)
      console.log(`API key starts with: ${singleCacheAllTopicsRWTokenResponse.apiKey.substring(0, 10)}`);
      console.log(`Refresh token starts with: ${singleCacheAllTopicsRWTokenResponse.refreshToken.substring(0, 10)}`);
      console.log(`Expires At: ${singleCacheAllTopicsRWTokenResponse.expiresAt.epoch()}`);
      break;
    case GenerateApiKeyResponse.Error:
      throw new Error(
        `An error occurred while attempting to call generateApiKey with read-write scope for all topics in a single cache: ${singleCacheAllTopicsRWTokenResponse.errorCode()}: ${singleCacheAllTopicsRWTokenResponse.toString()}`
      );
  }

  // Generate a token that can only call subscribe on topic where_is_mo within cache mo_nuts
  const oneCacheOneTopicRWTokenResponse = await authClient.generateApiKey(
    TokenScopes.topicSubscribeOnly('mo_nuts', 'where_is_mo'),
    ExpiresIn.minutes(30)
  );
  switch (oneCacheOneTopicRWTokenResponse.type) {
    case GenerateApiKeyResponse.Success:
      console.log('Generated an API key with subscribe-only access to topic where_is_mo within cache mo_nuts!');
      // logging only a substring of the tokens, because logging security credentials is not advisable :)
      console.log(`API key starts with: ${oneCacheOneTopicRWTokenResponse.apiKey.substring(0, 10)}`);
      console.log(`Refresh token starts with: ${oneCacheOneTopicRWTokenResponse.refreshToken.substring(0, 10)}`);
      console.log(`Expires At: ${oneCacheOneTopicRWTokenResponse.expiresAt.epoch()}`);
      break;
    case GenerateApiKeyResponse.Error:
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
  switch (multiplePermsTokenResponse.type) {
    case GenerateApiKeyResponse.Success:
      console.log('Generated an API key with multiple cache and topic permissions!');
      // logging only a substring of the tokens, because logging security credentials is not advisable :)
      console.log(`API key starts with: ${multiplePermsTokenResponse.apiKey.substring(0, 10)}`);
      console.log(`Refresh token starts with: ${multiplePermsTokenResponse.refreshToken.substring(0, 10)}`);
      console.log(`Expires At: ${multiplePermsTokenResponse.expiresAt.epoch()}`);
      break;
    case GenerateApiKeyResponse.Error:
      throw new Error(
        `An error occurred while attempting to call generateApiKey with multiple permissions: ${multiplePermsTokenResponse.errorCode()}: ${multiplePermsTokenResponse.toString()}`
      );
  }
}

async function example_API_RefreshApiKey(authClient: AuthClient) {
  const generateTokenResponse = await authClient.generateApiKey(AllDataReadWrite, ExpiresIn.minutes(30));

  let successResponse: GenerateApiKey.Success;
  switch (generateTokenResponse.type) {
    case GenerateApiKeyResponse.Success: {
      successResponse = generateTokenResponse;
      break;
    }
    case GenerateApiKeyResponse.Error:
      throw new Error(
        `An error occurred while attempting to call generateApiKey: ${generateTokenResponse.errorCode()}: ${generateTokenResponse.toString()}`
      );
  }

  console.log('Generated API key; refreshing!');
  const refreshAuthClient = new AuthClient({
    credentialProvider: CredentialProvider.fromString({apiKey: successResponse.apiKey}),
  });
  const refreshTokenResponse = await refreshAuthClient.refreshApiKey(successResponse.refreshToken);
  switch (refreshTokenResponse.type) {
    case RefreshApiKeyResponse.Success:
      console.log('API key refreshed!');
      // logging only a substring of the tokens, because logging security credentials is not advisable :)
      console.log(`Refreshed API key starts with: ${refreshTokenResponse.apiKey.substring(0, 10)}`);
      console.log(`New refresh token starts with: ${refreshTokenResponse.refreshToken.substring(0, 10)}`);
      console.log(`Refreshed API key expires At: ${refreshTokenResponse.expiresAt.epoch()}`);
      break;
    case RefreshApiKeyResponse.Error:
      throw new Error(
        `An error occurred while attempting to call refreshApiKey: ${refreshTokenResponse.errorCode()}: ${refreshTokenResponse.toString()}`
      );
  }
}

async function example_API_GenerateDisposableToken(authClient: AuthClient) {
  // Generate a disposable token with read-write access to a specific key in one cache
  const oneKeyOneCacheToken = await authClient.generateDisposableToken(
    DisposableTokenScopes.cacheKeyReadWrite('squirrels', 'mo'),
    ExpiresIn.minutes(30)
  );
  switch (oneKeyOneCacheToken.type) {
    case GenerateDisposableTokenResponse.Success:
      console.log('Generated a disposable API key with access to the "mo" key in the "squirrels" cache!');
      // logging only a substring of the tokens, because logging security credentials is not advisable :)
      console.log(`API key starts with: ${oneKeyOneCacheToken.authToken.substring(0, 10)}`);
      console.log(`Expires At: ${oneKeyOneCacheToken.expiresAt.epoch()}`);
      break;
    case GenerateDisposableTokenResponse.Error:
      throw new Error(
        `An error occurred while attempting to call generateApiKey with disposable token scope: ${oneKeyOneCacheToken.errorCode()}: ${oneKeyOneCacheToken.toString()}`
      );
  }

  // Generate a disposable token with read-write access to a specific key prefix in all caches
  const keyPrefixAllCachesToken = await authClient.generateDisposableToken(
    DisposableTokenScopes.cacheKeyPrefixReadWrite(AllCaches, 'squirrel'),
    ExpiresIn.minutes(30)
  );
  switch (keyPrefixAllCachesToken.type) {
    case GenerateDisposableTokenResponse.Success:
      console.log('Generated a disposable API key with access to keys prefixed with "squirrel" in all caches!');
      // logging only a substring of the tokens, because logging security credentials is not advisable :)
      console.log(`API key starts with: ${keyPrefixAllCachesToken.authToken.substring(0, 10)}`);
      console.log(`Expires At: ${keyPrefixAllCachesToken.expiresAt.epoch()}`);
      break;
    case GenerateDisposableTokenResponse.Error:
      throw new Error(
        `An error occurred while attempting to call generateApiKey with disposable token scope: ${keyPrefixAllCachesToken.errorCode()}: ${keyPrefixAllCachesToken.toString()}`
      );
  }

  // Generate a disposable token with read-only access to all topics in one cache
  const allTopicsOneCacheToken = await authClient.generateDisposableToken(
    TokenScopes.topicSubscribeOnly('squirrel', AllTopics),
    ExpiresIn.minutes(30)
  );
  switch (allTopicsOneCacheToken.type) {
    case GenerateDisposableTokenResponse.Success:
      console.log('Generated a disposable API key with access to all topics in the "squirrel" cache!');
      // logging only a substring of the tokens, because logging security credentials is not advisable :)
      console.log(`API key starts with: ${allTopicsOneCacheToken.authToken.substring(0, 10)}`);
      console.log(`Expires At: ${allTopicsOneCacheToken.expiresAt.epoch()}`);
      break;
    case GenerateDisposableTokenResponse.Error:
      throw new Error(
        `An error occurred while attempting to call generateApiKey with disposable token scope: ${allTopicsOneCacheToken.errorCode()}: ${allTopicsOneCacheToken.toString()}`
      );
  }

  // Generate a disposable token with write-only access to a single topic in all caches
  const oneTopicAllCachesToken = await authClient.generateDisposableToken(
    TokenScopes.topicPublishOnly(AllCaches, 'acorn'),
    ExpiresIn.minutes(30)
  );
  switch (oneTopicAllCachesToken.type) {
    case GenerateDisposableTokenResponse.Success:
      console.log('Generated a disposable API key with access to all topics in the "squirrel" cache!');
      // logging only a substring of the tokens, because logging security credentials is not advisable :)
      console.log(`API key starts with: ${oneTopicAllCachesToken.authToken.substring(0, 10)}`);
      console.log(`Expires At: ${oneTopicAllCachesToken.expiresAt.epoch()}`);
      break;
    case GenerateDisposableTokenResponse.Error:
      throw new Error(
        `An error occurred while attempting to call generateApiKey with disposable token scope: ${oneTopicAllCachesToken.errorCode()}: ${oneTopicAllCachesToken.toString()}`
      );
  }
}

async function example_API_TopicCreateClientAndPublish(cacheName: string, topicName: string, value: string) {
  const topicClient = new TopicClient({
    credentialProvider: CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY'),
  });
  const publishResponse = await topicClient.publish(cacheName, topicName, value);
  switch (publishResponse.type) {
    case TopicPublishResponse.Success:
      console.log("Value published to topic 'test-topic'");
      break;
    case TopicPublishResponse.Error:
      throw new Error(
        `An error occurred while attempting to publish to the topic 'test-topic' in cache '${cacheName}': ${publishResponse.errorCode()}: ${publishResponse.toString()}`
      );
  }
}

async function example_API_TopicPublish(topicClient: TopicClient, cacheName: string) {
  const result = await topicClient.publish(cacheName, 'test-topic', 'test-topic-value');
  switch (result.type) {
    case TopicPublishResponse.Success:
      console.log("Value published to topic 'test-topic'");
      break;
    case TopicPublishResponse.Error:
      throw new Error(
        `An error occurred while attempting to publish to the topic 'test-topic' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_TopicSubscribe(topicClient: TopicClient, cacheName: string) {
  const result = await topicClient.subscribe(cacheName, 'test-topic', {
    onError: () => {
      return;
    },
    onItem: (item: TopicItem) => {
      console.log(`Received an item on subscription for 'test-topic': ${item.value().toString()}`);
      return;
    },
  });
  switch (result.type) {
    case TopicSubscribeResponse.Subscription:
      console.log("Successfully subscribed to topic 'test-topic'");

      console.log("Publishing a value to the topic 'test-topic'");
      // Publish a value
      await topicClient.publish(cacheName, 'test-topic', 'test-value');

      console.log('Waiting for the published value to be received.');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Need to close the stream before the example ends or else the example will hang.
      result.unsubscribe();
      break;
    case TopicSubscribeResponse.Error:
      throw new Error(
        `An error occurred while attempting to subscribe to the topic 'test-topic' in cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

function example_API_InstantiateLeaderboardClient() {
  new PreviewLeaderboardClient({
    configuration: LeaderboardConfigurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY'),
  });
}

function example_API_CreateLeaderboard(leaderboardClient: PreviewLeaderboardClient, cacheName: string) {
  // You can create multiple leaderboards using the same leaderboard client
  // but with different cache and leaderboard names
  leaderboardClient.leaderboard(cacheName, 'momento-leaderboard');
  leaderboardClient.leaderboard(cacheName, 'acorns-leaderboard');

  // Leaderboard and cache names must be non-empty strings
  try {
    leaderboardClient.leaderboard(cacheName, '   ');
  } catch (error) {
    console.log('Expected error creating a leaderboard with invalid leaderboard name:', error);
  }
}

async function example_API_LeaderboardUpsert(leaderboard: ILeaderboard, cacheName: string) {
  // Upsert a set of elements as a Map
  const elements1: Map<number, number> = new Map([
    [123, 100.0],
    [234, 200.0],
    [345, 300.0],
    [456, 400.0],
  ]);
  const result1 = await leaderboard.upsert(elements1);
  switch (result1.type) {
    case LeaderboardUpsertResponse.Success:
      console.log('Successfully upserted elements to leaderboard');
      break;
    case LeaderboardUpsertResponse.Error:
      console.log('Upsert error:', result1.message());
      throw new Error(
        `An error occurred while attempting to call upsert on leaderboard 'momento-leaderboard' in cache '${cacheName}': ${result1.errorCode()}: ${result1.message()}`
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
  switch (result2.type) {
    case LeaderboardUpsertResponse.Success:
      console.log('Successfully upserted elements to leaderboard');
      break;
    case LeaderboardUpsertResponse.Error:
      console.log('Upsert error:', result2.message());
      throw new Error(
        `An error occurred while attempting to call upsert on leaderboard 'momento-leaderboard' in cache '${cacheName}': ${result2.errorCode()}: ${result2.message()}`
      );
  }
}

async function example_API_LeaderboardUpsertPagination(leaderboard: ILeaderboard, totalNumElements: number) {
  // To upsert a large number of elements, you must upsert
  // in batches of up to 8192 elements at a time.
  // This example shows how to paginate for a large value of `totalNumElements`, such as `20000`.
  const elements = [...Array(totalNumElements).keys()].map(i => {
    return {id: i + 1, score: i * Math.random()};
  });
  for (let i = 0; i < totalNumElements; i += 8192) {
    // Create a Map containing 8192 elements at a time
    const batch = new Map(elements.slice(i, i + 8192).map(obj => [obj['id'], obj['score']]));

    // Then upsert one batch at a time until all elements have been ingested
    const result = await leaderboard.upsert(batch);
    switch (result.type) {
      case LeaderboardUpsertResponse.Success:
        break;
      case LeaderboardUpsertResponse.Error:
        console.log(`Error upserting batch [${i}, ${i + 8192})`);
        break;
    }
  }
}

async function example_API_LeaderboardFetchByScore(leaderboard: ILeaderboard, cacheName: string) {
  // By default, FetchByScore will fetch the elements from the entire score range
  // with zero offset in ascending order. It can return 8192 elements at a time.
  const result1 = await leaderboard.fetchByScore();
  switch (result1.type) {
    case LeaderboardFetchResponse.Success:
      console.log('Successfully fetched elements using open score range:');
      result1.values().forEach(element => {
        console.log(`\tId: ${element.id} | Rank: ${element.rank} | Score: ${element.score}`);
      });
      break;
    case LeaderboardFetchResponse.Error:
      throw new Error(
        `An error occurred while attempting to call fetchByScore with no options on leaderboard 'momento-leaderboard' in cache '${cacheName}': ${result1.errorCode()}: ${result1.message()}`
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
  switch (result2.type) {
    case LeaderboardFetchResponse.Success:
      console.log('Successfully fetched elements by score using all options:');
      result2.values().forEach(element => {
        console.log(`\tId: ${element.id} | Rank: ${element.rank} | Score: ${element.score}`);
      });
      break;
    case LeaderboardFetchResponse.Error:
      throw new Error(
        `An error occurred while attempting to call fetchByScore with all options on leaderboard 'momento-leaderboard' in cache '${cacheName}': ${result2.errorCode()}: ${result2.message()}`
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
  console.log(`Processing batch of ${values.length} leaderboard elements`);
}

async function example_API_LeaderboardFetchByScorePagination(leaderboard: ILeaderboard, totalNumElements: number) {
  // Use the offset option to paginate through your results if your leaderboard
  // has more than 8192 elements.
  // This example shows how to paginate for a large value of `totalNumElements`, such as `20000`.
  for (let offset = 0; offset < totalNumElements; offset += 8192) {
    const result = await leaderboard.fetchByScore({offset});
    switch (result.type) {
      case LeaderboardFetchResponse.Success:
        processBatch(result.values());
        break;
      case LeaderboardFetchResponse.Error:
        console.log(
          `Error fetching batch by score [${offset}, ${offset + 8192}) (${result.errorCode()}: ${result.message()})`
        );
    }
  }
}

async function example_API_LeaderboardFetchByRank(leaderboard: ILeaderboard, cacheName: string) {
  // By default, FetchByRank will fetch the elements in the range [startRank, endRank)
  // in ascending order, meaning rank 0 is for the lowest score.
  const result1 = await leaderboard.fetchByRank(0, 10);
  switch (result1.type) {
    case LeaderboardFetchResponse.Success:
      console.log('Successfully fetched elements in rank range [0,10)');
      result1.values().forEach(element => {
        console.log(`\tId: ${element.id} | Rank: ${element.rank} | Score: ${element.score}`);
      });
      break;
    case LeaderboardFetchResponse.Error:
      throw new Error(
        `An error occurred while attempting to call fetchByRank with no options on leaderboard 'momento-leaderboard' in cache '${cacheName}': ${result1.errorCode()}: ${result1.message()}`
      );
  }
}

async function example_API_LeaderboardFetchByRankPagination(leaderboard: ILeaderboard, totalNumElements: number) {
  // Use the startRank and endRank options to paginate through your leaderboard
  // if your leaderboard has more than 8192 elements
  // This example shows how to paginate for a large value of `totalNumElements`, such as `20000`.
  for (let rank = 0; rank < totalNumElements; rank += 8192) {
    const result = await leaderboard.fetchByRank(rank, rank + 8192, {order: LeaderboardOrder.Descending});
    switch (result.type) {
      case LeaderboardFetchResponse.Success:
        processBatch(result.values());
        break;
      case LeaderboardFetchResponse.Error:
        console.log(
          `Error fetching batch by rank [${rank}, ${rank + 8192}) (${result.errorCode()}: ${result.message()})`
        );
    }
  }
}

async function example_API_LeaderboardGetRank(leaderboard: ILeaderboard, cacheName: string) {
  // Provide a list of element IDs to get their ranks in ascending or descending order
  const result = await leaderboard.getRank([123, 456, 789], {
    order: LeaderboardOrder.Descending,
  });
  switch (result.type) {
    case LeaderboardFetchResponse.Success:
      console.log('Successfully fetched the rank of 3 elements:');
      result.values().forEach(element => {
        console.log(`\tId: ${element.id} | Rank: ${element.rank} | Score: ${element.score}`);
      });
      break;
    case LeaderboardFetchResponse.Error:
      throw new Error(
        `An error occurred while attempting to call getRank on leaderboard 'momento-leaderboard' in cache '${cacheName}': ${result.errorCode()}: ${result.message()}`
      );
  }
}

async function example_API_LeaderboardLength(leaderboard: ILeaderboard, cacheName: string) {
  const result = await leaderboard.length();
  switch (result.type) {
    case LeaderboardLengthResponse.Success:
      console.log('Successfully retrieved leaderboard length:', result.length());
      break;
    case LeaderboardLengthResponse.Error:
      throw new Error(
        `An error occurred while attempting to call length on leaderboard 'momento-leaderboard' in cache '${cacheName}': ${result.errorCode()}: ${result.message()}`
      );
  }
}

async function example_API_LeaderboardRemoveElements(leaderboard: ILeaderboard, cacheName: string) {
  // Provide a list of element IDs to delete those elements
  const result = await leaderboard.removeElements([123, 456, 789]);
  switch (result.type) {
    case LeaderboardRemoveElementsResponse.Success:
      console.log('Successfully removed elements');
      break;
    case LeaderboardRemoveElementsResponse.Error:
      throw new Error(
        `An error occurred while attempting to call removeElements on leaderboard 'momento-leaderboard' in cache '${cacheName}': ${result.errorCode()}: ${result.message()}`
      );
  }
}

async function example_API_LeaderboardRemoveElementsPagination(leaderboard: ILeaderboard, totalNumElements: number) {
  // You can remove batches of 8192 elements at a time.
  // This example shows how to paginate for a large value of `totalNumElements`, such as `20000`.
  const ids = [...Array(totalNumElements).keys()];
  for (let i = 0; i < totalNumElements; i += 8192) {
    const result = await leaderboard.removeElements(ids.slice(i, i + 8192));
    switch (result.type) {
      case LeaderboardRemoveElementsResponse.Success:
        break;
      case LeaderboardRemoveElementsResponse.Error:
        console.log(`Error removing batch [${i}, ${i + 8192}) (${result.errorCode()}: ${result.message()})`);
        break;
    }
  }
}

async function example_API_LeaderboardDelete(leaderboard: ILeaderboard, cacheName: string) {
  const result = await leaderboard.delete();
  switch (result.type) {
    case LeaderboardDeleteResponse.Success:
      console.log('Successfully deleted the leaderboard');
      break;
    case LeaderboardDeleteResponse.Error:
      throw new Error(
        `An error occurred while attempting to call delete on leaderboard 'momento-leaderboard' in cache '${cacheName}': ${result.errorCode()}: ${result.message()}`
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
  await example_API_InstantiateCacheClientWithReadConcern();

  const cacheClient = await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY'),
    defaultTtlSeconds: 60,
  });

  const cacheName = `js-sdk-doc-examples-cache-${crypto.randomBytes(8).toString('hex')}`;

  await example_API_CreateCache(cacheClient, cacheName);

  const setWithHashResponse = await cacheClient.setWithHash(cacheName, 'test-key', 'test-value');
  const hashValue =
    setWithHashResponse instanceof CacheSetWithHash.Stored
      ? setWithHashResponse.hashUint8Array()
      : new TextEncoder().encode('hello-world');
  const setWithHashResponse2 = await cacheClient.setWithHash(cacheName, 'example-key', 'example-value');
  const hashValueNotEqual =
    setWithHashResponse2 instanceof CacheSetWithHash.Stored
      ? setWithHashResponse2.hashUint8Array()
      : new TextEncoder().encode('hello-world');

  try {
    await example_API_ErrorHandlingHitMiss(cacheClient, cacheName);
    await example_API_ErrorHandlingSuccess(cacheClient, cacheName);

    await example_API_ListCaches(cacheClient);
    await example_API_FlushCache(cacheClient, cacheName);

    await example_API_Set(cacheClient, cacheName);
    await example_API_Get(cacheClient, cacheName);
    await example_API_Delete(cacheClient, cacheName);
    await example_API_Increment(cacheClient, cacheName);
    await example_API_ItemGetType(cacheClient, cacheName);
    await example_API_SetIfNotExists(cacheClient, cacheName);
    await example_API_SetIfAbsent(cacheClient, cacheName);
    await example_API_SetIfPresent(cacheClient, cacheName);
    await example_API_SetIfEqual(cacheClient, cacheName);
    await example_API_SetIfNotEqual(cacheClient, cacheName);
    await example_API_SetIfPresentAndNotEqual(cacheClient, cacheName);
    await example_API_SetIfAbsentOrEqual(cacheClient, cacheName);
    await example_API_SetBatch(cacheClient, cacheName);
    await example_API_GetBatch(cacheClient, cacheName);
    await example_API_SetWithHash(cacheClient, cacheName);
    await example_API_GetWithHash(cacheClient, cacheName);
    await example_API_SetIfPresentAndHashEqual(cacheClient, cacheName, hashValue);
    await example_API_SetIfPresentAndHasNotEqual(cacheClient, cacheName, hashValueNotEqual);
    await example_API_SetIfAbsentOrHashEqual(cacheClient, cacheName, hashValue);
    await example_API_SetIfAbsentOrHashNotEqual(cacheClient, cacheName, hashValueNotEqual);

    await example_API_ListFetch(cacheClient, cacheName);
    await example_API_ListConcatenateBack(cacheClient, cacheName);
    await example_API_ListConcatenateFront(cacheClient, cacheName);
    await example_API_ListLength(cacheClient, cacheName);
    await example_API_ListPopBack(cacheClient, cacheName);
    await example_API_ListPopFront(cacheClient, cacheName);
    await example_API_ListPushBack(cacheClient, cacheName);
    await example_API_ListPushFront(cacheClient, cacheName);
    await example_API_ListRemoveValue(cacheClient, cacheName);
    await example_API_ListRetain(cacheClient, cacheName);

    await example_API_DictionaryFetch(cacheClient, cacheName);
    await example_API_DictionaryGetField(cacheClient, cacheName);
    await example_API_DictionaryGetFields(cacheClient, cacheName);
    await example_API_DictionarySetField(cacheClient, cacheName);
    await example_API_DictionarySetFields(cacheClient, cacheName);
    await example_API_DictionaryIncrement(cacheClient, cacheName);
    await example_API_DictionaryRemoveField(cacheClient, cacheName);
    await example_API_DictionaryRemoveFields(cacheClient, cacheName);

    await example_API_SetAddElement(cacheClient, cacheName);
    await example_API_SetAddElements(cacheClient, cacheName);
    await example_API_SetFetch(cacheClient, cacheName);
    await example_API_SetRemoveElement(cacheClient, cacheName);
    await example_API_SetRemoveElements(cacheClient, cacheName);
    await example_API_SetSample(cacheClient, cacheName);

    await example_API_SortedSetPutElement(cacheClient, cacheName);
    await example_API_SortedSetPutElements(cacheClient, cacheName);
    await example_API_SortedSetFetchByRank(cacheClient, cacheName);
    await example_API_SortedSetFetchByScore(cacheClient, cacheName);
    await example_API_SortedSetGetRank(cacheClient, cacheName);
    await example_API_SortedSetGetScore(cacheClient, cacheName);
    await example_API_SortedSetGetScores(cacheClient, cacheName);
    await example_API_SortedSetIncrementScore(cacheClient, cacheName);
    await example_API_SortedSetRemoveElement(cacheClient, cacheName);
    await example_API_SortedSetRemoveElements(cacheClient, cacheName);
    await example_API_SortedSetUnionStore(cacheClient, cacheName);

    await example_API_KeyExists(cacheClient, cacheName);
    await example_API_KeysExist(cacheClient, cacheName);

    example_API_InstantiateAuthClient();
    const authClient = new AuthClient({
      credentialProvider: CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY'),
    });
    await example_API_GenerateApiKey(authClient);
    await example_API_RefreshApiKey(authClient);
    await example_API_GenerateDisposableToken(authClient);

    example_API_InstantiateTopicClient();
    const topicClient = new TopicClient({
      configuration: TopicConfigurations.Default.latest(),
      credentialProvider: CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY'),
    });
    await example_API_TopicCreateClientAndPublish(cacheName, 'topic', 'value');
    await example_API_TopicPublish(topicClient, cacheName);
    await example_API_TopicSubscribe(topicClient, cacheName);

    example_API_InstantiateLeaderboardClient();
    const leaderboardClient = new PreviewLeaderboardClient({
      configuration: LeaderboardConfigurations.Laptop.v1(),
      credentialProvider: CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY'),
    });
    const leaderboard = leaderboardClient.leaderboard(cacheName, 'momento-leaderboard');
    example_API_CreateLeaderboard(leaderboardClient, cacheName);
    await example_API_LeaderboardUpsert(leaderboard, cacheName);
    await example_API_LeaderboardFetchByScore(leaderboard, cacheName);
    await example_API_LeaderboardFetchByRank(leaderboard, cacheName);
    await example_API_LeaderboardGetRank(leaderboard, cacheName);
    await example_API_LeaderboardLength(leaderboard, cacheName);
    await example_API_LeaderboardRemoveElements(leaderboard, cacheName);
    await example_API_LeaderboardDelete(leaderboard, cacheName);

    await example_API_LeaderboardFetchByRankPagination(leaderboard, 10);
    await example_API_LeaderboardFetchByScorePagination(leaderboard, 10);
    await example_API_LeaderboardUpsertPagination(leaderboard, 10);
    await example_API_LeaderboardRemoveElementsPagination(leaderboard, 10);
    await example_API_LeaderboardUpsertPagination(leaderboard, 10);
  } finally {
    await example_API_DeleteCache(cacheClient, cacheName);
    cacheClient.close();
  }
}

main().catch(e => {
  throw e;
});
