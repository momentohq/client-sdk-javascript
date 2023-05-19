import {IAuthClient} from '@gomomento/sdk-core/dist/src/clients/IAuthClient';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/clients/ICacheClient';
import {
  AllDataReadWrite,
  CacheGet,
  CacheSet,
  CreateCache,
  DeleteCache,
  ExpiresIn,
  GenerateAuthToken,
  MomentoErrorCode,
} from '@gomomento/sdk-core';

export function runTokenScopeTests(
  v1SuperUserToken: string,
  authClientFactory: (token: string) => IAuthClient,
  cacheClientFactory: (token: string) => ICacheClient,
  cacheName: string
) {
  describe('AllDataReadWrite token scope', () => {
    let allDataReadWriteClient: ICacheClient;

    beforeAll(async () => {
      const authClient = authClientFactory(v1SuperUserToken);
      const generateResponse = await authClient.generateAuthToken(
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
        MomentoErrorCode.AUTHENTICATION_ERROR
      );
      expect(createCacheError.message()).toContain('insufficient permissions');
    });
    it('cannot delete a cache', async () => {
      const deleteCacheResponse = await allDataReadWriteClient.deleteCache(
        cacheName
      );
      expect(deleteCacheResponse).toBeInstanceOf(DeleteCache.Error);
      const deleteCacheError = deleteCacheResponse as DeleteCache.Error;
      expect(deleteCacheError.errorCode()).toEqual(
        MomentoErrorCode.AUTHENTICATION_ERROR
      );
      expect(deleteCacheError.message()).toContain('insufficient permissions');
    });
    it('can set values in an existing cache', async () => {
      const setResponse = await allDataReadWriteClient.set(
        cacheName,
        'foo',
        'FOO'
      );
      expect(setResponse).toBeInstanceOf(CacheSet.Success);
    });
    it('can get values from an existing cache', async () => {
      const getResponse = await allDataReadWriteClient.get(
        cacheName,
        'habanero'
      );
      expect(getResponse).toBeInstanceOf(CacheGet.Miss);
    });
  });
}
