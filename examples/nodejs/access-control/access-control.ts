/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  CacheGet,
  CreateCache,
  CacheSet,
  CacheClient,
  Configurations,
  CredentialProvider,
  DeleteCache,
  AuthClient,
  ExpiresIn,
  GenerateApiKey,
  TokenScope,
  TokenScopes,
  CacheRole,
  TopicRole,
  AllCaches,
  AllTopics,
} from '@gomomento/sdk';

async function createCache(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.createCache(cacheName);
  if (result instanceof CreateCache.Success) {
    console.log(`Cache ${cacheName} created`);
  } else if (result instanceof CreateCache.AlreadyExists) {
    console.log(`Cache ${cacheName} already exists`);
  } else if (result instanceof CreateCache.Error) {
    throw new Error(
      `An error occurred while attempting to create cache ${cacheName}: ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function deleteCache(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.deleteCache(cacheName);
  if (result instanceof DeleteCache.Success) {
    console.log(`Cache ${cacheName} deleted`);
  } else if (result instanceof DeleteCache.Error) {
    throw new Error(
      `An error occurred while attempting to delete cache ${cacheName}: ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function set(cacheClient: CacheClient, cacheName: string, key: string, value: string) {
  const result = await cacheClient.set(cacheName, key, value);
  if (result instanceof CacheSet.Success) {
    console.log(`Key ${key} stored successfully in ${cacheName}`);
  } else if (result instanceof CacheSet.Error) {
    throw new Error(
      `An error occurred while attempting to store key ${key} in cache ${cacheName}: ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function get(cacheClient: CacheClient, cacheName: string, key: string) {
  const result = await cacheClient.get(cacheName, key);
  if (result instanceof CacheGet.Hit) {
    console.log(`Retrieved value for key ${key} in cache ${cacheName}: ${result.valueString()}`);
  } else if (result instanceof CacheGet.Miss) {
    console.log(`Key ${key} was not found in cache ${cacheName}`);
  } else if (result instanceof CacheGet.Error) {
    throw new Error(
      `An error occurred while attempting to get key ${key} from cache ${cacheName}: ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function generateApiKey(
  authClient: AuthClient,
  scope: TokenScope,
  durationSeconds: number
): Promise<[string, string]> {
  const generateTokenResponse = await authClient.generateApiKey(scope, ExpiresIn.seconds(durationSeconds));
  if (generateTokenResponse instanceof GenerateApiKey.Success) {
    console.log(`Generated an API key with ${scope.toString()} scope at time ${Date.now() / 1000}!`);
    console.log('Logging only a substring of the tokens, because logging security credentials is not advisable:');
    console.log(`API key starts with: ${generateTokenResponse.apiKey.substring(0, 10)}`);
    console.log(`Refresh token starts with: ${generateTokenResponse.refreshToken.substring(0, 10)}`);
    console.log(`Expires At: ${generateTokenResponse.expiresAt.epoch()}`);
    return [generateTokenResponse.apiKey, generateTokenResponse.refreshToken];
  } else {
    throw new Error(`Failed to generate API key: ${generateTokenResponse.toString()}`);
  }
}

async function main() {
  const mainCredsProvider = CredentialProvider.fromEnvironmentVariable({
    environmentVariableName: 'MOMENTO_API_KEY',
  });
  const mainAuthClient = new AuthClient({
    credentialProvider: mainCredsProvider,
  });
  const mainCacheClient = await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: mainCredsProvider,
    defaultTtlSeconds: 60,
  });

  // Set up a cache
  const CACHE_OPEN_DOOR = 'open-door';
  const tokenValidForSeconds = 600;

  await createCache(mainCacheClient, CACHE_OPEN_DOOR);
  try {
    await set(mainCacheClient, CACHE_OPEN_DOOR, 'hello', 'world');

    // Create a token valid for 600 seconds that can only read a specific cache 'open-door'
    const [scopedToken, scopedRefreshToken] = await generateApiKey(
      mainAuthClient,
      TokenScopes.cacheReadOnly(CACHE_OPEN_DOOR),
      tokenValidForSeconds
    );
    const scopedTokenCacheClient = await CacheClient.create({
      configuration: Configurations.Laptop.v1(),
      credentialProvider: CredentialProvider.fromString({apiKey: scopedToken}),
      defaultTtlSeconds: 600,
    });

    await get(scopedTokenCacheClient, CACHE_OPEN_DOOR, 'goodbye');
    await get(scopedTokenCacheClient, CACHE_OPEN_DOOR, 'hello');
    try {
      await set(scopedTokenCacheClient, CACHE_OPEN_DOOR, 'hello', 'world');
    } catch (ex) {
      console.log(
        `Caught expected permissions error - Writes not allowed with a read-only token ${(ex as Error).toString()}`
      );
    }
  } finally {
    // Clean up caches created
    await deleteCache(mainCacheClient, CACHE_OPEN_DOOR);
  }

  // Create a token that can
  // - Read and write cache CACHE_OPEN_DOOR
  // - Read all caches
  // - Read and write topic 'highlights' within a specific cache 'the-great-wall'
  // - Read all topics across all caches

  const permissions = {
    permissions: [
      {role: CacheRole.ReadWrite, cache: {name: CACHE_OPEN_DOOR}},
      {role: CacheRole.ReadOnly, cache: AllCaches},
      {
        role: TopicRole.PublishSubscribe,
        cache: 'the-great-wall', // Shorthand syntax for cache: {name: 'the-great-wall'}
        topic: 'highlights',
      },
      {
        role: TopicRole.SubscribeOnly,
        cache: AllCaches,
        topic: AllTopics,
      },
    ],
  };

  const [scopedToken1, scopedRefreshToken1] = await generateApiKey(mainAuthClient, permissions, tokenValidForSeconds);
  // Do something with the token.
}

main()
  .then(() => {
    console.log('success!!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
