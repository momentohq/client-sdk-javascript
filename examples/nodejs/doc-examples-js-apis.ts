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
} from '@gomomento/sdk';

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
  } else {
    throw new Error(`An error occurred while attempting to create cache 'test-cache': ${result.toString()}`);
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
    console.log(`Item type retrieved successfully: ${result.itemType()}`);
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
  } else if (result instanceof ItemGetType.Error) {
    throw new Error(
      `An error occurred while attempting to call setIfNotExists for the key 'test-key' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_ListFetch(cacheClient: CacheClient) {
  const result = await cacheClient.listFetch('test-cache', 'test-list');
  if (result instanceof CacheListFetch.Hit) {
    console.log(`List fetched successfully: ${result.toString()}`);
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
    console.log(`Values added successfully to the back of the list 'test-list': ${result.toString()}`);
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
    console.log(`Values added successfully to the front of the list 'test-list': ${result.toString()}`);
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
    console.log(`Value 'x' added successfully to back of list 'test-list': ${result.toString()}`);
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
    console.log(`Value 'x' added successfully to front of list 'test-list': ${result.toString()}`);
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
    console.log(`Value 'b' removed successfully from list 'test-list': ${result.toString()}`);
  } else if (result instanceof CacheListPushFront.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheListRemoveValue on list 'test-list' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_ListRetain(cacheClient: CacheClient) {
  await cacheClient.listConcatenateFront('test-cache', 'test-list', ['a', 'b', 'c', 'd', 'e', 'f']);
  const result = await cacheClient.listRetain('test-cache', 'test-list', {startIndex: 1, endIndex: 4});
  if (result instanceof CacheListRetain.Success) {
    console.log(`Retaining elements from index 1 to 4 from list 'test-list': ${result.toString()}`);
  } else if (result instanceof CacheListRetain.Error) {
    throw new Error(
      `An error occurred while attempting to call cacheListRetain on list 'test-list' in cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
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
  const cacheClient = new CacheClient({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_AUTH_TOKEN',
    }),
    defaultTtlSeconds: 60,
  });

  await example_API_CreateCache(cacheClient);
  await example_API_DeleteCache(cacheClient);
  await example_API_CreateCache(cacheClient);
  await example_API_ListCaches(cacheClient);
  await example_API_FlushCache(cacheClient);

  await example_API_ErrorHandlingHitMiss(cacheClient);
  await example_API_ErrorHandlingSuccess(cacheClient);

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

  example_API_InstantiateAuthClient();
  const authClient = new AuthClient({
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_AUTH_TOKEN',
    }),
  });
  await example_API_GenerateAuthToken(authClient);
  await example_API_RefreshAuthToken(authClient);
}

main().catch(e => {
  throw e;
});
