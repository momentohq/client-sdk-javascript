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
  TokenScope,
  TokenScopes,
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
} from '@gomomento/sdk-core';
import {expectWithMessage} from './common-int-test-utils';
import {InternalSuperUserPermissions} from '@gomomento/sdk-core/dist/src/internal/utils/auth';
import {
  IAuthClient,
  ICacheClient,
  ITopicClient,
} from '@gomomento/sdk-core/dist/src/internal/clients';
import {v4} from 'uuid';
import {expect} from '@jest/globals';
import './momento-jest-matchers';

const SUPER_USER_PERMISSIONS: TokenScope = new InternalSuperUserPermissions();

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
        ExpiresIn.seconds(10)
      );
      const expiresIn = secondsSinceEpoch + 10;

      expect(expireResponse).toBeInstanceOf(GenerateApiKey.Success);

      const expireResponseSuccess = expireResponse as GenerateApiKey.Success;
      expect(expireResponseSuccess.is_success);
      expect(expireResponseSuccess.expiresAt.doesExpire());
      expect(expireResponseSuccess.expiresAt.epoch()).toBeWithin(
        expiresIn - 1,
        expiresIn + 2
      );
    });

    it('should succeed for generating an api token that never expires', async () => {
      const neverExpiresResponse = await sessionTokenAuthClient.generateApiKey(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.never()
      );
      expect(neverExpiresResponse).toBeInstanceOf(GenerateApiKey.Success);
      const neverExpireResponseSuccess =
        neverExpiresResponse as GenerateApiKey.Success;
      expect(neverExpireResponseSuccess.is_success);
      expect(neverExpireResponseSuccess.expiresAt.doesExpire()).toBeFalsy();
    });

    it('should not succeed for generating an api token that has an invalid expires', async () => {
      const invalidExpiresResponse =
        await sessionTokenAuthClient.generateApiKey(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(-100)
        );
      expect(invalidExpiresResponse).toBeInstanceOf(GenerateApiKey.Error);
      expect(
        (invalidExpiresResponse as GenerateApiKey.Error).errorCode()
      ).toEqual(MomentoErrorCode.INVALID_ARGUMENT_ERROR);
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
      await delay(delaySecondsBeforeRefresh * 1_000);

      const refreshResponse = await authTokenAuthClient.refreshApiKey(
        generateSuccessRst.refreshToken
      );
      expectWithMessage(() => {
        expect(refreshResponse).toBeInstanceOf(RefreshApiKey.Success);
      }, `Unexpected response: ${refreshResponse.toString()}`);
      const refreshSuccessRst = refreshResponse as RefreshApiKey.Success;

      expect(refreshSuccessRst.is_success);

      const expiresAtDelta =
        refreshSuccessRst.expiresAt.epoch() -
        generateSuccessRst.expiresAt.epoch();

      expect(expiresAtDelta).toBeGreaterThanOrEqual(delaySecondsBeforeRefresh);
      expect(expiresAtDelta).toBeLessThanOrEqual(delaySecondsBeforeRefresh + 1);
    });

    it("should not succeed for refreshing an api token that's expired", async () => {
      const generateResponse = await sessionTokenAuthClient.generateApiKey(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.seconds(1)
      );
      const generateSuccessRst = generateResponse as GenerateApiKey.Success;

      // Wait 1sec for the token to expire
      await delay(1000);

      const authTokenAuthClient = authTokenAuthClientFactory(
        generateSuccessRst.apiKey
      );

      const refreshResponse = await authTokenAuthClient.refreshApiKey(
        generateSuccessRst.refreshToken
      );
      expect(refreshResponse).toBeInstanceOf(RefreshApiKey.Error);
      expect((refreshResponse as RefreshApiKey.Error).errorCode()).toEqual(
        MomentoErrorCode.AUTHENTICATION_ERROR
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
      expect(expiresAtDelta).toBeLessThanOrEqual(delaySecondsBeforeRefresh + 1);
    });
  });

  describe('generating superuser and AllDataReadWrite tokens', () => {
    it("expired token can't create cache", async () => {
      const generateResponse = await sessionTokenAuthClient.generateApiKey(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.seconds(1)
      );
      const generateSuccessRst = generateResponse as GenerateApiKey.Success;

      // Wait 1sec for the token to expire
      await delay(1000);

      const cacheClient = cacheClientFactory(generateSuccessRst.apiKey);

      const createCacheRst = await cacheClient.createCache(
        'cache-should-fail-to-create'
      );

      expect(createCacheRst).toBeInstanceOf(CreateCache.Error);
      const createCacheErrorRst = createCacheRst as CreateCache.Error;
      expect(createCacheErrorRst.errorCode()).toEqual(
        MomentoErrorCode.AUTHENTICATION_ERROR
      );
    });

    it('should support generating a superuser token when authenticated via a session token', async () => {
      const generateResponse = await sessionTokenAuthClient.generateApiKey(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.seconds(1)
      );
      expect(generateResponse).toBeInstanceOf(GenerateApiKey.Success);
    });

    it('should support generating an AllDataReadWrite token when authenticated via a session token', async () => {
      const generateResponse = await sessionTokenAuthClient.generateApiKey(
        AllDataReadWrite,
        ExpiresIn.seconds(1)
      );
      expect(generateResponse).toBeInstanceOf(GenerateApiKey.Success);
    });

    it('should not support generating a superuser token when authenticated via a v1 superuser token', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expect(superUserTokenResponse).toBeInstanceOf(GenerateApiKey.Success);

      const authClient = authTokenAuthClientFactory(
        (superUserTokenResponse as GenerateApiKey.Success).apiKey
      );

      const generateResponse = await authClient.generateApiKey(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.seconds(1)
      );
      expect(generateResponse).toBeInstanceOf(GenerateApiKey.Error);
      const error = generateResponse as GenerateApiKey.Error;
      expect(error.errorCode()).toEqual(MomentoErrorCode.PERMISSION_ERROR);
      expect(error.message()).toContain('Insufficient permissions');
    });

    it('should support generating an AllDataReadWrite token when authenticated via a v1 superuser token', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expect(superUserTokenResponse).toBeInstanceOf(GenerateApiKey.Success);

      const authClient = authTokenAuthClientFactory(
        (superUserTokenResponse as GenerateApiKey.Success).apiKey
      );

      const generateResponse = await authClient.generateApiKey(
        AllDataReadWrite,
        ExpiresIn.seconds(1)
      );
      expect(generateResponse).toBeInstanceOf(GenerateApiKey.Success);
    });

    it('should not support generating a superuser token when authenticated via a v1 AllDataReadWrite token', async () => {
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
        SUPER_USER_PERMISSIONS,
        ExpiresIn.seconds(1)
      );
      expect(generateResponse).toBeInstanceOf(GenerateApiKey.Error);
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
      expect(generateResponse).toBeInstanceOf(GenerateApiKey.Error);
    });

    it('should not support generating a superuser token when authenticated via a legacy token', async () => {
      const generateResponse = await legacyTokenAuthClient.generateApiKey(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.seconds(1)
      );
      expect(generateResponse).toBeInstanceOf(GenerateApiKey.Error);
    });

    it('should not support generating an AllDataReadWrite token when authenticated via a legacy token', async () => {
      const generateResponse = await legacyTokenAuthClient.generateApiKey(
        AllDataReadWrite,
        ExpiresIn.seconds(1)
      );
      expect(generateResponse).toBeInstanceOf(GenerateApiKey.Error);
    });
  });

  describe('AllDataReadWrite token scope', () => {
    let allDataReadWriteClient: ICacheClient;

    beforeAll(async () => {
      const generateResponse = await sessionTokenAuthClient.generateApiKey(
        AllDataReadWrite,
        ExpiresIn.seconds(60)
      );
      expect(generateResponse).toBeInstanceOf(GenerateApiKey.Success);
      const allDataReadWriteToken = (generateResponse as GenerateApiKey.Success)
        .apiKey;
      allDataReadWriteClient = cacheClientFactory(allDataReadWriteToken);
    });
    it('cannot create a cache', async () => {
      const createCacheResponse = await allDataReadWriteClient.createCache(
        'FOOFOOFOO'
      );
      expect(createCacheResponse).toBeInstanceOf(CreateCache.Error);
      const createCacheError = createCacheResponse as CreateCache.Error;
      expect(createCacheError.errorCode()).toEqual(
        MomentoErrorCode.PERMISSION_ERROR
      );
      expect(createCacheError.message()).toContain('Insufficient permissions');
    });
    it('cannot delete a cache', async () => {
      const deleteCacheResponse = await allDataReadWriteClient.deleteCache(
        cacheName
      );
      expect(deleteCacheResponse).toBeInstanceOf(DeleteCache.Error);
      const deleteCacheError = deleteCacheResponse as DeleteCache.Error;
      expect(deleteCacheError.errorCode()).toEqual(
        MomentoErrorCode.PERMISSION_ERROR
      );
      expect(deleteCacheError.message()).toContain('Insufficient permissions');
    });

    it('can set values in an existing cache', async () => {
      const setResponse = await allDataReadWriteClient.set(
        cacheName,
        'foo',
        'FOO'
      );
      console.log('setResponse', setResponse);
      expect(setResponse).toBeInstanceOf(CacheSet.Success);
    });
    it('can get values from an existing cache', async () => {
      const getResponse = await allDataReadWriteClient.get(
        cacheName,
        'habanero'
      );
      console.log('getResponse', getResponse);
      expect(getResponse).toBeInstanceOf(CacheGet.Miss);
    });
  });

  describe('Fine grained authorization scenarios', () => {
    const FGA_CACHE_1 = 'fga-' + v4();
    const FGA_CACHE_2 = 'fga-' + v4();
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

    // Setup 2 caches
    beforeAll(async () => {
      expect(
        await sessionTokenCacheClient.createCache(FGA_CACHE_1)
      ).toBeInstanceOf(CreateCache.Success);
      expect(
        await sessionTokenCacheClient.createCache(FGA_CACHE_2)
      ).toBeInstanceOf(CreateCache.Success);
      expect(
        await sessionTokenCacheClient.set(FGA_CACHE_1, 'foo', 'FOO', {ttl: 600})
      ).toBeInstanceOf(CacheSet.Success);
      expect(
        await sessionTokenCacheClient.set(FGA_CACHE_2, 'bar', 'BAR', {ttl: 600})
      ).toBeInstanceOf(CacheSet.Success);
      // Set up additional keys for testing key-level FGAC
      expect(
        await sessionTokenCacheClient.set(FGA_CACHE_1, 'pet-cat', 'meow', {
          ttl: 600,
        })
      ).toBeInstanceOf(CacheSet.Success);
      expect(
        await sessionTokenCacheClient.set(FGA_CACHE_1, 'pet-dog', 'woof', {
          ttl: 600,
        })
      ).toBeInstanceOf(CacheSet.Success);
      expect(
        await sessionTokenCacheClient.set(FGA_CACHE_1, 'cow', 'moo', {ttl: 600})
      ).toBeInstanceOf(CacheSet.Success);
      expect(
        await sessionTokenCacheClient.set(FGA_CACHE_2, 'pet-bird', 'tweet', {
          ttl: 600,
        })
      ).toBeInstanceOf(CacheSet.Success);
      expect(
        await sessionTokenCacheClient.set(FGA_CACHE_2, 'pet-fish', 'blub', {
          ttl: 600,
        })
      ).toBeInstanceOf(CacheSet.Success);
      expect(
        await sessionTokenCacheClient.set(FGA_CACHE_2, 'cow', 'moo', {ttl: 600})
      ).toBeInstanceOf(CacheSet.Success);
    });

    it('cannot create token with empty permission list', async () => {
      const tokenResponse = await sessionTokenAuthClient.generateApiKey(
        {permissions: []},
        ExpiresIn.seconds(60)
      );
      expect(tokenResponse).toBeInstanceOf(GenerateApiKey.Error);
      const tokenError = tokenResponse as GenerateApiKey.Error;
      expect(tokenError.errorCode()).toEqual(
        MomentoErrorCode.INVALID_ARGUMENT_ERROR
      );
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
      expect(tokenResponse).toBeInstanceOf(GenerateApiKey.Error);
      const tokenError = tokenResponse as GenerateApiKey.Error;
      expect(tokenError.errorCode()).toEqual(
        MomentoErrorCode.INVALID_ARGUMENT_ERROR
      );
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
      expect(tokenResponse).toBeInstanceOf(GenerateApiKey.Error);
      const tokenError = tokenResponse as GenerateApiKey.Error;
      expect(tokenError.errorCode()).toEqual(
        MomentoErrorCode.INVALID_ARGUMENT_ERROR
      );
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
      expect(tokenResponse).toBeInstanceOf(GenerateApiKey.Error);
      const tokenError = tokenResponse as GenerateApiKey.Error;
      expect(tokenError.errorCode()).toEqual(
        MomentoErrorCode.INVALID_ARGUMENT_ERROR
      );
    });

    it('can only read all caches', async () => {
      const readAllCachesTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          TokenScopes.cacheReadOnly(AllCaches),
          ExpiresIn.seconds(60)
        );
      expect(readAllCachesTokenResponse).toBeInstanceOf(GenerateApiKey.Success);
      const readAllCachesToken = (
        readAllCachesTokenResponse as GenerateApiKey.Success
      ).apiKey;
      const cacheClient = cacheClientFactory(readAllCachesToken);

      // 1. Sets should fail
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'homer', 'simpson');
      expect(setResp1).toBePermissionDeniedForCacheSet();

      const setResp2 = await cacheClient.set(FGA_CACHE_2, 'oye', 'caramba');
      expect(setResp2).toBePermissionDeniedForCacheSet();

      // 2. Gets for existing keys should succeed with hits
      const getResp1 = await cacheClient.get(FGA_CACHE_1, FGA_CACHE_1_KEY);
      expect(getResp1).toBeHit(FGA_CACHE_1_VALUE);

      const getResp2 = await cacheClient.get(FGA_CACHE_2, FGA_CACHE_2_KEY);
      expect(getResp2).toBeHit(FGA_CACHE_2_VALUE);

      // 3. Gets for non-existing keys return misses
      const missResp1 = await cacheClient.get(FGA_CACHE_1, 'i-exist-not');
      expect(missResp1).toBeInstanceOf(CacheGet.Miss);
      const missResp2 = await cacheClient.get(FGA_CACHE_2, 'i-exist-not');
      expect(missResp2).toBeInstanceOf(CacheGet.Miss);

      const topicClient = topicClientFactory(readAllCachesToken);
      const pubResp = await topicClient.publish(
        FGA_CACHE_1,
        'Ankh-Morpork Inquirer',
        'There is a werewolf in the City Watch!!!!!'
      );
      expect(pubResp).toBePermissionDeniedForTopicPublish();

      const subResp = await topicClient.subscribe(
        FGA_CACHE_1,
        'Ankh-Morpork Inquirer',
        trivialHandlers
      );
      expect(subResp).toBePermissionDeniedForTopicSubscribe();
    });

    it('can only read all topics', async () => {
      const readAllTopicsTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          TokenScopes.topicSubscribeOnly(AllCaches, AllTopics),
          ExpiresIn.seconds(60)
        );
      expect(readAllTopicsTokenResponse).toBeInstanceOf(GenerateApiKey.Success);
      const readAllTopicsToken = (
        readAllTopicsTokenResponse as GenerateApiKey.Success
      ).apiKey;
      const cacheClient = cacheClientFactory(readAllTopicsToken);

      // Sets should fail
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'homer', 'simpson');
      expect(setResp1).toBePermissionDeniedForCacheSet();

      const setResp2 = await cacheClient.set(FGA_CACHE_2, 'oye', 'caramba');
      expect(setResp2).toBePermissionDeniedForCacheSet();

      // Gets should fail
      const getKey1 = await cacheClient.get(FGA_CACHE_1, FGA_CACHE_1_KEY);
      expect(getKey1).toBePermissionDeniedForCacheGet();

      const getKey2 = await cacheClient.get(FGA_CACHE_2, FGA_CACHE_2_KEY);
      expect(getKey2).toBePermissionDeniedForCacheGet();

      const topicClient = topicClientFactory(readAllTopicsToken);
      // Publish should fail
      const pubResp = await topicClient.publish(
        FGA_CACHE_1,
        'The Ankh-Morpork Times',
        'The Truth Shall Make Ye Fret'
      );
      expect(pubResp).toBePermissionDeniedForTopicPublish();

      // Subscribe should succeed
      const subResp = await topicClient.subscribe(
        FGA_CACHE_1,
        'The Ankh-Morpork Times',
        trivialHandlers
      );
      expect(subResp).toBeInstanceOf(TopicSubscribe.Subscription);
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
      expect(tokenResponse).toBeInstanceOf(GenerateApiKey.Success);
      const token = (tokenResponse as GenerateApiKey.Success).apiKey;
      const cacheClient = cacheClientFactory(token);

      // Read/Write on cache FGA_CACHE_1 is allowed
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'ned', 'flanders');
      expect(setResp1).toBeInstanceOf(CacheSet.Success);

      const getResp1 = await cacheClient.get(FGA_CACHE_1, 'ned');
      expect(getResp1).toBeHit('flanders');

      // Read/Write on cache FGA_CACHE_2 is not allowed
      const setResp2 = await cacheClient.set(FGA_CACHE_2, 'flaming', 'mo');
      expect(setResp2).toBePermissionDeniedForCacheSet();

      const getResp2 = await cacheClient.get(FGA_CACHE_2, 'flaming');
      expect(getResp2).toBePermissionDeniedForCacheGet();

      const topicClient = topicClientFactory(token);
      // Read/Write on topics in cache FGA_CACHE_1 is not allowed
      const pubResp = await topicClient.publish(
        FGA_CACHE_1,
        'breaking news!',
        'Flying lizard seen over Manhattan!'
      );
      expect(pubResp).toBePermissionDeniedForTopicPublish();

      const subResp = await topicClient.subscribe(
        FGA_CACHE_1,
        'breaking news!',
        trivialHandlers
      );
      expect(subResp).toBePermissionDeniedForTopicSubscribe();

      // Read/Write on topics in cache FGA_CACHE_2 is allowed
      const pubResp1 = await topicClient.publish(
        FGA_CACHE_2,
        'breaking news!',
        'UFOs spotted'
      );
      expect(pubResp1).toBeInstanceOf(TopicPublish.Success);
      const subResp1 = await topicClient.subscribe(
        FGA_CACHE_2,
        'breaking news!',
        trivialHandlers
      );
      expectWithMessage(() => {
        expect(subResp1).toBeInstanceOf(TopicSubscribe.Subscription);
      }, `expected SUBSCRIPTION but got ${subResp1.toString()}`);
    });

    it('can only write cache FGA_CACHE_1 and write all topics in cache FGA_CACHE_2', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expect(superUserTokenResponse).toBeInstanceOf(GenerateApiKey.Success);

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
      expect(tokenResponse).toBeInstanceOf(GenerateDisposableToken.Success);

      const token = (tokenResponse as GenerateDisposableToken.Success)
        .authToken;
      const cacheClient = cacheClientFactory(token);

      // Only Write on cache FGA_CACHE_1 is allowed
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'ned', 'flanders');
      expect(setResp1).toBeInstanceOf(CacheSet.Success);

      const getResp1 = await cacheClient.get(FGA_CACHE_1, 'ned');
      expect(getResp1).toBePermissionDeniedForCacheGet();

      // Read/Write on cache FGA_CACHE_2 is not allowed
      const setResp2 = await cacheClient.set(FGA_CACHE_2, 'flaming', 'mo');
      expect(setResp2).toBePermissionDeniedForCacheSet();

      const getResp2 = await cacheClient.get(FGA_CACHE_2, 'flaming');
      expect(getResp2).toBePermissionDeniedForCacheGet();

      const topicClient = topicClientFactory(token);
      // Read/Write on topics in cache FGA_CACHE_1 is not allowed
      const pubResp = await topicClient.publish(
        FGA_CACHE_1,
        'breaking news!',
        'Flying lizard seen over Manhattan!'
      );
      expect(pubResp).toBePermissionDeniedForTopicPublish();

      const subResp = await topicClient.subscribe(
        FGA_CACHE_1,
        'breaking news!',
        trivialHandlers
      );
      expect(subResp).toBePermissionDeniedForTopicSubscribe();

      // Only Write on topics in cache FGA_CACHE_2 is allowed
      const pubResp1 = await topicClient.publish(
        FGA_CACHE_2,
        'breaking news!',
        'UFOs spotted'
      );
      expect(pubResp1).toBeInstanceOf(TopicPublish.Success);

      const subResp1 = await topicClient.subscribe(
        FGA_CACHE_2,
        'breaking news!',
        trivialHandlers
      );
      expect(subResp1).toBePermissionDeniedForTopicSubscribe();
    });

    it('can only read specific keys and key-prefixes from all caches', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expect(superUserTokenResponse).toBeInstanceOf(GenerateApiKey.Success);

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
      expect(tokenResponse).toBeInstanceOf(GenerateDisposableToken.Success);

      const token = (tokenResponse as GenerateDisposableToken.Success)
        .authToken;
      const cacheClient = cacheClientFactory(token);

      // 1. Sets should fail
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'cow', 'meow');
      expect(setResp1).toBePermissionDeniedForCacheSet();

      const setResp2 = await cacheClient.set(FGA_CACHE_2, 'pet-fish', 'woof');
      expect(setResp2).toBePermissionDeniedForCacheSet();

      // 2. Gets to a specific key should work for both caches, and not for any other key
      const getKey1 = await cacheClient.get(FGA_CACHE_1, 'cow');
      expect(getKey1).toBeHit('moo');

      const getKey2 = await cacheClient.get(FGA_CACHE_2, 'cow');
      expect(getKey2).toBeHit('moo');

      const getKey3 = await cacheClient.get(FGA_CACHE_1, FGA_CACHE_1_KEY);
      expect(getKey3).toBePermissionDeniedForCacheGet();

      const getKey4 = await cacheClient.get(FGA_CACHE_2, FGA_CACHE_2_KEY);
      expect(getKey4).toBePermissionDeniedForCacheGet();

      const getKey5 = await cacheClient.get(FGA_CACHE_1, 'does-not-exist');
      expect(getKey5).toBePermissionDeniedForCacheGet();

      const getKey6 = await cacheClient.get(FGA_CACHE_2, 'does-not-exist');
      expect(getKey6).toBePermissionDeniedForCacheGet();
    });

    it('can only read specific keys and key-prefixes from cache FGA_CACHE_1', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expect(superUserTokenResponse).toBeInstanceOf(GenerateApiKey.Success);

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
      expect(tokenResponse).toBeInstanceOf(GenerateDisposableToken.Success);

      const token = (tokenResponse as GenerateDisposableToken.Success)
        .authToken;
      const cacheClient = cacheClientFactory(token);

      // 1. Sets should fail
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'cow', 'meow');
      expect(setResp1).toBePermissionDeniedForCacheSet();

      const setResp2 = await cacheClient.set(FGA_CACHE_1, 'pet-fish', 'woof');
      expect(setResp2).toBePermissionDeniedForCacheSet();

      const setResp3 = await cacheClient.set(FGA_CACHE_2, 'pet', 'moo');
      expect(setResp3).toBePermissionDeniedForCacheSet();

      // 2. Gets to a specific key should work for only FGA_CACHE_1, and not for any other key or cache
      const getKey1 = await cacheClient.get(FGA_CACHE_1, 'cow');
      expect(getKey1).toBeHit('moo');

      const getKey2 = await cacheClient.get(FGA_CACHE_1, FGA_CACHE_1_KEY);
      expect(getKey2).toBePermissionDeniedForCacheGet();

      const getKey3 = await cacheClient.get(FGA_CACHE_2, FGA_CACHE_2_KEY);
      expect(getKey3).toBePermissionDeniedForCacheGet();

      const getKey4 = await cacheClient.get(FGA_CACHE_1, 'does-not-exist');
      expect(getKey4).toBePermissionDeniedForCacheGet();

      const getKey5 = await cacheClient.get(FGA_CACHE_2, 'does-not-exist');
      expect(getKey5).toBePermissionDeniedForCacheGet();
    });

    it('can only write specific keys and key-prefixes from all caches', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expect(superUserTokenResponse).toBeInstanceOf(GenerateApiKey.Success);

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
      expect(tokenResponse).toBeInstanceOf(GenerateDisposableToken.Success);

      const token = (tokenResponse as GenerateDisposableToken.Success)
        .authToken;
      const cacheClient = cacheClientFactory(token);

      // 1. Sets should pass in both caches
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'cow', 'meow');
      expect(setResp1).toBeInstanceOf(CacheSet.Success);

      const setResp2 = await cacheClient.set(FGA_CACHE_1, 'pet-fish', 'woof');
      expect(setResp2).toBeInstanceOf(CacheSet.Success);

      const setResp3 = await cacheClient.set(FGA_CACHE_2, 'cow', 'meow');
      expect(setResp3).toBeInstanceOf(CacheSet.Success);

      const setResp4 = await cacheClient.set(FGA_CACHE_2, 'pet-bird', 'woof');
      expect(setResp4).toBeInstanceOf(CacheSet.Success);

      // 2. Gets should fail
      const getKey1 = await cacheClient.get(FGA_CACHE_1, 'cow');
      expect(getKey1).toBePermissionDeniedForCacheGet();

      const getKey2 = await cacheClient.get(FGA_CACHE_2, 'pet-fish');
      expect(getKey2).toBePermissionDeniedForCacheGet();

      const getKey3 = await cacheClient.get(FGA_CACHE_1, FGA_CACHE_1_KEY);
      expect(getKey3).toBePermissionDeniedForCacheGet();

      const getKey4 = await cacheClient.get(FGA_CACHE_2, FGA_CACHE_2_KEY);
      expect(getKey4).toBePermissionDeniedForCacheGet();

      const getKey5 = await cacheClient.get(FGA_CACHE_1, 'does-not-exist');
      expect(getKey5).toBePermissionDeniedForCacheGet();

      const getKey6 = await cacheClient.get(FGA_CACHE_2, 'does-not-exist');
      expect(getKey6).toBePermissionDeniedForCacheGet();
    });

    it('can only write specific keys and key-prefixes from cache FGA_CACHE_1', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expect(superUserTokenResponse).toBeInstanceOf(GenerateApiKey.Success);

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
      expect(tokenResponse).toBeInstanceOf(GenerateDisposableToken.Success);

      const token = (tokenResponse as GenerateDisposableToken.Success)
        .authToken;
      const cacheClient = cacheClientFactory(token);

      // 1. Sets should pass in only FGA_CACHE_1 and only to the specified keys and key prefixes
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'cow', 'meow');
      expect(setResp1).toBeInstanceOf(CacheSet.Success);

      const setResp2 = await cacheClient.set(FGA_CACHE_1, 'pet-fish', 'woof');
      expect(setResp2).toBeInstanceOf(CacheSet.Success);

      const setResp3 = await cacheClient.set(
        FGA_CACHE_1,
        FGA_CACHE_1_KEY,
        'moo'
      );
      expect(setResp3).toBePermissionDeniedForCacheSet();

      const setResp4 = await cacheClient.set(FGA_CACHE_2, 'cow', 'meow');
      expect(setResp4).toBePermissionDeniedForCacheSet();

      const setResp5 = await cacheClient.set(FGA_CACHE_2, 'pet-bird', 'woof');
      expect(setResp5).toBePermissionDeniedForCacheSet();

      // 2. Gets should fail
      const getKey1 = await cacheClient.get(FGA_CACHE_1, 'cow');
      expect(getKey1).toBePermissionDeniedForCacheGet();

      const getKey2 = await cacheClient.get(FGA_CACHE_2, 'pet-fish');
      expect(getKey2).toBePermissionDeniedForCacheGet();

      const getKey3 = await cacheClient.get(FGA_CACHE_1, FGA_CACHE_1_KEY);
      expect(getKey3).toBePermissionDeniedForCacheGet();

      const getKey4 = await cacheClient.get(FGA_CACHE_2, FGA_CACHE_2_KEY);
      expect(getKey4).toBePermissionDeniedForCacheGet();

      const getKey5 = await cacheClient.get(FGA_CACHE_1, 'does-not-exist');
      expect(getKey5).toBePermissionDeniedForCacheGet();

      const getKey6 = await cacheClient.get(FGA_CACHE_2, 'does-not-exist');
      expect(getKey6).toBePermissionDeniedForCacheGet();
    });

    it('can read and write specific keys and key-prefixes from all caches', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expect(superUserTokenResponse).toBeInstanceOf(GenerateApiKey.Success);

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
      expect(tokenResponse).toBeInstanceOf(GenerateDisposableToken.Success);

      const token = (tokenResponse as GenerateDisposableToken.Success)
        .authToken;
      const cacheClient = cacheClientFactory(token);

      // 1. Sets should work in both caches but only for the specified keys and prefixes
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'cow', 'meow');
      expect(setResp1).toBeInstanceOf(CacheSet.Success);

      const setResp2 = await cacheClient.set(FGA_CACHE_1, 'pet-fish', 'woof');
      expect(setResp2).toBeInstanceOf(CacheSet.Success);

      const setResp3 = await cacheClient.set(FGA_CACHE_2, 'cow', 'meow');
      expect(setResp3).toBeInstanceOf(CacheSet.Success);

      const setResp4 = await cacheClient.set(FGA_CACHE_2, 'pet-bird', 'woof');
      expect(setResp4).toBeInstanceOf(CacheSet.Success);

      // 2. Gets to a specific key should work for both caches, and not for any other key
      const getKey1 = await cacheClient.get(FGA_CACHE_1, 'cow');
      expect(getKey1).toBeHit('meow');

      const getKey2 = await cacheClient.get(FGA_CACHE_2, 'pet-fish');
      expect(getKey2).toBeHit('blub');

      const getKey3 = await cacheClient.get(FGA_CACHE_1, FGA_CACHE_1_KEY);
      expect(getKey3).toBePermissionDeniedForCacheGet();

      const getKey4 = await cacheClient.get(FGA_CACHE_2, FGA_CACHE_2_KEY);
      expect(getKey4).toBePermissionDeniedForCacheGet();

      const getKey5 = await cacheClient.get(FGA_CACHE_1, 'does-not-exist');
      expect(getKey5).toBePermissionDeniedForCacheGet();

      const getKey6 = await cacheClient.get(FGA_CACHE_2, 'does-not-exist');
      expect(getKey6).toBePermissionDeniedForCacheGet();
    });

    it('can read and write specific keys and key-prefixes from cache FGA_CACHE_1', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateApiKey(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expect(superUserTokenResponse).toBeInstanceOf(GenerateApiKey.Success);

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
      expect(tokenResponse).toBeInstanceOf(GenerateDisposableToken.Success);

      const token = (tokenResponse as GenerateDisposableToken.Success)
        .authToken;
      const cacheClient = cacheClientFactory(token);

      // 1. Sets should work in only FGA_CACHE_1 but only for the specified keys and prefixes
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'cow', 'meow');
      expect(setResp1).toBeInstanceOf(CacheSet.Success);

      const setResp2 = await cacheClient.set(FGA_CACHE_1, 'pet-fish', 'woof');
      expect(setResp2).toBeInstanceOf(CacheSet.Success);

      const setResp3 = await cacheClient.set(
        FGA_CACHE_1,
        FGA_CACHE_1_KEY,
        'meow'
      );
      expect(setResp3).toBePermissionDeniedForCacheSet();

      const setResp4 = await cacheClient.set(FGA_CACHE_2, 'cow', 'meow');
      expect(setResp4).toBePermissionDeniedForCacheSet();

      const setResp5 = await cacheClient.set(FGA_CACHE_2, 'pet-bird', 'woof');
      expect(setResp5).toBePermissionDeniedForCacheSet();

      // 2. Gets to a specific key should work for only FGA_CACHE_1, and not for any other key or cache
      const getKey1 = await cacheClient.get(FGA_CACHE_1, 'cow');
      expect(getKey1).toBeHit('meow');

      const getKey2 = await cacheClient.get(FGA_CACHE_2, 'pet-fish');
      expect(getKey2).toBePermissionDeniedForCacheGet();

      const getKey3 = await cacheClient.get(FGA_CACHE_1, FGA_CACHE_1_KEY);
      expect(getKey3).toBePermissionDeniedForCacheGet();

      const getKey4 = await cacheClient.get(FGA_CACHE_2, FGA_CACHE_2_KEY);
      expect(getKey4).toBePermissionDeniedForCacheGet();

      const getKey5 = await cacheClient.get(FGA_CACHE_1, 'does-not-exist');
      expect(getKey5).toBePermissionDeniedForCacheGet();

      const getKey6 = await cacheClient.get(FGA_CACHE_2, 'does-not-exist');
      expect(getKey6).toBePermissionDeniedForCacheGet();
    });

    it('can use disposable tokens to read and write to caches and topics like usual', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateAuthToken(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expect(superUserTokenResponse).toBeInstanceOf(GenerateAuthToken.Success);

      const authClient = authTokenAuthClientFactory(
        (superUserTokenResponse as GenerateAuthToken.Success).authToken
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
      expect(tokenResponse).toBeInstanceOf(GenerateDisposableToken.Success);

      const token = (tokenResponse as GenerateDisposableToken.Success)
        .authToken;
      const cacheClient = cacheClientFactory(token);
      const topicClient = topicClientFactory(token);

      // can get and set items in FGA_CACHE_1 but not FGA_CACHE_2
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'cow', 'meow');
      expect(setResp1).toBeInstanceOf(CacheSet.Success);

      const getKey1 = await cacheClient.get(FGA_CACHE_1, 'cow');
      expect(getKey1).toBeHit('meow');

      const setResp2 = await cacheClient.set(
        FGA_CACHE_2,
        FGA_CACHE_2_KEY,
        'woof'
      );
      expect(setResp2).toBePermissionDeniedForCacheSet();

      const getKey2 = await cacheClient.get(FGA_CACHE_2, FGA_CACHE_2_KEY);
      expect(getKey2).toBePermissionDeniedForCacheGet();

      // can publish and subscribe topics in FGA_CACHE_2 but not FGA_CACHE_1
      const subResp1 = await topicClient.subscribe(
        FGA_CACHE_2,
        'breaking news!',
        trivialHandlers
      );
      expect(subResp1).toBeInstanceOf(TopicSubscribe.Subscription);

      const pubResp1 = await topicClient.publish(
        FGA_CACHE_2,
        'breaking news!',
        'humans landed on Mars!'
      );
      expect(pubResp1).toBeInstanceOf(TopicPublish.Success);

      const subResp2 = await topicClient.subscribe(
        FGA_CACHE_1,
        'breaking news!',
        trivialHandlers
      );
      expect(subResp2).toBePermissionDeniedForTopicSubscribe();

      const pubResp = await topicClient.publish(
        FGA_CACHE_1,
        'breaking news!',
        'humans landed on Pluto!'
      );
      expect(pubResp).toBePermissionDeniedForTopicPublish();
    });

    afterAll(async () => {
      expect(
        await sessionTokenCacheClient.deleteCache(FGA_CACHE_1)
      ).toBeInstanceOf(DeleteCache.Success);
      expect(
        await sessionTokenCacheClient.deleteCache(FGA_CACHE_2)
      ).toBeInstanceOf(DeleteCache.Success);
    });
  });
}

export function delay(ms: number): Promise<unknown> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
