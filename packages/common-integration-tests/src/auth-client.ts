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
  GenerateAuthToken,
  GenerateDisposableToken,
  MomentoErrorCode,
  RefreshAuthToken,
  SubscribeCallOptions,
  TokenScope,
  TokenScopes,
  TopicPublish,
  TopicRole,
  TopicSubscribe,
} from '@gomomento/sdk-core';
import {expectWithMessage} from './common-int-test-utils';
import {InternalSuperUserPermissions} from '@gomomento/sdk-core/dist/src/internal/utils/auth';
import {
  IAuthClient,
  ICacheClient,
  ITopicClient,
} from '@gomomento/sdk-core/dist/src/internal/clients';
import {v4} from 'uuid';

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
      const resp = await sessionTokenAuthClient.generateAuthToken(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.seconds(10)
      );
      expectWithMessage(
        () => expect(resp).toBeInstanceOf(GenerateAuthToken.Success),
        `Unexpected response: ${resp.toString()}`
      );
    });

    it('should succeed for generating an api token that expires', async () => {
      const secondsSinceEpoch = Math.round(Date.now() / 1000);
      const expireResponse = await sessionTokenAuthClient.generateAuthToken(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.seconds(10)
      );
      const expiresIn = secondsSinceEpoch + 10;

      expect(expireResponse).toBeInstanceOf(GenerateAuthToken.Success);

      const expireResponseSuccess = expireResponse as GenerateAuthToken.Success;
      expect(expireResponseSuccess.is_success);
      expect(expireResponseSuccess.expiresAt.doesExpire());
      expect(expireResponseSuccess.expiresAt.epoch()).toBeWithin(
        expiresIn - 1,
        expiresIn + 2
      );
    });

    it('should succeed for generating an api token that never expires', async () => {
      const neverExpiresResponse =
        await sessionTokenAuthClient.generateAuthToken(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.never()
        );
      expect(neverExpiresResponse).toBeInstanceOf(GenerateAuthToken.Success);
      const neverExpireResponseSuccess =
        neverExpiresResponse as GenerateAuthToken.Success;
      expect(neverExpireResponseSuccess.is_success);
      expect(neverExpireResponseSuccess.expiresAt.doesExpire()).toBeFalse();
    });

    it('should not succeed for generating an api token that has an invalid expires', async () => {
      const invalidExpiresResponse =
        await sessionTokenAuthClient.generateAuthToken(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(-100)
        );
      expect(invalidExpiresResponse).toBeInstanceOf(GenerateAuthToken.Error);
      expect(
        (invalidExpiresResponse as GenerateAuthToken.Error).errorCode()
      ).toEqual(MomentoErrorCode.INVALID_ARGUMENT_ERROR);
    });
  });

  describe('refresh auth token use auth token credentials', () => {
    it('should succeed for refreshing an auth token', async () => {
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

      const expiresAtDelta =
        refreshSuccessRst.expiresAt.epoch() -
        generateSuccessRst.expiresAt.epoch();

      expect(expiresAtDelta).toBeGreaterThanOrEqual(delaySecondsBeforeRefresh);
      expect(expiresAtDelta).toBeLessThanOrEqual(delaySecondsBeforeRefresh + 1);
    });

    it("should not succeed for refreshing an api token that's expired", async () => {
      const generateResponse = await sessionTokenAuthClient.generateAuthToken(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.seconds(1)
      );
      const generateSuccessRst = generateResponse as GenerateAuthToken.Success;

      // Wait 1sec for the token to expire
      await delay(1000);

      const authTokenAuthClient = authTokenAuthClientFactory(
        generateSuccessRst.authToken
      );

      const refreshResponse = await authTokenAuthClient.refreshAuthToken(
        generateSuccessRst.refreshToken
      );
      expect(refreshResponse).toBeInstanceOf(RefreshAuthToken.Error);
      expect((refreshResponse as RefreshAuthToken.Error).errorCode()).toEqual(
        MomentoErrorCode.AUTHENTICATION_ERROR
      );
    });

    it("expired token can't create cache", async () => {
      const generateResponse = await sessionTokenAuthClient.generateAuthToken(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.seconds(1)
      );
      const generateSuccessRst = generateResponse as GenerateAuthToken.Success;

      // Wait 1sec for the token to expire
      await delay(1000);

      const cacheClient = cacheClientFactory(generateSuccessRst.authToken);

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
      const generateResponse = await sessionTokenAuthClient.generateAuthToken(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.seconds(1)
      );
      expect(generateResponse).toBeInstanceOf(GenerateAuthToken.Success);
    });

    it('should support generating an AllDataReadWrite token when authenticated via a session token', async () => {
      const generateResponse = await sessionTokenAuthClient.generateAuthToken(
        AllDataReadWrite,
        ExpiresIn.seconds(1)
      );
      expect(generateResponse).toBeInstanceOf(GenerateAuthToken.Success);
    });

    it('should not support generating a superuser token when authenticated via a v1 superuser token', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateAuthToken(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expect(superUserTokenResponse).toBeInstanceOf(GenerateAuthToken.Success);

      const authClient = authTokenAuthClientFactory(
        (superUserTokenResponse as GenerateAuthToken.Success).authToken
      );

      const generateResponse = await authClient.generateAuthToken(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.seconds(1)
      );
      expect(generateResponse).toBeInstanceOf(GenerateAuthToken.Error);
      const error = generateResponse as GenerateAuthToken.Error;
      expect(error.errorCode()).toEqual(MomentoErrorCode.PERMISSION_ERROR);
      expect(error.message()).toContain('Insufficient permissions');
    });

    it('should support generating an AllDataReadWrite token when authenticated via a v1 superuser token', async () => {
      const superUserTokenResponse =
        await sessionTokenAuthClient.generateAuthToken(
          SUPER_USER_PERMISSIONS,
          ExpiresIn.seconds(10)
        );
      expect(superUserTokenResponse).toBeInstanceOf(GenerateAuthToken.Success);

      const authClient = authTokenAuthClientFactory(
        (superUserTokenResponse as GenerateAuthToken.Success).authToken
      );

      const generateResponse = await authClient.generateAuthToken(
        AllDataReadWrite,
        ExpiresIn.seconds(1)
      );
      expect(generateResponse).toBeInstanceOf(GenerateAuthToken.Success);
    });

    it('should not support generating a superuser token when authenticated via a v1 AllDataReadWrite token', async () => {
      const allDataReadWriteTokenResponse =
        await sessionTokenAuthClient.generateAuthToken(
          AllDataReadWrite,
          ExpiresIn.seconds(10)
        );
      expect(allDataReadWriteTokenResponse).toBeInstanceOf(
        GenerateAuthToken.Success
      );

      const authClient = authTokenAuthClientFactory(
        (allDataReadWriteTokenResponse as GenerateAuthToken.Success).authToken
      );

      const generateResponse = await authClient.generateAuthToken(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.seconds(1)
      );
      expect(generateResponse).toBeInstanceOf(GenerateAuthToken.Error);
    });

    it('should not support generating an AllDataReadWrite token when authenticated via a v1 AllDataReadWrite token', async () => {
      const allDataReadWriteTokenResponse =
        await sessionTokenAuthClient.generateAuthToken(
          AllDataReadWrite,
          ExpiresIn.seconds(10)
        );
      expect(allDataReadWriteTokenResponse).toBeInstanceOf(
        GenerateAuthToken.Success
      );

      const authClient = authTokenAuthClientFactory(
        (allDataReadWriteTokenResponse as GenerateAuthToken.Success).authToken
      );

      const generateResponse = await authClient.generateAuthToken(
        AllDataReadWrite,
        ExpiresIn.seconds(1)
      );
      expect(generateResponse).toBeInstanceOf(GenerateAuthToken.Error);
    });

    it('should not support generating a superuser token when authenticated via a legacy token', async () => {
      const generateResponse = await legacyTokenAuthClient.generateAuthToken(
        SUPER_USER_PERMISSIONS,
        ExpiresIn.seconds(1)
      );
      expect(generateResponse).toBeInstanceOf(GenerateAuthToken.Error);
    });

    it('should not support generating an AllDataReadWrite token when authenticated via a legacy token', async () => {
      const generateResponse = await legacyTokenAuthClient.generateAuthToken(
        AllDataReadWrite,
        ExpiresIn.seconds(1)
      );
      expect(generateResponse).toBeInstanceOf(GenerateAuthToken.Error);
    });
  });

  describe('AllDataReadWrite token scope', () => {
    let allDataReadWriteClient: ICacheClient;

    beforeAll(async () => {
      const generateResponse = await sessionTokenAuthClient.generateAuthToken(
        AllDataReadWrite,
        ExpiresIn.seconds(60)
      );
      expect(generateResponse).toBeInstanceOf(GenerateAuthToken.Success);
      const allDataReadWriteToken = (
        generateResponse as GenerateAuthToken.Success
      ).authToken;
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
    });

    it('cannot create token with empty permission list', async () => {
      const tokenResponse = await sessionTokenAuthClient.generateAuthToken(
        {permissions: []},
        ExpiresIn.seconds(60)
      );
      expect(tokenResponse).toBeInstanceOf(GenerateAuthToken.Error);
      const tokenError = tokenResponse as GenerateAuthToken.Error;
      expect(tokenError.errorCode()).toEqual(
        MomentoErrorCode.INVALID_ARGUMENT_ERROR
      );
    });

    it('cannot create token with duplicate/conflicting cache permissions - all caches', async () => {
      const tokenResponse = await sessionTokenAuthClient.generateAuthToken(
        {
          permissions: [
            {role: CacheRole.ReadOnly, cache: AllCaches},
            {role: CacheRole.ReadWrite, cache: AllCaches},
          ],
        },
        ExpiresIn.seconds(60)
      );
      expect(tokenResponse).toBeInstanceOf(GenerateAuthToken.Error);
      const tokenError = tokenResponse as GenerateAuthToken.Error;
      expect(tokenError.errorCode()).toEqual(
        MomentoErrorCode.INVALID_ARGUMENT_ERROR
      );
    });

    it('cannot create token with duplicate/conflicting cache permissions - cache name', async () => {
      const tokenResponse = await sessionTokenAuthClient.generateAuthToken(
        {
          permissions: [
            {role: CacheRole.ReadOnly, cache: 'i-am-groot'},
            {role: CacheRole.ReadWrite, cache: {name: 'i-am-groot'}},
          ],
        },
        ExpiresIn.seconds(60)
      );
      expect(tokenResponse).toBeInstanceOf(GenerateAuthToken.Error);
      const tokenError = tokenResponse as GenerateAuthToken.Error;
      expect(tokenError.errorCode()).toEqual(
        MomentoErrorCode.INVALID_ARGUMENT_ERROR
      );
    });

    it('cannot create token with duplicate/conflicting topic permissions - cache + topic name', async () => {
      const tokenResponse = await sessionTokenAuthClient.generateAuthToken(
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
      expect(tokenResponse).toBeInstanceOf(GenerateAuthToken.Error);
      const tokenError = tokenResponse as GenerateAuthToken.Error;
      expect(tokenError.errorCode()).toEqual(
        MomentoErrorCode.INVALID_ARGUMENT_ERROR
      );
    });

    it('can only read all caches', async () => {
      const readAllCachesTokenResponse =
        await sessionTokenAuthClient.generateAuthToken(
          TokenScopes.cacheReadOnly(AllCaches),
          ExpiresIn.seconds(60)
        );
      expect(readAllCachesTokenResponse).toBeInstanceOf(
        GenerateAuthToken.Success
      );
      const readAllCachesToken = (
        readAllCachesTokenResponse as GenerateAuthToken.Success
      ).authToken;
      const cacheClient = cacheClientFactory(readAllCachesToken);
      // 1. Sets should fail
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'homer', 'simpson');
      expect(setResp1).toBeInstanceOf(CacheSet.Error);
      const setError1 = setResp1 as CacheSet.Error;
      expect(setError1.errorCode()).toEqual(MomentoErrorCode.PERMISSION_ERROR);
      expect(setError1.message()).toContain('Insufficient permissions');

      const setResp2 = await cacheClient.set(FGA_CACHE_2, 'oye', 'caramba', {
        ttl: 30,
      });
      expect(setResp2).toBeInstanceOf(CacheSet.Error);
      const setError2 = setResp2 as CacheSet.Error;
      expect(setError2.errorCode()).toEqual(MomentoErrorCode.PERMISSION_ERROR);
      expect(setError2.message()).toContain('Insufficient permissions');

      // 2. Gets for existing keys should succeed with hits
      const getResp1 = await cacheClient.get(FGA_CACHE_1, FGA_CACHE_1_KEY);
      expect(getResp1).toBeInstanceOf(CacheGet.Hit);
      const hitResp1 = getResp1 as CacheGet.Hit;
      expect(hitResp1.valueString()).toEqual(FGA_CACHE_1_VALUE);

      const getResp2 = await cacheClient.get(FGA_CACHE_2, FGA_CACHE_2_KEY);
      expect(getResp2).toBeInstanceOf(CacheGet.Hit);
      const hitResp2 = getResp2 as CacheGet.Hit;
      expect(hitResp2.valueString()).toEqual(FGA_CACHE_2_VALUE);

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
      expect(pubResp).toBeInstanceOf(TopicPublish.Error);
      const pubError = pubResp as TopicPublish.Error;
      expect(pubError.errorCode()).toEqual(MomentoErrorCode.PERMISSION_ERROR);
      expect(pubError.message()).toContain('Insufficient permissions');

      const subResp = await topicClient.subscribe(
        FGA_CACHE_1,
        'Ankh-Morpork Inquirer',
        trivialHandlers
      );
      expect(subResp).toBeInstanceOf(TopicSubscribe.Error);
      const subError = subResp as TopicSubscribe.Error;
      expect(subError.errorCode()).toEqual(MomentoErrorCode.PERMISSION_ERROR);
      expect(subError.message()).toContain('Insufficient permissions');
    });

    it('can only read all topics', async () => {
      const readAllTopicsTokenResponse =
        await sessionTokenAuthClient.generateAuthToken(
          TokenScopes.topicSubscribeOnly(AllCaches, AllTopics),
          ExpiresIn.seconds(60)
        );
      expect(readAllTopicsTokenResponse).toBeInstanceOf(
        GenerateAuthToken.Success
      );
      const readAllTopicsToken = (
        readAllTopicsTokenResponse as GenerateAuthToken.Success
      ).authToken;
      const cacheClient = cacheClientFactory(readAllTopicsToken);
      // Sets should fail
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'homer', 'simpson');
      expect(setResp1).toBeInstanceOf(CacheSet.Error);
      const setError1 = setResp1 as CacheSet.Error;
      expect(setError1.errorCode()).toEqual(MomentoErrorCode.PERMISSION_ERROR);
      expect(setError1.message()).toContain('Insufficient permissions');

      const setResp2 = await cacheClient.set(FGA_CACHE_2, 'oye', 'caramba', {
        ttl: 30,
      });
      expect(setResp2).toBeInstanceOf(CacheSet.Error);
      const setError2 = setResp2 as CacheSet.Error;
      expect(setError2.errorCode()).toEqual(MomentoErrorCode.PERMISSION_ERROR);
      expect(setError2.message()).toContain('Insufficient permissions');

      // Gets should fail
      const getResp1 = await cacheClient.get(FGA_CACHE_1, FGA_CACHE_1_KEY);
      expect(getResp1).toBeInstanceOf(CacheGet.Error);
      const getError1 = getResp1 as CacheGet.Error;
      expect(getError1.errorCode()).toEqual(MomentoErrorCode.PERMISSION_ERROR);
      expect(getError1.message()).toContain('Insufficient permissions');

      const getResp2 = await cacheClient.get(FGA_CACHE_2, FGA_CACHE_2_KEY);
      expect(getResp2).toBeInstanceOf(CacheGet.Error);
      const getError2 = getResp2 as CacheGet.Error;
      expect(getError2.errorCode()).toEqual(MomentoErrorCode.PERMISSION_ERROR);
      expect(getError2.message()).toContain('Insufficient permissions');

      const topicClient = topicClientFactory(readAllTopicsToken);
      // Publish should fail
      const pubResp = await topicClient.publish(
        FGA_CACHE_1,
        'The Ankh-Morpork Times',
        'The Truth Shall Make Ye Fret'
      );
      expect(pubResp).toBeInstanceOf(TopicPublish.Error);
      const pubError = pubResp as TopicPublish.Error;
      expect(pubError.errorCode()).toEqual(MomentoErrorCode.PERMISSION_ERROR);
      expect(pubError.message()).toContain('Insufficient permissions');

      // Subscribe should succeed
      const subResp = await topicClient.subscribe(
        FGA_CACHE_1,
        'The Ankh-Morpork Times',
        trivialHandlers
      );
      expect(subResp).toBeInstanceOf(TopicSubscribe.Subscription);
    });

    it('can read/write cache FGA_CACHE_1 and read/write all topics in cache FGA_CACHE_2', async () => {
      const tokenResponse = await sessionTokenAuthClient.generateAuthToken(
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
      expect(tokenResponse).toBeInstanceOf(GenerateAuthToken.Success);
      const token = (tokenResponse as GenerateAuthToken.Success).authToken;
      const cacheClient = cacheClientFactory(token);

      // Read/Write on cache FGA_CACHE_1 is allowed
      const setResp1 = await cacheClient.set(FGA_CACHE_1, 'ned', 'flanders');
      expect(setResp1).toBeInstanceOf(CacheSet.Success);

      const getResp1 = await cacheClient.get(FGA_CACHE_1, 'ned');
      expect(getResp1).toBeInstanceOf(CacheGet.Hit);
      const hitResp1 = getResp1 as CacheGet.Hit;
      expect(hitResp1.valueString()).toEqual('flanders');

      // Read/Write on cache FGA_CACHE_2 is not allowed
      const setResp2 = await cacheClient.set(FGA_CACHE_2, 'flaming', 'mo');
      expect(setResp2).toBeInstanceOf(CacheSet.Error);
      const setError2 = setResp2 as CacheSet.Error;
      expect(setError2.errorCode()).toEqual(MomentoErrorCode.PERMISSION_ERROR);
      expect(setError2.message()).toContain('Insufficient permissions');

      const getResp2 = await cacheClient.get(FGA_CACHE_2, 'flaming');
      expect(getResp2).toBeInstanceOf(CacheGet.Error);
      const getError2 = getResp2 as CacheGet.Error;
      expect(getError2.errorCode()).toEqual(MomentoErrorCode.PERMISSION_ERROR);
      expect(getError2.message()).toContain('Insufficient permissions');

      const topicClient = topicClientFactory(token);
      // Read/Write on topics in cache FGA_CACHE_1 is not allowed
      const pubResp = await topicClient.publish(
        FGA_CACHE_1,
        'breaking news!',
        'Flying lizard seen over Manhattan!'
      );
      expect(pubResp).toBeInstanceOf(TopicPublish.Error);
      const pubError = pubResp as TopicPublish.Error;
      expect(pubError.errorCode()).toEqual(MomentoErrorCode.PERMISSION_ERROR);
      expect(pubError.message()).toContain('Insufficient permissions');

      const subResp = await topicClient.subscribe(
        FGA_CACHE_1,
        'breaking news!',
        trivialHandlers
      );
      expect(subResp).toBeInstanceOf(TopicSubscribe.Error);
      const subError = subResp as TopicSubscribe.Error;
      expect(subError.errorCode()).toEqual(MomentoErrorCode.PERMISSION_ERROR);
      expect(subError.message()).toContain('Insufficient permissions');

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
      const tokenResponse =
        await sessionTokenAuthClient.generateDisposableToken(
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
      expect(getResp1).toBeInstanceOf(CacheGet.Error);

      // Read/Write on cache FGA_CACHE_2 is not allowed
      const setResp2 = await cacheClient.set(FGA_CACHE_2, 'flaming', 'mo');
      expect(setResp2).toBeInstanceOf(CacheSet.Error);
      const setError2 = setResp2 as CacheSet.Error;
      expect(setError2.errorCode()).toEqual(MomentoErrorCode.PERMISSION_ERROR);
      expect(setError2.message()).toContain('Insufficient permissions');

      const getResp2 = await cacheClient.get(FGA_CACHE_2, 'flaming');
      expect(getResp2).toBeInstanceOf(CacheGet.Error);
      const getError2 = getResp2 as CacheGet.Error;
      expect(getError2.errorCode()).toEqual(MomentoErrorCode.PERMISSION_ERROR);
      expect(getError2.message()).toContain('Insufficient permissions');

      const topicClient = topicClientFactory(token);
      // Read/Write on topics in cache FGA_CACHE_1 is not allowed
      const pubResp = await topicClient.publish(
        FGA_CACHE_1,
        'breaking news!',
        'Flying lizard seen over Manhattan!'
      );
      expect(pubResp).toBeInstanceOf(TopicPublish.Error);
      const pubError = pubResp as TopicPublish.Error;
      expect(pubError.errorCode()).toEqual(MomentoErrorCode.PERMISSION_ERROR);
      expect(pubError.message()).toContain('Insufficient permissions');

      const subResp = await topicClient.subscribe(
        FGA_CACHE_1,
        'breaking news!',
        trivialHandlers
      );
      expect(subResp).toBeInstanceOf(TopicSubscribe.Error);
      const subError = subResp as TopicSubscribe.Error;
      expect(subError.errorCode()).toEqual(MomentoErrorCode.PERMISSION_ERROR);
      expect(subError.message()).toContain('Insufficient permissions');

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
      expectWithMessage(() => {
        expect(subResp1).toBeInstanceOf(TopicSubscribe.Error);
      }, `expected ERROR but got ${subResp1.toString()}`);
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
