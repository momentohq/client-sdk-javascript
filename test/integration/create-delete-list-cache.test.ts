import {v4} from 'uuid';
import {
  ValidateCacheProps,
  ItBehavesLikeItValidatesCacheName,
  SetupIntegrationTest,
  WithCache,
} from './integration-setup';
import {
  CreateCache,
  DeleteCache,
  ListCaches,
  MomentoErrorCode,
} from '../../src';

const {Momento} = SetupIntegrationTest();

describe('create/delete cache', () => {
  ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
    return Momento.createCache(props.cacheName);
  });

  ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
    return Momento.deleteCache(props.cacheName);
  });

  it('should return NotFoundError if deleting a non-existent cache', async () => {
    const cacheName = v4();
    const deleteResponse = await Momento.deleteCache(cacheName);
    expect(deleteResponse).toBeInstanceOf(DeleteCache.Response);
    expect(deleteResponse).toBeInstanceOf(DeleteCache.Error);
    if (deleteResponse instanceof DeleteCache.Error) {
      expect(deleteResponse.errorCode()).toEqual(
        MomentoErrorCode.NOT_FOUND_ERROR
      );
    }
  });

  it('should return AlreadyExists response if trying to create a cache that already exists', async () => {
    const cacheName = v4();
    await WithCache(Momento, cacheName, async () => {
      const createResponse = await Momento.createCache(cacheName);
      expect(createResponse).toBeInstanceOf(CreateCache.AlreadyExists);
    });
  });

  it('should create 1 cache and list the created cache', async () => {
    const cacheName = v4();
    await WithCache(Momento, cacheName, async () => {
      const listResponse = await Momento.listCaches();
      expect(listResponse).toBeInstanceOf(ListCaches.Success);
      if (listResponse instanceof ListCaches.Success) {
        const caches = listResponse.getCaches();
        const names = caches.map(c => c.getName());
        expect(names.includes(cacheName)).toBeTruthy();
      }
    });
  });
});
