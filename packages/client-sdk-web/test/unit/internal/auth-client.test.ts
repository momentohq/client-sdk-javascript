import {permissionsFromScope} from '../../../src/internal/auth-client';
import {InternalSuperUserPermissions} from '@gomomento/sdk-core/dist/src/internal/utils';
import {
  ExplicitPermissions,
  Permissions as TokenPermissions,
  PermissionsType,
  SuperUserPermissions,
  TopicRole as TokenTopicRole,
  CacheRole as TokenCacheRole,
} from '@gomomento/generated-types-webtext/dist/permissionmessages_pb';
import {
  AllCaches,
  AllDataReadWrite,
  AllTopics,
  CacheRole,
  Permissions,
  TopicRole,
} from '@gomomento/sdk-core';

describe('internal auth client', () => {
  describe('permissionsFromScope', () => {
    it('creates expected grpc permissions for InternalSuperUser permissions class', () => {
      const expectedPermission = new TokenPermissions();
      expectedPermission.setSuperUser(SuperUserPermissions.SUPERUSER);
      expect(permissionsFromScope(new InternalSuperUserPermissions())).toEqual(
        expectedPermission
      );
    });

    it('creates expected grpc permissions for AllDataReadWrite', () => {
      const topicPermissions = new PermissionsType.TopicPermissions();
      topicPermissions.setRole(TokenTopicRole.TOPICREADWRITE);
      topicPermissions.setAllCaches(new PermissionsType.All());
      topicPermissions.setAllTopics(new PermissionsType.All());
      const topicPermissionType = new PermissionsType();
      topicPermissionType.setTopicPermissions(topicPermissions);

      const cachePermissions = new PermissionsType.CachePermissions();
      cachePermissions.setRole(TokenCacheRole.CACHEREADWRITE);
      cachePermissions.setAllCaches(new PermissionsType.All());
      const cachePermissionType = new PermissionsType();
      cachePermissionType.setCachePermissions(cachePermissions);

      const explicitPermissions = new ExplicitPermissions();
      explicitPermissions.setPermissionsList([
        cachePermissionType,
        topicPermissionType,
      ]);

      const grpcPermissions = new TokenPermissions();
      grpcPermissions.setExplicit(explicitPermissions);
      expect(permissionsFromScope(AllDataReadWrite)).toEqual(grpcPermissions);
    });

    it('creates expected grpc permissions for cache and topic specific permissions', () => {
      const readAnyCache = new PermissionsType.CachePermissions();
      readAnyCache.setRole(TokenCacheRole.CACHEREADONLY);
      readAnyCache.setAllCaches(new PermissionsType.All());

      const readAnyCachePermission = new PermissionsType();
      readAnyCachePermission.setCachePermissions(readAnyCache);

      const writeCacheFoo = new PermissionsType.CachePermissions();
      writeCacheFoo.setRole(TokenCacheRole.CACHEREADWRITE);
      const writeFooCacheSelector = new PermissionsType.CacheSelector();
      writeFooCacheSelector.setCacheName('foo');
      writeCacheFoo.setCacheSelector(writeFooCacheSelector);
      const writeCacheFooPermission = new PermissionsType();
      writeCacheFooPermission.setCachePermissions(writeCacheFoo);

      const readAnyTopic = new PermissionsType.TopicPermissions();
      readAnyTopic.setRole(TokenTopicRole.TOPICREADONLY);
      readAnyTopic.setAllCaches(new PermissionsType.All());
      readAnyTopic.setAllTopics(new PermissionsType.All());
      const readAnyTopicPermission = new PermissionsType();
      readAnyTopicPermission.setTopicPermissions(readAnyTopic);

      const readWriteAnyTopicInCacheFoo =
        new PermissionsType.TopicPermissions();
      readWriteAnyTopicInCacheFoo.setRole(TokenTopicRole.TOPICREADWRITE);
      const readWriteAnyTopicInCacheFooCacheSelector =
        new PermissionsType.CacheSelector();
      readWriteAnyTopicInCacheFooCacheSelector.setCacheName('foo');
      readWriteAnyTopicInCacheFoo.setCacheSelector(
        readWriteAnyTopicInCacheFooCacheSelector
      );
      readWriteAnyTopicInCacheFoo.setAllTopics(new PermissionsType.All());
      const readWriteAnyTopicInCacheFooPermission = new PermissionsType();
      readWriteAnyTopicInCacheFooPermission.setTopicPermissions(
        readWriteAnyTopicInCacheFoo
      );

      const readWriteTopicBarInAnyCache =
        new PermissionsType.TopicPermissions();
      readWriteTopicBarInAnyCache.setRole(TokenTopicRole.TOPICREADWRITE);
      readWriteTopicBarInAnyCache.setAllCaches(new PermissionsType.All());
      const readWriteTopicBarInAnyCacheTopicSelector =
        new PermissionsType.TopicSelector();
      readWriteTopicBarInAnyCacheTopicSelector.setTopicName('bar');
      readWriteTopicBarInAnyCache.setTopicSelector(
        readWriteTopicBarInAnyCacheTopicSelector
      );
      const readWriteTopicBarInAnyCachePermission = new PermissionsType();
      readWriteTopicBarInAnyCachePermission.setTopicPermissions(
        readWriteTopicBarInAnyCache
      );

      const readWriteTopicCatInCacheDog =
        new PermissionsType.TopicPermissions();
      readWriteTopicCatInCacheDog.setRole(TokenTopicRole.TOPICREADWRITE);
      const readWriteTopicCatInCacheDogCacheSelector =
        new PermissionsType.CacheSelector();
      readWriteTopicCatInCacheDogCacheSelector.setCacheName('dog');
      readWriteTopicCatInCacheDog.setCacheSelector(
        readWriteTopicCatInCacheDogCacheSelector
      );
      const readWriteTopicCatInCacheDogTopicSelector =
        new PermissionsType.TopicSelector();
      readWriteTopicCatInCacheDogTopicSelector.setTopicName('cat');
      readWriteTopicCatInCacheDog.setTopicSelector(
        readWriteTopicCatInCacheDogTopicSelector
      );
      const readWriteTopicCatInCacheDogPermission = new PermissionsType();
      readWriteTopicCatInCacheDogPermission.setTopicPermissions(
        readWriteTopicCatInCacheDog
      );

      const explicitPermissions = new ExplicitPermissions();
      explicitPermissions.setPermissionsList([
        readAnyCachePermission,
        writeCacheFooPermission,
        readAnyTopicPermission,
        readWriteAnyTopicInCacheFooPermission,
        readWriteTopicBarInAnyCachePermission,
        readWriteTopicCatInCacheDogPermission,
      ]);

      const grpcPermissions = new TokenPermissions();
      grpcPermissions.setExplicit(explicitPermissions);

      const cacheAndTopicPermissions: Permissions = {
        permissions: [
          {role: CacheRole.ReadOnly, cache: AllCaches},
          {role: CacheRole.ReadWrite, cache: {name: 'foo'}},
          {role: TopicRole.SubscribeOnly, cache: AllCaches, topic: AllTopics},
          {role: TopicRole.PublishSubscribe, cache: 'foo', topic: AllTopics},
          {
            role: TopicRole.PublishSubscribe,
            cache: AllCaches,
            topic: {name: 'bar'},
          },
          {role: TopicRole.PublishSubscribe, cache: 'dog', topic: 'cat'},
        ],
      };

      console.log(grpcPermissions);

      expect(permissionsFromScope(cacheAndTopicPermissions)).toEqual(
        grpcPermissions
      );
    });
  });
});
