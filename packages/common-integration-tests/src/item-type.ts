import {v4} from 'uuid';
import {
  ValidateCacheProps,
  ItBehavesLikeItValidatesCacheName,
  expectWithMessage,
} from './common-int-test-utils';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/internal/clients/cache';
import {ItemType} from '@gomomento/sdk-core';
import {TextEncoder} from 'util';
import {cache_client} from '@gomomento/generated-types/dist/cacheclient';
import _ItemGetTypeResponse = cache_client._ItemGetTypeResponse;

export function runItemTypeTest(
  Momento: ICacheClient,
  IntegrationTestCacheName: string
) {
  describe('item type', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return Momento.itemType(props.cacheName, v4());
    });

    it('should get item type scalar', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      await Momento.set(IntegrationTestCacheName, cacheKey, cacheValue);

      // string cache key
      let itemTypeResponse = await Momento.itemType(
        IntegrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(itemTypeResponse).toBeInstanceOf(ItemType.Hit);
      }, `expected HIT but got ${itemTypeResponse.toString()}`);
      let hitResult = itemTypeResponse as ItemType.Hit;
      expect(hitResult.getItemType()).toEqual(
        _ItemGetTypeResponse.ItemType.SCALAR
      );

      // byte array cache key
      itemTypeResponse = await Momento.itemType(
        IntegrationTestCacheName,
        new TextEncoder().encode(cacheKey)
      );
      expectWithMessage(() => {
        expect(itemTypeResponse).toBeInstanceOf(ItemType.Hit);
      }, `expected HIT but got ${itemTypeResponse.toString()}`);
      hitResult = itemTypeResponse as ItemType.Hit;
      expect(hitResult.getItemType()).toEqual(
        _ItemGetTypeResponse.ItemType.SCALAR
      );
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
      let itemTypeResponse = await Momento.itemType(
        IntegrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(itemTypeResponse).toBeInstanceOf(ItemType.Hit);
      }, `expected HIT but got ${itemTypeResponse.toString()}`);
      let hitResult = itemTypeResponse as ItemType.Hit;
      expect(hitResult.getItemType()).toEqual(
        _ItemGetTypeResponse.ItemType.DICTIONARY
      );

      // byte array cache key
      itemTypeResponse = await Momento.itemType(
        IntegrationTestCacheName,
        new TextEncoder().encode(cacheKey)
      );
      expectWithMessage(() => {
        expect(itemTypeResponse).toBeInstanceOf(ItemType.Hit);
      }, `expected HIT but got ${itemTypeResponse.toString()}`);
      hitResult = itemTypeResponse as ItemType.Hit;
      expect(hitResult.getItemType()).toEqual(
        _ItemGetTypeResponse.ItemType.DICTIONARY
      );
    });

    it('should get item type list', async () => {
      const cacheKey = v4();
      await Momento.listPushFront(IntegrationTestCacheName, cacheKey, v4());

      // string cache key
      let itemTypeResponse = await Momento.itemType(
        IntegrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(itemTypeResponse).toBeInstanceOf(ItemType.Hit);
      }, `expected HIT but got ${itemTypeResponse.toString()}`);
      let hitResult = itemTypeResponse as ItemType.Hit;
      expect(hitResult.getItemType()).toEqual(
        _ItemGetTypeResponse.ItemType.LIST
      );

      // byte array cache key
      itemTypeResponse = await Momento.itemType(
        IntegrationTestCacheName,
        new TextEncoder().encode(cacheKey)
      );
      expectWithMessage(() => {
        expect(itemTypeResponse).toBeInstanceOf(ItemType.Hit);
      }, `expected HIT but got ${itemTypeResponse.toString()}`);
      hitResult = itemTypeResponse as ItemType.Hit;
      expect(hitResult.getItemType()).toEqual(
        _ItemGetTypeResponse.ItemType.LIST
      );
    });

    it('should get item type set', async () => {
      const cacheKey = v4();
      await Momento.setAddElement(IntegrationTestCacheName, cacheKey, v4());

      // string cache key
      let itemTypeResponse = await Momento.itemType(
        IntegrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(itemTypeResponse).toBeInstanceOf(ItemType.Hit);
      }, `expected HIT but got ${itemTypeResponse.toString()}`);
      let hitResult = itemTypeResponse as ItemType.Hit;
      expect(hitResult.getItemType()).toEqual(
        _ItemGetTypeResponse.ItemType.SET
      );

      // byte array cache key
      itemTypeResponse = await Momento.itemType(
        IntegrationTestCacheName,
        new TextEncoder().encode(cacheKey)
      );
      expectWithMessage(() => {
        expect(itemTypeResponse).toBeInstanceOf(ItemType.Hit);
      }, `expected HIT but got ${itemTypeResponse.toString()}`);
      hitResult = itemTypeResponse as ItemType.Hit;
      expect(hitResult.getItemType()).toEqual(
        _ItemGetTypeResponse.ItemType.SET
      );
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
      let itemTypeResponse = await Momento.itemType(
        IntegrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(itemTypeResponse).toBeInstanceOf(ItemType.Hit);
      }, `expected HIT but got ${itemTypeResponse.toString()}`);
      let hitResult = itemTypeResponse as ItemType.Hit;
      expect(hitResult.getItemType()).toEqual(
        _ItemGetTypeResponse.ItemType.SORTED_SET
      );

      // byte array cache key
      itemTypeResponse = await Momento.itemType(
        IntegrationTestCacheName,
        new TextEncoder().encode(cacheKey)
      );
      expectWithMessage(() => {
        expect(itemTypeResponse).toBeInstanceOf(ItemType.Hit);
      }, `expected HIT but got ${itemTypeResponse.toString()}`);
      hitResult = itemTypeResponse as ItemType.Hit;
      expect(hitResult.getItemType()).toEqual(
        _ItemGetTypeResponse.ItemType.SORTED_SET
      );
    });
  });
}
