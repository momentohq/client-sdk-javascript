import {v4} from 'uuid';
import {
  ValidateCacheProps,
  ItBehavesLikeItValidatesCacheName,
  expectWithMessage,
} from './common-int-test-utils';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/internal/clients/cache';
import {ItemGetType} from '@gomomento/sdk-core';
import {ItemType} from '@gomomento/sdk-core/dist/src/utils';
export function runItemGetTypeTest(
  Momento: ICacheClient,
  IntegrationTestCacheName: string
) {
  describe('item type', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return Momento.itemGetType(props.cacheName, v4());
    });

    it('should get item type scalar', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      await Momento.set(IntegrationTestCacheName, cacheKey, cacheValue);

      // string cache key
      let itemGetTypeResponse = await Momento.itemGetType(
        IntegrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(itemGetTypeResponse).toBeInstanceOf(ItemGetType.Hit);
      }, `expected HIT but got ${itemGetTypeResponse.toString()}`);
      let hitResult = itemGetTypeResponse as ItemGetType.Hit;
      expect(hitResult.itemType()).toEqual(ItemType.SCALAR);

      // byte array cache key
      itemGetTypeResponse = await Momento.itemGetType(
        IntegrationTestCacheName,
        new TextEncoder().encode(cacheKey)
      );
      expectWithMessage(() => {
        expect(itemGetTypeResponse).toBeInstanceOf(ItemGetType.Hit);
      }, `expected HIT but got ${itemGetTypeResponse.toString()}`);
      hitResult = itemGetTypeResponse as ItemGetType.Hit;
      expect(hitResult.itemType()).toEqual(ItemType.SCALAR);
    });

    it('should get item type dictionary', async () => {
      const cacheKey = v4();
      await Momento.dictionarySetField(
        IntegrationTestCacheName,
        cacheKey,
        v4(),
        v4()
      );

      // string cache key
      let itemGetTypeResponse = await Momento.itemGetType(
        IntegrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(itemGetTypeResponse).toBeInstanceOf(ItemGetType.Hit);
      }, `expected HIT but got ${itemGetTypeResponse.toString()}`);
      let hitResult = itemGetTypeResponse as ItemGetType.Hit;
      expect(hitResult.itemType()).toEqual(ItemType.DICTIONARY);

      // byte array cache key
      itemGetTypeResponse = await Momento.itemGetType(
        IntegrationTestCacheName,
        new TextEncoder().encode(cacheKey)
      );
      expectWithMessage(() => {
        expect(itemGetTypeResponse).toBeInstanceOf(ItemGetType.Hit);
      }, `expected HIT but got ${itemGetTypeResponse.toString()}`);
      hitResult = itemGetTypeResponse as ItemGetType.Hit;
      expect(hitResult.itemType()).toEqual(ItemType.DICTIONARY);
    });

    it('should get item type list', async () => {
      const cacheKey = v4();
      await Momento.listPushFront(IntegrationTestCacheName, cacheKey, v4());

      // string cache key
      let itemGetTypeResponse = await Momento.itemGetType(
        IntegrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(itemGetTypeResponse).toBeInstanceOf(ItemGetType.Hit);
      }, `expected HIT but got ${itemGetTypeResponse.toString()}`);
      let hitResult = itemGetTypeResponse as ItemGetType.Hit;
      expect(hitResult.itemType()).toEqual(ItemType.LIST);

      // byte array cache key
      itemGetTypeResponse = await Momento.itemGetType(
        IntegrationTestCacheName,
        new TextEncoder().encode(cacheKey)
      );
      expectWithMessage(() => {
        expect(itemGetTypeResponse).toBeInstanceOf(ItemGetType.Hit);
      }, `expected HIT but got ${itemGetTypeResponse.toString()}`);
      hitResult = itemGetTypeResponse as ItemGetType.Hit;
      expect(hitResult.itemType()).toEqual(ItemType.LIST);
    });

    it('should get item type set', async () => {
      const cacheKey = v4();
      await Momento.setAddElement(IntegrationTestCacheName, cacheKey, v4());

      // string cache key
      let itemGetTypeResponse = await Momento.itemGetType(
        IntegrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(itemGetTypeResponse).toBeInstanceOf(ItemGetType.Hit);
      }, `expected HIT but got ${itemGetTypeResponse.toString()}`);
      let hitResult = itemGetTypeResponse as ItemGetType.Hit;
      expect(hitResult.itemType()).toEqual(ItemType.SET);

      // byte array cache key
      itemGetTypeResponse = await Momento.itemGetType(
        IntegrationTestCacheName,
        new TextEncoder().encode(cacheKey)
      );
      expectWithMessage(() => {
        expect(itemGetTypeResponse).toBeInstanceOf(ItemGetType.Hit);
      }, `expected HIT but got ${itemGetTypeResponse.toString()}`);
      hitResult = itemGetTypeResponse as ItemGetType.Hit;
      expect(hitResult.itemType()).toEqual(ItemType.SET);
    });

    it('should get item type sorted set', async () => {
      const cacheKey = v4();
      await Momento.sortedSetPutElement(
        IntegrationTestCacheName,
        cacheKey,
        'a',
        42
      );

      // string cache key
      let itemGetTypeResponse = await Momento.itemGetType(
        IntegrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(itemGetTypeResponse).toBeInstanceOf(ItemGetType.Hit);
      }, `expected HIT but got ${itemGetTypeResponse.toString()}`);
      let hitResult = itemGetTypeResponse as ItemGetType.Hit;
      expect(hitResult.itemType()).toEqual(ItemType.SORTED_SET);

      // byte array cache key
      itemGetTypeResponse = await Momento.itemGetType(
        IntegrationTestCacheName,
        new TextEncoder().encode(cacheKey)
      );
      expectWithMessage(() => {
        expect(itemGetTypeResponse).toBeInstanceOf(ItemGetType.Hit);
      }, `expected HIT but got ${itemGetTypeResponse.toString()}`);
      hitResult = itemGetTypeResponse as ItemGetType.Hit;
      expect(hitResult.itemType()).toEqual(ItemType.SORTED_SET);
    });
  });
}
