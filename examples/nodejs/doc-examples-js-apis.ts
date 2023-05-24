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
} from '@gomomento/sdk';

function example_API_InstantiateCacheClient() {
  new CacheClient({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_AUTH_TOKEN',
    }),
    defaultTtlSeconds: 60,
  });
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
    console.log("Key 'test-key' was not found in cache 'test-cache");
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
    console.log('Auth token generated!');
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
      console.log(`Refreshed auth token starts with: ${refreshTokenResponse.authToken.substring(0, 10)}`);
      console.log(`New refresh token starts with: ${refreshTokenResponse.refreshToken.substring(0, 10)}`);
      console.log(`Refreshed auth token expires At: ${refreshTokenResponse.expiresAt.epoch()}`);
    }
  }
}

async function main() {
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

  await example_API_Set(cacheClient);
  await example_API_Get(cacheClient);
  await example_API_Delete(cacheClient);

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
