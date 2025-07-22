import {
  AllCaches,
  AllDataReadWrite,
  AllTopics,
  CacheGet,
  CacheRole,
  CacheSet,
  CreateCache,
  DeleteCache,
  ExpiresIn,
  GenerateApiKey,
  GenerateDisposableToken,
  MomentoErrorCode,
  RefreshApiKey,
  SubscribeCallOptions,
  PermissionScope,
  PermissionScopes,
  TopicPublish,
  TopicRole,
  TopicSubscribe,
  /**
   * @deprecated but still included for testing backward compat
   */
  GenerateAuthToken,
  /**
   * @deprecated but still included for testing backward compat
   */
  RefreshAuthToken,
  TopicItem,
} from '@gomomento/sdk-core';
import {expectWithMessage, testTopicName} from '../common-int-test-utils';
import {InternalSuperUserPermissions} from '@gomomento/sdk-core/dist/src/internal/utils/auth';
import {
  IAuthClient,
  ICacheClient,
  ITopicClient,
} from '@gomomento/sdk-core/dist/src/internal/clients';
import {v4} from 'uuid';
import {expect} from '@jest/globals';
import '../momento-jest-matchers';
import {sleep} from '@gomomento/sdk-core/dist/src/internal/utils';

const SUPER_USER_PERMISSIONS: PermissionScope =
  new InternalSuperUserPermissions();

export function runAuthClientTests(
  sessionTokenAuthClient: IAuthClient,
  legacyTokenAuthClient: IAuthClient,
  sessionTokenCacheClient: ICacheClient,
  sessionTokenTopicClient: ITopicClient,
  authTokenAuthClientFactory: (authToken: string) => IAuthClient,
  cacheClientFactory: (token: string) => ICacheClient,
  topicClientFactory: (token: string) => ITopicClient,
  cacheName: string
) {
  describe('generate auth token using session token credentials', () => {
    it('should return success and generate auth token', async () => {
      const resp = await sessionTokenAuthClient.generateApiKey(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.seconds(10)
      );
      expectWithMessage(
        () => expect(resp).toBeInstanceOf(GenerateApiKey.Success),
        `Unexpected response: ${resp.toString()}`
      );
    });

    it('should succeed for generating an api token that expires', async () => {
      const secondsSinceEpoch = Math.round(Date.now() / 1000);
      const expireResponse = await sessionTokenAuthClient.generateApiKey(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.days(1)
      );
      const oneHourInSeconds = 60 * 60;
      const oneDayInSeconds = oneHourInSeconds * 24;
      const expiresIn = secondsSinceEpoch + oneDayInSeconds;

      expectWithMessage(
        () => expect(expireResponse).toBeInstanceOf(GenerateApiKey.Success),
        `Unexpected response: ${expireResponse.toString()}`
      );
      const expireResponseSuccess = expireResponse as GenerateApiKey.Success;
      expect(expireResponseSuccess.expiresAt.doesExpire());
      expect(expireResponseSuccess.expiresAt.epoch()).toBeWithin(
        expiresIn - oneHourInSeconds,
        expiresIn + oneHourInSeconds
      );
    });

    it('should succeed for generating an api token that never expires', async () => {
      const neverExpiresResponse = await sessionTokenAuthClient.generateApiKey(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.never()
      );
      expectWithMessage(
        () =>
          expect(neverExpiresResponse).toBeInstanceOf(GenerateApiKey.Success),
        `Unexpected response: ${neverExpiresResponse.toString()}`
      );
      const neverExpireResponseSuccess =
        neverExpiresResponse as GenerateApiKey.Success;
      expect(neverExpireResponseSuccess.expiresAt.doesExpire()).toBeFalsy();
    });

    it('should not succeed for generating an api token that has an invalid expires', async () => {
      const invalidExpiresResponse =
        await sessionTokenAuthClient.generateApiKey(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(-100)
        );
      expectWithMessage(
        () =>
          expect(invalidExpiresResponse).toBeInstanceOf(GenerateApiKey.Error),
        `Unexpected response: ${invalidExpiresResponse.toString()}`
      );
      const errorResponse = invalidExpiresResponse as GenerateApiKey.Error;
      expectWithMessage(
        () =>
          expect(errorResponse.errorCode()).toEqual(
            MomentoErrorCode.INVALID_ARGUMENT_ERROR
          ),
        `Unexpected error code: ${errorResponse.errorCode()}`
      );
    });
  });

  describe('refresh auth token use auth token credentials', () => {
    it('should succeed for refreshing an auth token', async () => {
      const generateResponse = await sessionTokenAuthClient.generateApiKey(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.seconds(10)
      );
      expectWithMessage(() => {
        expect(generateResponse).toBeInstanceOf(GenerateApiKey.Success);
      }, `Unexpected response: ${generateResponse.toString()}`);
      const generateSuccessRst = generateResponse as GenerateApiKey.Success;

      const authTokenAuthClient = authTokenAuthClientFactory(
        generateSuccessRst.apiKey
      );

      // we need to sleep for a bit here so that the timestamp on the refreshed token will be different than the
      // one on the original token
      const delaySecondsBeforeRefresh = 2;
      await delay(delaySecondsBeforeRefresh * 1000);

      const refreshResponse = await authTokenAuthClient.refreshApiKey(
        generateSuccessRst.refreshToken
      );
      expectWithMessage(() => {
        expect(refreshResponse).toBeInstanceOf(RefreshApiKey.Success);
      }, `Unexpected response: ${refreshResponse.toString()}`);
      const refreshSuccessRst = refreshResponse as RefreshApiKey.Success;

      const expiresAtDelta =
        refreshSuccessRst.expiresAt.epoch() -
        generateSuccessRst.expiresAt.epoch();

      expect(expiresAtDelta).toBeGreaterThanOrEqual(delaySecondsBeforeRefresh);
      expect(expiresAtDelta).toBeLessThanOrEqual(
        delaySecondsBeforeRefresh + 10 // to account for network delays and etc
      );
    });

    it("should not succeed for refreshing an api token that's expired", async () => {
      const generateResponse = await sessionTokenAuthClient.generateApiKey(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.seconds(1)
      );
      expectWithMessage(() => {
        expect(generateResponse).toBeInstanceOf(GenerateApiKey.Success);
      }, `Unexpected response: ${generateResponse.toString()}`);
      const generateSuccessRst = generateResponse as GenerateApiKey.Success;

      // Wait 3 sec for the token to expire
      await delay(3000);

      const authTokenAuthClient = authTokenAuthClientFactory(
        generateSuccessRst.apiKey
      );

      const refreshResponse = await authTokenAuthClient.refreshApiKey(
        generateSuccessRst.refreshToken
      );
      expectWithMessage(() => {
        expect(refreshResponse).toBeInstanceOf(RefreshApiKey.Error);
      }, `Unexpected response: ${refreshResponse.toString()}`);
      const errorResponse = refreshResponse as RefreshApiKey.Error;
      const matchesErrorCode =
        errorResponse.errorCode() === MomentoErrorCode.AUTHENTICATION_ERROR ||
        errorResponse.errorCode() === MomentoErrorCode.INVALID_ARGUMENT_ERROR;
      expectWithMessage(
        () => expect(matchesErrorCode).toEqual(true),
        `Unexpected error code: ${errorResponse.errorCode()}`
      );
    });
  });

  describe('should support generating and refreshing auth token through deprecated APIs', () => {
    it('should succeed for generating and refreshing an auth token', async () => {
      const generateResponse = await sessionTokenAuthClient.generateAuthToken(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.seconds(10)
      );
      expectWithMessage(() => {
        expect(generateResponse).toBeInstanceOf(GenerateAuthToken.Success);
      }, `Unexpected response: ${generateResponse.toString()}`);
      const generateSuccessRst = generateResponse as GenerateAuthToken.Success;

      const authTokenAuthClient = authTokenAuthClientFactory(
        generateSuccessRst.authToken
      );

      // we need to sleep for a bit here so that the timestamp on the refreshed token will be different than the
      // one on the original token
      const delaySecondsBeforeRefresh = 2;
      await delay(delaySecondsBeforeRefresh * 1_000);

      const refreshResponse = await authTokenAuthClient.refreshAuthToken(
        generateSuccessRst.refreshToken
      );
      expectWithMessage(() => {
        expect(refreshResponse).toBeInstanceOf(RefreshAuthToken.Success);
      }, `Unexpected response: ${refreshResponse.toString()}`);
      const refreshSuccessRst = refreshResponse as RefreshAuthToken.Success;

      expect(refreshSuccessRst.is_success);

      expect(refreshSuccessRst.authToken).not.toEqual(
        generateSuccessRst.authToken
      );

      const expiresAtDelta =
        refreshSuccessRst.expiresAt.epoch() -
        generateSuccessRst.expiresAt.epoch();

      expect(expiresAtDelta).toBeGreaterThanOrEqual(delaySecondsBeforeRefresh);
      expect(expiresAtDelta).toBeLessThanOrEqual(
        delaySecondsBeforeRefresh + 10 // to account for network delays and etc
      );
    });
  });

  describe('generating superuser and AllDataReadWrite tokens', () => {
    it("expired token can't create cache", async () => {
      const generateResponse = await sessionTokenAuthClient.generateApiKey(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.seconds(1)
      );
      expectWithMessage(() => {
        expect(generateResponse).toBeInstanceOf(GenerateApiKey.Success);
      }, `Unexpected response: ${generateResponse.toString()}`);
      const generateSuccessRst = generateResponse as GenerateApiKey.Success;

      // Wait 3 sec for the token to expire
      await delay(3000);

      const cacheClient = cacheClientFactory(generateSuccessRst.apiKey);

      const cacheName = 'expired-token-should-fail-to-create-cache';
      const createCacheRst = await cacheClient.createCache(cacheName);

      // If this test fails for whatever reason, we should make sure not to leak the cache
      await cacheClient.deleteCache(cacheName);

      expectWithMessage(
        () => expect(createCacheRst).toBeInstanceOf(CreateCache.Error),
        `Unexpected response: ${generateResponse.toString()}`
      );
      const createCacheErrorRst = createCacheRst as CreateCache.Error;
      expectWithMessage(
        () =>
          expect(createCacheErrorRst.errorCode()).toEqual(
            MomentoErrorCode.AUTHENTICATION_ERROR
          ),
        `Unexpected error code: ${createCacheErrorRst.errorCode()}`
      );
    });

    it('should support generating a superuser token when authenticated via a session token', async () => {
      const generateResponse = await sessionTokenAuthClient.generateApiKey(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.seconds(1)
      );
      expectWithMessage(() => {
        expect(generateResponse).toBeInstanceOf(GenerateApiKey.Success);
      }, `Unexpected response: ${generateResponse.toString()}`);
    });

    it('should support generating an AllDataReadWrite token when authenticated via a session token', async () => {
      const generateResponse = await sessionTokenAuthClient.generateApiKey(
        AllDataReadWrite,
        ExpiresIn.seconds(1)
      );
      expectWithMessage(() => {
        expect(generateResponse).toBeInstanceOf(GenerateApiKey.Success);
      }, `Unexpected response: ${generateResponse.toString()}`);
    });

    it('should not support generating a superuser token when authenticated via a v1 superuser token', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expectWithMessage(() => {
        expect(superUserTokenResponse).toBeInstanceOf(GenerateApiKey.Success);
      }, `Unexpected response: ${superUserTokenResponse.toString()}`);

      const authClient = authTokenAuthClientFactory(
        (superUserTokenResponse as GenerateApiKey.Success).apiKey
      );

      const generateResponse = await authClient.generateApiKey(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.seconds(1)
      );
      expectWithMessage(() => {
        expect(generateResponse).toBeInstanceOf(GenerateApiKey.Error);
      }, `Unexpected response: ${generateResponse.toString()}`);
      const error = generateResponse as GenerateApiKey.Error;
      expectWithMessage(
        () =>
          expect(error.errorCode()).toEqual(MomentoErrorCode.PERMISSION_ERROR),
        `Unexpected error code: ${error.errorCode()}`
      );
      expect(error.message()).toContain('Insufficient permissions');
    });

    it('should support generating an AllDataReadWrite token when authenticated via a v1 superuser token', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expectWithMessage(() => {
        expect(superUserTokenResponse).toBeInstanceOf(GenerateApiKey.Success);
      }, `Unexpected response: ${superUserTokenResponse.toString()}`);

      const authClient = authTokenAuthClientFactory(
        (superUserTokenResponse as GenerateApiKey.Success).apiKey
      );

      const generateResponse = await authClient.generateApiKey(
        AllDataReadWrite,
        ExpiresIn.seconds(1)
      );
      expectWithMessage(() => {
        expect(generateResponse).toBeInstanceOf(GenerateApiKey.Success);
      }, `Unexpected response: ${generateResponse.toString()}`);
    });

    it('should not support generating a superuser token when authenticated via a v1 AllDataReadWrite token', async () => {
      const allDataReadWriteTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          AllDataReadWrite,
          ExpiresIn.seconds(10)
        );
      expectWithMessage(
        () =>
          expect(allDataReadWriteTokenResponse).toBeInstanceOf(
            GenerateApiKey.Success
          ),
        `Unexpected response: ${allDataReadWriteTokenResponse.toString()}`
      );

      const authClient = authTokenAuthClientFactory(
        (allDataReadWriteTokenResponse as GenerateApiKey.Success).apiKey
      );

      const generateResponse = await authClient.generateApiKey(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.seconds(1)
      );
      expectWithMessage(() => {
        expect(generateResponse).toBeInstanceOf(GenerateApiKey.Error);
      }, `Unexpected response: ${generateResponse.toString()}`);
    });

    it('should not support generating an AllDataReadWrite token when authenticated via a v1 AllDataReadWrite token', async () => {
      const allDataReadWriteTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          AllDataReadWrite,
          ExpiresIn.seconds(10)
        );
      expect(allDataReadWriteTokenResponse).toBeInstanceOf(
        GenerateApiKey.Success
      );

      const authClient = authTokenAuthClientFactory(
        (allDataReadWriteTokenResponse as GenerateApiKey.Success).apiKey
      );

      const generateResponse = await authClient.generateApiKey(
        AllDataReadWrite,
        ExpiresIn.seconds(1)
      );
      expectWithMessage(() => {
        expect(generateResponse).toBeInstanceOf(GenerateApiKey.Error);
      }, `Unexpected response: ${generateResponse.toString()}`);
    });

    it('should not support generating a superuser token when authenticated via a legacy token', async () => {
      const generateResponse = await legacyTokenAuthClient.generateApiKey(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.seconds(1)
      );
      expectWithMessage(() => {
        expect(generateResponse).toBeInstanceOf(GenerateApiKey.Error);
      }, `Unexpected response: ${generateResponse.toString()}`);
    });

    it('should not support generating an AllDataReadWrite token when authenticated via a legacy token', async () => {
      const generateResponse = await legacyTokenAuthClient.generateApiKey(
        AllDataReadWrite,
        ExpiresIn.seconds(1)
      );
      expectWithMessage(() => {
        expect(generateResponse).toBeInstanceOf(GenerateApiKey.Error);
      }, `Unexpected response: ${generateResponse.toString()}`);
    });
  });

  describe('AllDataReadWrite token scope', () => {
    let allDataReadWriteClient: ICacheClient;

    beforeAll(async () => {
      const generateResponse = await sessionTokenAuthClient.generateApiKey(
        AllDataReadWrite,
        ExpiresIn.seconds(60)
      );
      expectWithMessage(() => {
        expect(generateResponse).toBeInstanceOf(GenerateApiKey.Success);
      }, `Unexpected response: ${generateResponse.toString()}`);
      const allDataReadWriteToken = (generateResponse as GenerateApiKey.Success)
        .apiKey;
      allDataReadWriteClient = cacheClientFactory(allDataReadWriteToken);
    });

    it('cannot create a cache', async () => {
      const cacheName =
        'AllDataReadWrite-token-scope-should-fail-to-create-cache';
      const createCacheResponse = await allDataReadWriteClient.createCache(
        cacheName
      );
      // If this test fails for whatever reason, we should make sure not to leak the cache
      await allDataReadWriteClient.deleteCache(cacheName);

      expectWithMessage(
        () => expect(createCacheResponse).toBeInstanceOf(CreateCache.Error),
        `Unexpected response: ${createCacheResponse.toString()}`
      );
      const createCacheError = createCacheResponse as CreateCache.Error;
      expectWithMessage(
        () =>
          expect(createCacheError.errorCode()).toEqual(
            MomentoErrorCode.PERMISSION_ERROR
          ),
        `Unexpected error code: ${createCacheError.errorCode()}`
      );
      expect(createCacheError.message()).toContain('Insufficient permissions');
    });

    it('cannot delete a cache', async () => {
      const deleteCacheResponse = await allDataReadWriteClient.deleteCache(
        cacheName
      );
      expectWithMessage(
        () => expect(deleteCacheResponse).toBeInstanceOf(DeleteCache.Error),
        `Unexpected response: ${deleteCacheResponse.toString()}`
      );
      const deleteCacheError = deleteCacheResponse as DeleteCache.Error;
      expectWithMessage(
        () =>
          expect(deleteCacheError.errorCode()).toEqual(
            MomentoErrorCode.PERMISSION_ERROR
          ),
        `Unexpected error code: ${deleteCacheError.errorCode()}`
      );
      expect(deleteCacheError.message()).toContain('Insufficient permissions');
    });

    it('can set values in an existing cache', async () => {
      const setResponse = await allDataReadWriteClient.set(
        cacheName,
        'foo',
        'FOO'
      );
      expectWithMessage(
        () => expect(setResponse).toBeInstanceOf(CacheSet.Success),
        `Unexpected response: ${setResponse.toString()}`
      );
    });

    it('can get values from an existing cache', async () => {
      const getResponse = await allDataReadWriteClient.get(
        cacheName,
        'habanero'
      );
      expectWithMessage(
        () => expect(getResponse).toBeInstanceOf(CacheGet.Miss),
        `Unexpected response: ${getResponse.toString()}`
      );
    });
  });

  describe('Fine grained authorization scenarios', () => {
    const FGA_CACHE_1 = 'js-fga-' + v4();
    const FGA_CACHE_2 = 'js-fga-' + v4();
    const FGA_CACHE_1_KEY = 'foo';
    const FGA_CACHE_1_VALUE = 'FOO';
    const FGA_CACHE_2_KEY = 'bar';
    const FGA_CACHE_2_VALUE = 'BAR';

    const trivialHandlers: SubscribeCallOptions = {
      onError: () => {
        return;
      },
      onItem: () => {
        return;
      },
    };

    // Setup 2 caches. Note: caches may be leaked if afterAll is not run due to an interruption
    beforeAll(async () => {
      const createCache1 = await sessionTokenCacheClient.createCache(
        FGA_CACHE_1
      );
      expectWithMessage(() => {
        expect(createCache1).toBeInstanceOf(CreateCache.Success);
      }, `Expected SUCCESS but received ${createCache1.toString()}`);

      const createCache2 = await sessionTokenCacheClient.createCache(
        FGA_CACHE_2
      );
      expectWithMessage(() => {
        expect(createCache1).toBeInstanceOf(CreateCache.Success);
      }, `Expected SUCCESS but received ${createCache2.toString()}`);

      const setCache1Value1 = await sessionTokenCacheClient.set(
        FGA_CACHE_1,
        'foo',
        'FOO',
        {ttl: 600}
      );
      expectWithMessage(() => {
        expect(setCache1Value1).toBeInstanceOf(CacheSet.Success);
      }, `Expected SUCCESS but received ${setCache1Value1.toString()}`);

      const setCache1Value2 = await sessionTokenCacheClient.set(
        FGA_CACHE_1,
        'pet-cat',
        'meow',
        {ttl: 600}
      );
      expectWithMessage(() => {
        expect(setCache1Value2).toBeInstanceOf(CacheSet.Success);
      }, `Expected SUCCESS but received ${setCache1Value2.toString()}`);

      const setCache1Value3 = await sessionTokenCacheClient.set(
        FGA_CACHE_1,
        'pet-dog',
        'woof',
        {ttl: 600}
      );
      expectWithMessage(() => {
        expect(setCache1Value3).toBeInstanceOf(CacheSet.Success);
      }, `Expected SUCCESS but received ${setCache1Value3.toString()}`);

      const setCache1Value4 = await sessionTokenCacheClient.set(
        FGA_CACHE_1,
        'cow',
        'moo',
        {ttl: 600}
      );
      expectWithMessage(() => {
        expect(setCache1Value4).toBeInstanceOf(CacheSet.Success);
      }, `Expected SUCCESS but received ${setCache1Value4.toString()}`);

      const setCache2Value1 = await sessionTokenCacheClient.set(
        FGA_CACHE_2,
        'bar',
        'BAR',
        {ttl: 600}
      );
      expectWithMessage(() => {
        expect(setCache2Value1).toBeInstanceOf(CacheSet.Success);
      }, `Expected SUCCESS but received ${setCache2Value1.toString()}`);

      const setCache2Value2 = await sessionTokenCacheClient.set(
        FGA_CACHE_2,
        'pet-bird',
        'tweet',
        {ttl: 600}
      );
      expectWithMessage(() => {
        expect(setCache2Value2).toBeInstanceOf(CacheSet.Success);
      }, `Expected SUCCESS but received ${setCache2Value2.toString()}`);

      const setCache2Value3 = await sessionTokenCacheClient.set(
        FGA_CACHE_2,
        'pet-fish',
        'blub',
        {ttl: 600}
      );
      expectWithMessage(() => {
        expect(setCache2Value3).toBeInstanceOf(CacheSet.Success);
      }, `Expected SUCCESS but received ${setCache2Value3.toString()}`);

      const setCache2Value4 = await sessionTokenCacheClient.set(
        FGA_CACHE_2,
        'cow',
        'moo',
        {ttl: 600}
      );
      expectWithMessage(() => {
        expect(setCache2Value4).toBeInstanceOf(CacheSet.Success);
      }, `Expected SUCCESS but received ${setCache2Value4.toString()}`);
    });

    it('cannot create token with empty permission list', async () => {
      const tokenResponse = await sessionTokenAuthClient.generateApiKey(
        {permissions: []},
        ExpiresIn.seconds(60)
      );
      expectWithMessage(() => {
        expect(tokenResponse).toBeInstanceOf(GenerateApiKey.Error);
      }, `Expected ERROR but received ${tokenResponse.toString()}`);

      const tokenError = tokenResponse as GenerateApiKey.Error;
      expectWithMessage(() => {
        expect(tokenError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `Expected INVALID_ARGUMENT_ERROR but received ${tokenError.errorCode()}`);
    });

    it('cannot create token with duplicate/conflicting cache permissions - all caches', async () => {
      const tokenResponse = await sessionTokenAuthClient.generateApiKey(
        {
          permissions: [
            {role: CacheRole.ReadOnly, cache: AllCaches},
            {role: CacheRole.ReadWrite, cache: AllCaches},
          ],
        },
        ExpiresIn.seconds(60)
      );
      expectWithMessage(() => {
        expect(tokenResponse).toBeInstanceOf(GenerateApiKey.Error);
      }, `Expected ERROR but received ${tokenResponse.toString()}`);

      const tokenError = tokenResponse as GenerateApiKey.Error;
      expectWithMessage(() => {
        expect(tokenError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `Expected INVALID_ARGUMENT_ERROR but received ${tokenError.errorCode()}`);
    });

    it('cannot create token with duplicate/conflicting cache permissions - cache name', async () => {
      const tokenResponse = await sessionTokenAuthClient.generateApiKey(
        {
          permissions: [
            {role: CacheRole.ReadOnly, cache: 'i-am-groot'},
            {role: CacheRole.ReadWrite, cache: {name: 'i-am-groot'}},
          ],
        },
        ExpiresIn.seconds(60)
      );
      expectWithMessage(() => {
        expect(tokenResponse).toBeInstanceOf(GenerateApiKey.Error);
      }, `Expected ERROR but received ${tokenResponse.toString()}`);

      const tokenError = tokenResponse as GenerateApiKey.Error;
      expectWithMessage(() => {
        expect(tokenError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `Expected INVALID_ARGUMENT_ERROR but received ${tokenError.errorCode()}`);
    });

    it('cannot create token with duplicate/conflicting topic permissions - cache + topic name', async () => {
      const tokenResponse = await sessionTokenAuthClient.generateApiKey(
        {
          permissions: [
            {
              role: TopicRole.SubscribeOnly,
              cache: 'i-am-groot',
              topic: 'rocket-raccoon',
            },
            {
              role: TopicRole.PublishSubscribe,
              cache: {name: 'i-am-groot'},
              topic: {name: 'rocket-raccoon'},
            },
          ],
        },
        ExpiresIn.seconds(60)
      );
      expectWithMessage(() => {
        expect(tokenResponse).toBeInstanceOf(GenerateApiKey.Error);
      }, `Expected ERROR but received ${tokenResponse.toString()}`);

      const tokenError = tokenResponse as GenerateApiKey.Error;
      expectWithMessage(() => {
        expect(tokenError.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }, `Expected INVALID_ARGUMENT_ERROR but received ${tokenError.errorCode()}`);
    });

    it('can only read all caches', async () => {
      const readAllCachesTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          PermissionScopes.cacheReadOnly(AllCaches),
          ExpiresIn.seconds(60)
        );
      expectWithMessage(() => {
        expect(readAllCachesTokenResponse).toBeInstanceOf(
          GenerateApiKey.Success
        );
      }, `Expected SUCCESS but received ${readAllCachesTokenResponse.toString()}`);

      const readAllCachesToken = (
        readAllCachesTokenResponse as GenerateApiKey.Success
      ).apiKey;
      const cacheClient = cacheClientFactory(readAllCachesToken);

      // 1. Sets should fail
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'homer', 'simpson');
      expectWithMessage(() => {
        expect(setResp1).toBePermissionDeniedForCacheSet();
      }, `Expected ERROR but received ${setResp1.toString()}`);

      const setResp2 = await cacheClient.set(FGA_CACHE_2, 'oye', 'caramba');
      expectWithMessage(() => {
        expect(setResp2).toBePermissionDeniedForCacheSet();
      }, `Expected ERROR but received ${setResp2.toString()}`);

      // 2. Gets for existing keys should succeed with hits
      const getResp1 = await cacheClient.get(FGA_CACHE_1, FGA_CACHE_1_KEY);
      expectWithMessage(() => {
        expect(getResp1).toBeHit(FGA_CACHE_1_VALUE);
      }, `Expected ERROR but received ${getResp1.toString()}`);

      const getResp2 = await cacheClient.get(FGA_CACHE_2, FGA_CACHE_2_KEY);
      expectWithMessage(() => {
        expect(getResp2).toBeHit(FGA_CACHE_2_VALUE);
      }, `Expected ERROR but received ${getResp2.toString()}`);

      // 3. Gets for non-existing keys return misses
      const missResp1 = await cacheClient.get(FGA_CACHE_1, 'i-exist-not');
      expectWithMessage(() => {
        expect(missResp1).toBeInstanceOf(CacheGet.Miss);
      }, `Expected MISS but received ${missResp1.toString()}`);

      const missResp2 = await cacheClient.get(FGA_CACHE_2, 'i-exist-not');
      expectWithMessage(() => {
        expect(missResp2).toBeInstanceOf(CacheGet.Miss);
      }, `Expected MISS but received ${missResp2.toString()}`);

      const topicClient = topicClientFactory(readAllCachesToken);
      const topicName = testTopicName();
      const pubResp = await topicClient.publish(
        FGA_CACHE_1,
        topicName,
        'There is a werewolf in the City Watch!!!!!'
      );
      expectWithMessage(() => {
        expect(pubResp).toBePermissionDeniedForTopicPublish();
      }, `Expected ERROR but received ${pubResp.toString()}`);

      const subResp = await topicClient.subscribe(
        FGA_CACHE_1,
        topicName,
        trivialHandlers
      );
      expectWithMessage(() => {
        expect(subResp).toBePermissionDeniedForTopicSubscribe();
      }, `Expected ERROR but received ${subResp.toString()}`);
    });

    it('can only read all topics', async () => {
      const readAllTopicsTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          PermissionScopes.topicSubscribeOnly(AllCaches, AllTopics),
          ExpiresIn.seconds(60)
        );
      expectWithMessage(() => {
        expect(readAllTopicsTokenResponse).toBeInstanceOf(
          GenerateApiKey.Success
        );
      }, `Expected SUCCESS but received ${readAllTopicsTokenResponse.toString()}`);

      const readAllTopicsToken = (
        readAllTopicsTokenResponse as GenerateApiKey.Success
      ).apiKey;
      const cacheClient = cacheClientFactory(readAllTopicsToken);

      // Sets should fail
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'homer', 'simpson');
      expectWithMessage(() => {
        expect(setResp1).toBePermissionDeniedForCacheSet();
      }, `Expected ERROR but received ${setResp1.toString()}`);

      const setResp2 = await cacheClient.set(FGA_CACHE_2, 'oye', 'caramba');
      expectWithMessage(() => {
        expect(setResp2).toBePermissionDeniedForCacheSet();
      }, `Expected ERROR but received ${setResp2.toString()}`);

      // Gets should fail
      const getKey1 = await cacheClient.get(FGA_CACHE_1, FGA_CACHE_1_KEY);
      expectWithMessage(() => {
        expect(getKey1).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey1.toString()}`);

      const getKey2 = await cacheClient.get(FGA_CACHE_2, FGA_CACHE_2_KEY);
      expectWithMessage(() => {
        expect(getKey2).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey2.toString()}`);

      const topicName = testTopicName();
      const topicClient = topicClientFactory(readAllTopicsToken);
      // Publish should fail
      const pubResp = await topicClient.publish(
        FGA_CACHE_1,
        topicName,
        'The Truth Shall Make Ye Fret'
      );
      expectWithMessage(() => {
        expect(pubResp).toBePermissionDeniedForTopicPublish();
      }, `Expected ERROR but received ${pubResp.toString()}`);

      // Subscribe should succeed
      const subResp = await topicClient.subscribe(
        FGA_CACHE_1,
        topicName,
        trivialHandlers
      );
      expectWithMessage(() => {
        expect(subResp).toBeInstanceOf(TopicSubscribe.Subscription);
      }, `Expected SUBSCRIPTION but received ${subResp.toString()}`);
    });

    it('can read/write cache FGA_CACHE_1 and read/write all topics in cache FGA_CACHE_2', async () => {
      const tokenResponse = await sessionTokenAuthClient.generateApiKey(
        {
          permissions: [
            {role: CacheRole.ReadWrite, cache: FGA_CACHE_1},
            {
              role: TopicRole.PublishSubscribe,
              cache: FGA_CACHE_2,
              topic: AllTopics,
            },
          ],
        },
        ExpiresIn.seconds(60)
      );
      expectWithMessage(() => {
        expect(tokenResponse).toBeInstanceOf(GenerateApiKey.Success);
      }, `Expected SUCCESS but received ${tokenResponse.toString()}`);

      const token = (tokenResponse as GenerateApiKey.Success).apiKey;
      const cacheClient = cacheClientFactory(token);

      // Read/Write on cache FGA_CACHE_1 is allowed
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'ned', 'flanders');
      expectWithMessage(() => {
        expect(setResp1).toBeInstanceOf(CacheSet.Success);
      }, `Expected SUCCESS but received ${setResp1.toString()}`);

      const getResp1 = await cacheClient.get(FGA_CACHE_1, 'ned');
      expectWithMessage(() => {
        expect(getResp1).toBeHit('flanders');
      }, `Expected HIT but received ${getResp1.toString()}`);

      // Read/Write on cache FGA_CACHE_2 is not allowed
      const setResp2 = await cacheClient.set(FGA_CACHE_2, 'flaming', 'mo');
      expectWithMessage(() => {
        expect(setResp2).toBePermissionDeniedForCacheSet();
      }, `Expected ERROR but received ${setResp2.toString()}`);

      const getResp2 = await cacheClient.get(FGA_CACHE_2, 'flaming');
      expectWithMessage(() => {
        expect(getResp2).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getResp2.toString()}`);

      const topicName = testTopicName();
      const topicClient = topicClientFactory(token);
      // Read/Write on topics in cache FGA_CACHE_1 is not allowed
      const pubResp = await topicClient.publish(
        FGA_CACHE_1,
        topicName,
        'Flying lizard seen over Manhattan!'
      );
      expectWithMessage(() => {
        expect(pubResp).toBePermissionDeniedForTopicPublish();
      }, `Expected ERROR but received ${pubResp.toString()}`);

      const subResp = await topicClient.subscribe(
        FGA_CACHE_1,
        topicName,
        trivialHandlers
      );
      expectWithMessage(() => {
        expect(subResp).toBePermissionDeniedForTopicSubscribe();
      }, `Expected ERROR but received ${subResp.toString()}`);

      // Read/Write on topics in cache FGA_CACHE_2 is allowed
      const pubResp1 = await topicClient.publish(
        FGA_CACHE_2,
        topicName,
        'UFOs spotted'
      );
      expectWithMessage(() => {
        expect(pubResp1).toBeInstanceOf(TopicPublish.Success);
      }, `Expected SUCCESS but received ${pubResp1.toString()}`);

      const subResp1 = await topicClient.subscribe(
        FGA_CACHE_2,
        topicName,
        trivialHandlers
      );
      expectWithMessage(() => {
        expect(subResp1).toBeInstanceOf(TopicSubscribe.Subscription);
      }, `expected SUBSCRIPTION but got ${subResp1.toString()}`);
    });

    it('can generate disposable token with valid permissions, expiry and a tokenID', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expectWithMessage(() => {
        expect(superUserTokenResponse).toBeInstanceOf(GenerateApiKey.Success);
      }, `Expected SUCCESS but received ${superUserTokenResponse.toString()}`);

      const authClient = authTokenAuthClientFactory(
        (superUserTokenResponse as GenerateApiKey.Success).apiKey
      );

      const tokenResponse = await authClient.generateDisposableToken(
        {
          permissions: [
            {role: CacheRole.WriteOnly, cache: FGA_CACHE_1},
            {
              role: TopicRole.PublishSubscribe,
              cache: FGA_CACHE_2,
              topic: AllTopics,
            },
          ],
        },
        ExpiresIn.seconds(60),
        {tokenId: 'myTokenID'}
      );

      expectWithMessage(() => {
        expect(tokenResponse).toBeInstanceOf(GenerateDisposableToken.Success);
      }, `Expected SUCCESS but received ${tokenResponse.toString()}`);

      const token = (tokenResponse as GenerateDisposableToken.Success)
        .authToken;

      const topicClient = topicClientFactory(token);
      const topicName = testTopicName();

      const receivedValues: TopicItem[] = [];

      let done = false;
      const subscribeResponse = await topicClient.subscribe(
        FGA_CACHE_2,
        topicName,
        {
          onItem: (item: TopicItem) => {
            receivedValues.push(item);
          },
          onError: (error: TopicSubscribe.Error) => {
            if (!done) {
              throw new Error(error.message());
            }
          },
        }
      );
      expectWithMessage(() => {
        expect(subscribeResponse).toBeInstanceOf(TopicSubscribe.Subscription);
      }, `expected SUBSCRIPTION but got ${subscribeResponse.toString()}`);

      // Wait for stream to start.
      await sleep(2000);
      const pubResp1 = await topicClient.publish(
        FGA_CACHE_2,
        topicName,
        'humans landed on Mars!'
      );
      expectWithMessage(() => {
        expect(pubResp1).toBeInstanceOf(TopicPublish.Success);
      }, `Expected SUCCESS but received ${pubResp1.toString()}`);

      // wait for values
      await sleep(2000);

      expect(receivedValues[0].valueString()).toEqual('humans landed on Mars!');
      expect(receivedValues[0].tokenId()).toEqual('myTokenID');
      expect(receivedValues[0].toString()).toEqual(
        'TopicItem: humans landed on Mars!; Token Id: myTokenID'
      );
      done = true;

      // Need to close the stream before the test ends or else the test will hang.
      (subscribeResponse as TopicSubscribe.Subscription).unsubscribe();
    });

    it('throws error when tokenID more than max length', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expectWithMessage(() => {
        expect(superUserTokenResponse).toBeInstanceOf(GenerateApiKey.Success);
      }, `Expected SUCCESS but received ${superUserTokenResponse.toString()}`);

      const authClient = authTokenAuthClientFactory(
        (superUserTokenResponse as GenerateApiKey.Success).apiKey
      );

      const tokenResponse = await authClient.generateDisposableToken(
        {
          permissions: [{role: CacheRole.WriteOnly, cache: FGA_CACHE_1}],
        },
        ExpiresIn.seconds(60),
        {tokenId: 't'.repeat(66)}
      );
      expectWithMessage(() => {
        expect(tokenResponse).toBeInstanceOf(GenerateDisposableToken.Error);
        if (tokenResponse instanceof GenerateDisposableToken.Error) {
          expect(tokenResponse.errorCode()).toEqual(
            MomentoErrorCode.INVALID_ARGUMENT_ERROR
          );
        }
      }, `Expected ERROR but received ${tokenResponse.toString()}`);
    });

    it('can only write cache FGA_CACHE_1 and write all topics in cache FGA_CACHE_2', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expectWithMessage(() => {
        expect(superUserTokenResponse).toBeInstanceOf(GenerateApiKey.Success);
      }, `Expected SUCCESS but received ${superUserTokenResponse.toString()}`);

      const authClient = authTokenAuthClientFactory(
        (superUserTokenResponse as GenerateApiKey.Success).apiKey
      );

      const tokenResponse = await authClient.generateDisposableToken(
        {
          permissions: [
            {role: CacheRole.WriteOnly, cache: FGA_CACHE_1},
            {
              role: TopicRole.PublishOnly,
              cache: FGA_CACHE_2,
              topic: AllTopics,
            },
          ],
        },
        ExpiresIn.seconds(60)
      );
      expectWithMessage(() => {
        expect(tokenResponse).toBeInstanceOf(GenerateDisposableToken.Success);
      }, `Expected SUCCESS but received ${tokenResponse.toString()}`);

      const token = (tokenResponse as GenerateDisposableToken.Success)
        .authToken;
      const cacheClient = cacheClientFactory(token);

      // Only Write on cache FGA_CACHE_1 is allowed
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'ned', 'flanders');
      expectWithMessage(() => {
        expect(setResp1).toBeInstanceOf(CacheSet.Success);
      }, `Expected SUCCESS but received ${setResp1.toString()}`);

      const getResp1 = await cacheClient.get(FGA_CACHE_1, 'ned');
      expectWithMessage(() => {
        expect(getResp1).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getResp1.toString()}`);

      // Read/Write on cache FGA_CACHE_2 is not allowed
      const setResp2 = await cacheClient.set(FGA_CACHE_2, 'flaming', 'mo');
      expectWithMessage(() => {
        expect(setResp2).toBePermissionDeniedForCacheSet();
      }, `Expected ERROR but received ${setResp2.toString()}`);

      const getResp2 = await cacheClient.get(FGA_CACHE_2, 'flaming');
      expectWithMessage(() => {
        expect(getResp2).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getResp2.toString()}`);

      const topicName = testTopicName();
      const topicClient = topicClientFactory(token);
      // Read/Write on topics in cache FGA_CACHE_1 is not allowed
      const pubResp = await topicClient.publish(
        FGA_CACHE_1,
        topicName,
        'Flying lizard seen over Manhattan!'
      );
      expectWithMessage(() => {
        expect(pubResp).toBePermissionDeniedForTopicPublish();
      }, `Expected ERROR but received ${pubResp.toString()}`);

      const subResp = await topicClient.subscribe(
        FGA_CACHE_1,
        topicName,
        trivialHandlers
      );
      expectWithMessage(() => {
        expect(subResp).toBePermissionDeniedForTopicSubscribe();
      }, `Expected ERROR but received ${subResp.toString()}`);

      // Only Write on topics in cache FGA_CACHE_2 is allowed
      const pubResp1 = await topicClient.publish(
        FGA_CACHE_2,
        topicName,
        'UFOs spotted'
      );
      expectWithMessage(() => {
        expect(pubResp1).toBeInstanceOf(TopicPublish.Success);
      }, `Expected SUCCESS but received ${pubResp1.toString()}`);

      const subResp1 = await topicClient.subscribe(
        FGA_CACHE_2,
        topicName,
        trivialHandlers
      );
      expectWithMessage(() => {
        expect(subResp1).toBePermissionDeniedForTopicSubscribe();
      }, `Expected ERROR but received ${subResp1.toString()}`);
    });

    it('can only read specific keys and key-prefixes from all caches', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expectWithMessage(() => {
        expect(superUserTokenResponse).toBeInstanceOf(GenerateApiKey.Success);
      }, `Expected SUCCESS but received ${superUserTokenResponse.toString()}`);

      const authClient = authTokenAuthClientFactory(
        (superUserTokenResponse as GenerateApiKey.Success).apiKey
      );

      const tokenResponse = await authClient.generateDisposableToken(
        {
          permissions: [
            {role: CacheRole.ReadOnly, cache: AllCaches, item: {key: 'cow'}},
            {
              role: CacheRole.ReadOnly,
              cache: AllCaches,
              item: {keyPrefix: 'pet'},
            },
          ],
        },
        ExpiresIn.seconds(60)
      );
      expectWithMessage(() => {
        expect(tokenResponse).toBeInstanceOf(GenerateDisposableToken.Success);
      }, `Expected SUCCESS but received ${tokenResponse.toString()}`);

      const token = (tokenResponse as GenerateDisposableToken.Success)
        .authToken;
      const cacheClient = cacheClientFactory(token);

      // 1. Sets should fail
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'cow', 'meow');
      expectWithMessage(() => {
        expect(setResp1).toBePermissionDeniedForCacheSet();
      }, `Expected ERROR but received ${setResp1.toString()}`);

      const setResp2 = await cacheClient.set(FGA_CACHE_2, 'pet-fish', 'woof');
      expectWithMessage(() => {
        expect(setResp2).toBePermissionDeniedForCacheSet();
      }, `Expected ERROR but received ${setResp2.toString()}`);

      // 2. Gets to a specific key should work for both caches, and not for any other key
      const getKey1 = await cacheClient.get(FGA_CACHE_1, 'cow');
      expectWithMessage(() => {
        expect(getKey1).toBeHit('moo');
      }, `Expected HIT but received ${getKey1.toString()}`);

      const getKey2 = await cacheClient.get(FGA_CACHE_2, 'cow');
      expectWithMessage(() => {
        expect(getKey2).toBeHit('moo');
      }, `Expected HIT but received ${getKey2.toString()}`);

      const getKey3 = await cacheClient.get(FGA_CACHE_1, FGA_CACHE_1_KEY);
      expectWithMessage(() => {
        expect(getKey3).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey3.toString()}`);

      const getKey4 = await cacheClient.get(FGA_CACHE_2, FGA_CACHE_2_KEY);
      expectWithMessage(() => {
        expect(getKey4).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey4.toString()}`);

      const getKey5 = await cacheClient.get(FGA_CACHE_1, 'does-not-exist');
      expectWithMessage(() => {
        expect(getKey5).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey5.toString()}`);

      const getKey6 = await cacheClient.get(FGA_CACHE_2, 'does-not-exist');
      expectWithMessage(() => {
        expect(getKey6).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey6.toString()}`);
    });

    it('can only read specific keys and key-prefixes from cache FGA_CACHE_1', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expectWithMessage(() => {
        expect(superUserTokenResponse).toBeInstanceOf(GenerateApiKey.Success);
      }, `Expected SUCCESS but received ${superUserTokenResponse.toString()}`);

      const authClient = authTokenAuthClientFactory(
        (superUserTokenResponse as GenerateApiKey.Success).apiKey
      );

      const tokenResponse = await authClient.generateDisposableToken(
        {
          permissions: [
            {role: CacheRole.ReadOnly, cache: FGA_CACHE_1, item: {key: 'cow'}},
            {
              role: CacheRole.ReadOnly,
              cache: FGA_CACHE_1,
              item: {keyPrefix: 'pet'},
            },
          ],
        },
        ExpiresIn.seconds(60)
      );
      expectWithMessage(() => {
        expect(tokenResponse).toBeInstanceOf(GenerateDisposableToken.Success);
      }, `Expected SUCCESS but received ${tokenResponse.toString()}`);

      const token = (tokenResponse as GenerateDisposableToken.Success)
        .authToken;
      const cacheClient = cacheClientFactory(token);

      // 1. Sets should fail
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'cow', 'meow');
      expectWithMessage(() => {
        expect(setResp1).toBePermissionDeniedForCacheSet();
      }, `Expected ERROR but received ${setResp1.toString()}`);

      const setResp2 = await cacheClient.set(FGA_CACHE_1, 'pet-fish', 'woof');
      expectWithMessage(() => {
        expect(setResp2).toBePermissionDeniedForCacheSet();
      }, `Expected ERROR but received ${setResp2.toString()}`);

      const setResp3 = await cacheClient.set(FGA_CACHE_2, 'pet', 'moo');
      expectWithMessage(() => {
        expect(setResp3).toBePermissionDeniedForCacheSet();
      }, `Expected ERROR but received ${setResp3.toString()}`);

      // 2. Gets to a specific key should work for only FGA_CACHE_1, and not for any other key or cache
      const getKey1 = await cacheClient.get(FGA_CACHE_1, 'cow');
      expectWithMessage(() => {
        expect(getKey1).toBeHit('moo');
      }, `Expected HIT but received ${getKey1.toString()}`);

      const getKey2 = await cacheClient.get(FGA_CACHE_1, FGA_CACHE_1_KEY);
      expectWithMessage(() => {
        expect(getKey2).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey2.toString()}`);

      const getKey3 = await cacheClient.get(FGA_CACHE_2, FGA_CACHE_2_KEY);
      expectWithMessage(() => {
        expect(getKey3).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey3.toString()}`);

      const getKey4 = await cacheClient.get(FGA_CACHE_1, 'does-not-exist');
      expectWithMessage(() => {
        expect(getKey4).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey4.toString()}`);

      const getKey5 = await cacheClient.get(FGA_CACHE_2, 'does-not-exist');
      expectWithMessage(() => {
        expect(getKey5).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey5.toString()}`);
    });

    it('can only write specific keys and key-prefixes from all caches', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expectWithMessage(() => {
        expect(superUserTokenResponse).toBeInstanceOf(GenerateApiKey.Success);
      }, `Expected SUCCESS but received ${superUserTokenResponse.toString()}`);

      const authClient = authTokenAuthClientFactory(
        (superUserTokenResponse as GenerateApiKey.Success).apiKey
      );

      const tokenResponse = await authClient.generateDisposableToken(
        {
          permissions: [
            {role: CacheRole.WriteOnly, cache: AllCaches, item: {key: 'cow'}},
            {
              role: CacheRole.WriteOnly,
              cache: AllCaches,
              item: {keyPrefix: 'pet'},
            },
          ],
        },
        ExpiresIn.seconds(60)
      );
      expectWithMessage(() => {
        expect(tokenResponse).toBeInstanceOf(GenerateDisposableToken.Success);
      }, `Expected SUCCESS but received ${tokenResponse.toString()}`);

      const token = (tokenResponse as GenerateDisposableToken.Success)
        .authToken;
      const cacheClient = cacheClientFactory(token);

      // 1. Sets should pass in both caches
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'cow', 'meow');
      expectWithMessage(() => {
        expect(setResp1).toBeInstanceOf(CacheSet.Success);
      }, `Expected SUCCESS but received ${setResp1.toString()}`);

      const setResp2 = await cacheClient.set(FGA_CACHE_1, 'pet-fish', 'woof');
      expectWithMessage(() => {
        expect(setResp2).toBeInstanceOf(CacheSet.Success);
      }, `Expected SUCCESS but received ${setResp2.toString()}`);

      const setResp3 = await cacheClient.set(FGA_CACHE_2, 'cow', 'meow');
      expectWithMessage(() => {
        expect(setResp3).toBeInstanceOf(CacheSet.Success);
      }, `Expected SUCCESS but received ${setResp3.toString()}`);

      const setResp4 = await cacheClient.set(FGA_CACHE_2, 'pet-bird', 'woof');
      expectWithMessage(() => {
        expect(setResp4).toBeInstanceOf(CacheSet.Success);
      }, `Expected SUCCESS but received ${setResp4.toString()}`);

      // 2. Gets should fail
      const getKey1 = await cacheClient.get(FGA_CACHE_1, 'cow');
      expectWithMessage(() => {
        expect(getKey1).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey1.toString()}`);

      const getKey2 = await cacheClient.get(FGA_CACHE_2, 'pet-fish');
      expectWithMessage(() => {
        expect(getKey2).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey2.toString()}`);

      const getKey3 = await cacheClient.get(FGA_CACHE_1, FGA_CACHE_1_KEY);
      expectWithMessage(() => {
        expect(getKey3).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey3.toString()}`);

      const getKey4 = await cacheClient.get(FGA_CACHE_2, FGA_CACHE_2_KEY);
      expectWithMessage(() => {
        expect(getKey4).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey4.toString()}`);

      const getKey5 = await cacheClient.get(FGA_CACHE_1, 'does-not-exist');
      expectWithMessage(() => {
        expect(getKey5).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey5.toString()}`);

      const getKey6 = await cacheClient.get(FGA_CACHE_2, 'does-not-exist');
      expectWithMessage(() => {
        expect(getKey6).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey6.toString()}`);
    });

    it('can only write specific keys and key-prefixes from cache FGA_CACHE_1', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expectWithMessage(() => {
        expect(superUserTokenResponse).toBeInstanceOf(GenerateApiKey.Success);
      }, `Expected SUCCESS but received ${superUserTokenResponse.toString()}`);

      const authClient = authTokenAuthClientFactory(
        (superUserTokenResponse as GenerateApiKey.Success).apiKey
      );

      const tokenResponse = await authClient.generateDisposableToken(
        {
          permissions: [
            {role: CacheRole.WriteOnly, cache: FGA_CACHE_1, item: {key: 'cow'}},
            {
              role: CacheRole.WriteOnly,
              cache: FGA_CACHE_1,
              item: {keyPrefix: 'pet'},
            },
          ],
        },
        ExpiresIn.seconds(60)
      );
      expectWithMessage(() => {
        expect(tokenResponse).toBeInstanceOf(GenerateDisposableToken.Success);
      }, `Expected SUCCESS but received ${tokenResponse.toString()}`);

      const token = (tokenResponse as GenerateDisposableToken.Success)
        .authToken;
      const cacheClient = cacheClientFactory(token);

      // 1. Sets should pass in only FGA_CACHE_1 and only to the specified keys and key prefixes
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'cow', 'meow');
      expectWithMessage(() => {
        expect(setResp1).toBeInstanceOf(CacheSet.Success);
      }, `Expected SUCCESS but received ${setResp1.toString()}`);

      const setResp2 = await cacheClient.set(FGA_CACHE_1, 'pet-fish', 'woof');
      expectWithMessage(() => {
        expect(setResp2).toBeInstanceOf(CacheSet.Success);
      }, `Expected SUCCESS but received ${setResp2.toString()}`);

      const setResp3 = await cacheClient.set(
        FGA_CACHE_1,
        FGA_CACHE_1_KEY,
        'moo'
      );
      expectWithMessage(() => {
        expect(setResp3).toBePermissionDeniedForCacheSet();
      }, `Expected ERROR but received ${setResp3.toString()}`);

      const setResp4 = await cacheClient.set(FGA_CACHE_2, 'cow', 'meow');
      expectWithMessage(() => {
        expect(setResp4).toBePermissionDeniedForCacheSet();
      }, `Expected ERROR but received ${setResp4.toString()}`);

      const setResp5 = await cacheClient.set(FGA_CACHE_2, 'pet-bird', 'woof');
      expectWithMessage(() => {
        expect(setResp5).toBePermissionDeniedForCacheSet();
      }, `Expected ERROR but received ${setResp5.toString()}`);

      // 2. Gets should fail
      const getKey1 = await cacheClient.get(FGA_CACHE_1, 'cow');
      expectWithMessage(() => {
        expect(getKey1).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey1.toString()}`);

      const getKey2 = await cacheClient.get(FGA_CACHE_2, 'pet-fish');
      expectWithMessage(() => {
        expect(getKey2).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey2.toString()}`);

      const getKey3 = await cacheClient.get(FGA_CACHE_1, FGA_CACHE_1_KEY);
      expectWithMessage(() => {
        expect(getKey3).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey3.toString()}`);

      const getKey4 = await cacheClient.get(FGA_CACHE_2, FGA_CACHE_2_KEY);
      expectWithMessage(() => {
        expect(getKey4).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey4.toString()}`);

      const getKey5 = await cacheClient.get(FGA_CACHE_1, 'does-not-exist');
      expectWithMessage(() => {
        expect(getKey5).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey5.toString()}`);

      const getKey6 = await cacheClient.get(FGA_CACHE_2, 'does-not-exist');
      expectWithMessage(() => {
        expect(getKey6).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey6.toString()}`);
    });

    it('can read and write specific keys and key-prefixes from all caches', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expectWithMessage(() => {
        expect(superUserTokenResponse).toBeInstanceOf(GenerateApiKey.Success);
      }, `Expected SUCCESS but received ${superUserTokenResponse.toString()}`);

      const authClient = authTokenAuthClientFactory(
        (superUserTokenResponse as GenerateApiKey.Success).apiKey
      );

      const tokenResponse = await authClient.generateDisposableToken(
        {
          permissions: [
            {role: CacheRole.ReadWrite, cache: AllCaches, item: {key: 'cow'}},
            {
              role: CacheRole.ReadWrite,
              cache: AllCaches,
              item: {keyPrefix: 'pet'},
            },
          ],
        },
        ExpiresIn.seconds(60)
      );
      expectWithMessage(() => {
        expect(tokenResponse).toBeInstanceOf(GenerateDisposableToken.Success);
      }, `Expected SUCCESS but received ${tokenResponse.toString()}`);

      const token = (tokenResponse as GenerateDisposableToken.Success)
        .authToken;
      const cacheClient = cacheClientFactory(token);

      // 1. Sets should work in both caches but only for the specified keys and prefixes
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'cow', 'meow');
      expectWithMessage(() => {
        expect(setResp1).toBeInstanceOf(CacheSet.Success);
      }, `Expected SUCCESS but received ${setResp1.toString()}`);

      const setResp2 = await cacheClient.set(FGA_CACHE_1, 'pet-fish', 'woof');
      expectWithMessage(() => {
        expect(setResp2).toBeInstanceOf(CacheSet.Success);
      }, `Expected SUCCESS but received ${setResp2.toString()}`);

      const setResp3 = await cacheClient.set(FGA_CACHE_2, 'cow', 'meow');
      expectWithMessage(() => {
        expect(setResp3).toBeInstanceOf(CacheSet.Success);
      }, `Expected SUCCESS but received ${setResp3.toString()}`);

      const setResp4 = await cacheClient.set(FGA_CACHE_2, 'pet-bird', 'woof');
      expectWithMessage(() => {
        expect(setResp4).toBeInstanceOf(CacheSet.Success);
      }, `Expected SUCCESS but received ${setResp4.toString()}`);

      // 2. Gets to a specific key should work for both caches, and not for any other key
      const getKey1 = await cacheClient.get(FGA_CACHE_1, 'cow');
      expectWithMessage(() => {
        expect(getKey1).toBeHit('meow');
      }, `Expected HIT but received ${getKey1.toString()}`);

      const getKey2 = await cacheClient.get(FGA_CACHE_2, 'pet-fish');
      expectWithMessage(() => {
        expect(getKey2).toBeHit('blub');
      }, `Expected HIT but received ${getKey2.toString()}`);

      const getKey3 = await cacheClient.get(FGA_CACHE_1, FGA_CACHE_1_KEY);
      expectWithMessage(() => {
        expect(getKey3).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey3.toString()}`);

      const getKey4 = await cacheClient.get(FGA_CACHE_2, FGA_CACHE_2_KEY);
      expectWithMessage(() => {
        expect(getKey4).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey4.toString()}`);

      const getKey5 = await cacheClient.get(FGA_CACHE_1, 'does-not-exist');
      expectWithMessage(() => {
        expect(getKey5).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey5.toString()}`);

      const getKey6 = await cacheClient.get(FGA_CACHE_2, 'does-not-exist');
      expectWithMessage(() => {
        expect(getKey6).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey6.toString()}`);
    });

    it('can read and write specific keys and key-prefixes from cache FGA_CACHE_1', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expectWithMessage(() => {
        expect(superUserTokenResponse).toBeInstanceOf(GenerateApiKey.Success);
      }, `Expected SUCCESS but received ${superUserTokenResponse.toString()}`);

      const authClient = authTokenAuthClientFactory(
        (superUserTokenResponse as GenerateApiKey.Success).apiKey
      );

      const tokenResponse = await authClient.generateDisposableToken(
        {
          permissions: [
            {role: CacheRole.ReadWrite, cache: FGA_CACHE_1, item: {key: 'cow'}},
            {
              role: CacheRole.ReadWrite,
              cache: FGA_CACHE_1,
              item: {keyPrefix: 'pet'},
            },
          ],
        },
        ExpiresIn.seconds(60)
      );
      expectWithMessage(() => {
        expect(tokenResponse).toBeInstanceOf(GenerateDisposableToken.Success);
      }, `Expected SUCCESS but received ${tokenResponse.toString()}`);

      const token = (tokenResponse as GenerateDisposableToken.Success)
        .authToken;
      const cacheClient = cacheClientFactory(token);

      // 1. Sets should work in only FGA_CACHE_1 but only for the specified keys and prefixes
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'cow', 'meow');
      expectWithMessage(() => {
        expect(setResp1).toBeInstanceOf(CacheSet.Success);
      }, `Expected SUCCESS but received ${setResp1.toString()}`);

      const setResp2 = await cacheClient.set(FGA_CACHE_1, 'pet-fish', 'woof');
      expectWithMessage(() => {
        expect(setResp2).toBeInstanceOf(CacheSet.Success);
      }, `Expected SUCCESS but received ${setResp2.toString()}`);

      const setResp3 = await cacheClient.set(
        FGA_CACHE_1,
        FGA_CACHE_1_KEY,
        'meow'
      );
      expectWithMessage(() => {
        expect(setResp3).toBePermissionDeniedForCacheSet();
      }, `Expected ERROR but received ${setResp3.toString()}`);

      const setResp4 = await cacheClient.set(FGA_CACHE_2, 'cow', 'meow');
      expectWithMessage(() => {
        expect(setResp4).toBePermissionDeniedForCacheSet();
      }, `Expected ERROR but received ${setResp4.toString()}`);

      const setResp5 = await cacheClient.set(FGA_CACHE_2, 'pet-bird', 'woof');
      expectWithMessage(() => {
        expect(setResp5).toBePermissionDeniedForCacheSet();
      }, `Expected ERROR but received ${setResp5.toString()}`);

      // 2. Gets to a specific key should work for only FGA_CACHE_1, and not for any other key or cache
      const getKey1 = await cacheClient.get(FGA_CACHE_1, 'cow');
      expectWithMessage(() => {
        expect(getKey1).toBeHit('meow');
      }, `Expected HIT but received ${getKey1.toString()}`);

      const getKey2 = await cacheClient.get(FGA_CACHE_2, 'pet-fish');
      expectWithMessage(() => {
        expect(getKey2).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey2.toString()}`);

      const getKey3 = await cacheClient.get(FGA_CACHE_1, FGA_CACHE_1_KEY);
      expectWithMessage(() => {
        expect(getKey3).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey3.toString()}`);

      const getKey4 = await cacheClient.get(FGA_CACHE_2, FGA_CACHE_2_KEY);
      expectWithMessage(() => {
        expect(getKey4).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey4.toString()}`);

      const getKey5 = await cacheClient.get(FGA_CACHE_1, 'does-not-exist');
      expectWithMessage(() => {
        expect(getKey5).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey5.toString()}`);

      const getKey6 = await cacheClient.get(FGA_CACHE_2, 'does-not-exist');
      expectWithMessage(() => {
        expect(getKey6).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey6.toString()}`);
    });

    it('can use disposable tokens to read and write to caches and topics like usual', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expectWithMessage(() => {
        expect(superUserTokenResponse).toBeInstanceOf(GenerateApiKey.Success);
      }, `Expected SUCCESS but received ${superUserTokenResponse.toString()}`);

      const authClient = authTokenAuthClientFactory(
        (superUserTokenResponse as GenerateAuthToken.Success).apiKey
      );

      const tokenResponse = await authClient.generateDisposableToken(
        {
          permissions: [
            {role: CacheRole.ReadWrite, cache: FGA_CACHE_1},
            {
              role: TopicRole.PublishSubscribe,
              cache: FGA_CACHE_2,
              topic: AllTopics,
            },
          ],
        },
        ExpiresIn.seconds(60)
      );
      expectWithMessage(() => {
        expect(tokenResponse).toBeInstanceOf(GenerateDisposableToken.Success);
      }, `Expected SUCCESS but received ${tokenResponse.toString()}`);

      const token = (tokenResponse as GenerateDisposableToken.Success)
        .authToken;
      const cacheClient = cacheClientFactory(token);
      const topicClient = topicClientFactory(token);

      // can get and set items in FGA_CACHE_1 but not FGA_CACHE_2
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'cow', 'meow');
      expectWithMessage(() => {
        expect(setResp1).toBeInstanceOf(CacheSet.Success);
      }, `Expected SUCCESS but received ${setResp1.toString()}`);

      const getKey1 = await cacheClient.get(FGA_CACHE_1, 'cow');
      expectWithMessage(() => {
        expect(getKey1).toBeHit('meow');
      }, `Expected HIT but received ${getKey1.toString()}`);

      const setResp2 = await cacheClient.set(
        FGA_CACHE_2,
        FGA_CACHE_2_KEY,
        'woof'
      );
      expectWithMessage(() => {
        expect(setResp2).toBePermissionDeniedForCacheSet();
      }, `Expected ERROR but received ${setResp2.toString()}`);

      const getKey2 = await cacheClient.get(FGA_CACHE_2, FGA_CACHE_2_KEY);
      expectWithMessage(() => {
        expect(getKey2).toBePermissionDeniedForCacheGet();
      }, `Expected ERROR but received ${getKey2.toString()}`);

      const topicName = testTopicName();

      // can publish and subscribe topics in FGA_CACHE_2 but not FGA_CACHE_1
      const subResp1 = await topicClient.subscribe(
        FGA_CACHE_2,
        topicName,
        trivialHandlers
      );
      expectWithMessage(() => {
        expect(subResp1).toBeInstanceOf(TopicSubscribe.Subscription);
      }, `Expected SUBSCRIPTION but received ${subResp1.toString()}`);

      const pubResp1 = await topicClient.publish(
        FGA_CACHE_2,
        topicName,
        'humans landed on Mars!'
      );
      expectWithMessage(() => {
        expect(pubResp1).toBeInstanceOf(TopicPublish.Success);
      }, `Expected SUCCESS but received ${pubResp1.toString()}`);

      const subResp2 = await topicClient.subscribe(
        FGA_CACHE_1,
        topicName,
        trivialHandlers
      );
      expectWithMessage(() => {
        expect(subResp2).toBePermissionDeniedForTopicSubscribe();
      }, `Expected ERROR but received ${subResp2.toString()}`);

      const pubResp = await topicClient.publish(
        FGA_CACHE_1,
        topicName,
        'humans landed on Pluto!'
      );
      expectWithMessage(() => {
        expect(pubResp).toBePermissionDeniedForTopicPublish();
      }, `Expected ERROR but received ${pubResp.toString()}`);
    });

    // Note: caches may be leaked if afterAll is not run due to an interruption
    afterAll(async () => {
      const deleteCache1 = await sessionTokenCacheClient.deleteCache(
        FGA_CACHE_1
      );
      expectWithMessage(() => {
        expect(deleteCache1).toBeInstanceOf(DeleteCache.Success);
      }, `Expected SUCCESS but received ${deleteCache1.toString()}`);

      const deleteCache2 = await sessionTokenCacheClient.deleteCache(
        FGA_CACHE_2
      );
      expectWithMessage(() => {
        expect(deleteCache2).toBeInstanceOf(DeleteCache.Success);
      }, `Expected SUCCESS but received ${deleteCache2.toString()}`);
    });
  });
}

export function delay(ms: number): Promise<unknown> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
