/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  CacheClient,
  Configurations,
  CredentialProvider,
  AuthClient,
  ExpiresIn,
  PermissionScope,
  PermissionScopes,
  CacheRole,
  TopicRole,
  AllCaches,
  AllTopics,
  CreateCacheResponse,
  DeleteCacheResponse,
  CacheSetResponse,
  CacheGetResponse,
  GenerateApiKeyResponse,
} from '@gomomento/sdk';
import { uuid } from 'uuidv4';

async function createCache(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.createCache(cacheName);
  switch (result.type) {
    case CreateCacheResponse.AlreadyExists:
      console.log(`Cache ${cacheName} already exists`);
      break;
    case CreateCacheResponse.Success:
      console.log(`Cache ${cacheName} created`);
      break;
    case CreateCacheResponse.Error:
      throw new Error(
        `An error occurred while attempting to create cache ${cacheName}: ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function deleteCache(cacheClient: CacheClient, cacheName: string) {
  const result = await cacheClient.deleteCache(cacheName);
  switch (result.type) {
    case DeleteCacheResponse.Success:
      console.log(`Cache ${cacheName} deleted`);
      break;
    case DeleteCacheResponse.Error:
      throw new Error(
        `An error occurred while attempting to delete cache ${cacheName}: ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function set(cacheClient: CacheClient, cacheName: string, key: string, value: string) {
  const result = await cacheClient.set(cacheName, key, value);
  switch (result.type) {
    case CacheSetResponse.Success:
      console.log(`Key ${key} stored successfully in ${cacheName}`);
      break;
    case CacheSetResponse.Error:
      throw new Error(
        `An error occurred while attempting to store key ${key} in cache ${cacheName}: ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function get(cacheClient: CacheClient, cacheName: string, key: string) {
  const result = await cacheClient.get(cacheName, key);
  switch (result.type) {
    case CacheGetResponse.Miss:
      console.log(`Key ${key} was not found in cache ${cacheName}`);
      break;
    case CacheGetResponse.Hit:
      console.log(`Retrieved value for key ${key} in cache ${cacheName}: ${result.valueString()}`);
      break;
    case CacheGetResponse.Error:
      throw new Error(
        `An error occurred while attempting to get key ${key} from cache ${cacheName}: ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function generateApiKey(
  authClient: AuthClient,
  scope: PermissionScope,
  durationSeconds: number
): Promise<[string, string]> {
  const generateTokenResponse = await authClient.generateApiKey(scope, ExpiresIn.seconds(durationSeconds));
  switch (generateTokenResponse.type) {
    case GenerateApiKeyResponse.Success:
      console.log(`Generated an API key with ${scope.toString()} scope at time ${Date.now() / 1000}!`);
      console.log('Logging only a substring of the tokens, because logging security credentials is not advisable:');
      console.log(`API key starts with: ${generateTokenResponse.apiKey.substring(0, 10)}`);
      console.log(`Refresh token starts with: ${generateTokenResponse.refreshToken.substring(0, 10)}`);
      console.log(`Expires At: ${generateTokenResponse.expiresAt.epoch()}`);
      return [generateTokenResponse.apiKey, generateTokenResponse.refreshToken];
    case GenerateApiKeyResponse.Error:
      throw new Error(`Failed to generate API key: ${generateTokenResponse.toString()}`);
  }
}

async function main() {
  // Use the default credential provider when creating clients
  const mainAuthClient = new AuthClient({});
  const mainCacheClient = await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    defaultTtlSeconds: 60,
  });

  // Set up a cache
  const CACHE_OPEN_DOOR = `nodejs-access-control-example-${uuid()}`;
  const tokenValidForSeconds = 600;

  await createCache(mainCacheClient, CACHE_OPEN_DOOR);
  try {
    await set(mainCacheClient, CACHE_OPEN_DOOR, 'hello', 'world');

    // Create a token valid for 600 seconds that can only read a specific cache 'open-door'
    const [scopedToken, scopedRefreshToken] = await generateApiKey(
      mainAuthClient,
      PermissionScopes.cacheReadOnly(CACHE_OPEN_DOOR),
      tokenValidForSeconds
    );
    const scopedTokenCacheClient = await CacheClient.create({
      configuration: Configurations.Laptop.v1(),
      credentialProvider: CredentialProvider.fromDisposableToken({ apiKey: scopedToken }),
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
      { role: CacheRole.ReadWrite, cache: { name: CACHE_OPEN_DOOR } },
      { role: CacheRole.ReadOnly, cache: AllCaches },
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
