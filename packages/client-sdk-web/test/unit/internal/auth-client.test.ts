import {permissionsFromScope} from '../../../src/internal/auth-client';
import {InternalSuperUserPermissions} from '@gomomento/sdk-core/dist/src/internal/utils';
import {_GenerateApiTokenRequest} from '@gomomento/generated-types-webtext/dist/auth_pb';
import {
  AllCaches,
  AllDataReadWrite,
  AllTopics,
  CachePermission,
  CacheRole,
  Permissions,
  TopicPermission,
  TopicRole,
} from '@gomomento/sdk-core';

describe('internal auth client', () => {
  describe('permissionsFromScope', () => {
    it('creates expected grpc permissions for InternalSuperUser permissions class', () => {
      const expectedPermission = new _GenerateApiTokenRequest.Permissions();
      expectedPermission.setSuperUser(
        _GenerateApiTokenRequest.SuperUserPermissions.SUPERUSER
      );
      expect(permissionsFromScope(new InternalSuperUserPermissions())).toEqual(
        expectedPermission
      );
    });

    it('creates expected grpc permissions for AllDataReadWrite', () => {
      const topicPermissions =
        new _GenerateApiTokenRequest.PermissionsType.TopicPermissions();
      topicPermissions.setRole(
        _GenerateApiTokenRequest.TopicRole.TOPICREADWRITE
      );
      topicPermissions.setAllCaches(
        new _GenerateApiTokenRequest.PermissionsType.All()
      );
      topicPermissions.setAllTopics(
        new _GenerateApiTokenRequest.PermissionsType.All()
      );
      const topicPermissionType =
        new _GenerateApiTokenRequest.PermissionsType();
      topicPermissionType.setTopicPermissions(topicPermissions);

      const cachePermissions =
        new _GenerateApiTokenRequest.PermissionsType.CachePermissions();
      cachePermissions.setRole(
        _GenerateApiTokenRequest.CacheRole.CACHEREADWRITE
      );
      cachePermissions.setAllCaches(
        new _GenerateApiTokenRequest.PermissionsType.All()
      );
      const cachePermissionType =
        new _GenerateApiTokenRequest.PermissionsType();
      cachePermissionType.setCachePermissions(cachePermissions);

      const explicitPermissions =
        new _GenerateApiTokenRequest.ExplicitPermissions();
      explicitPermissions.setPermissionsList([
        cachePermissionType,
        topicPermissionType,
      ]);

      const grpcPermissions = new _GenerateApiTokenRequest.Permissions();
      grpcPermissions.setExplicit(explicitPermissions);
      expect(permissionsFromScope(AllDataReadWrite)).toEqual(grpcPermissions);
    });

    it('creates expected grpc permissions for cache and topic specific permissions', () => {
      const readAnyCache =
        new _GenerateApiTokenRequest.PermissionsType.CachePermissions();
      readAnyCache.setRole(_GenerateApiTokenRequest.CacheRole.CACHEREADONLY);
      readAnyCache.setAllCaches(
        new _GenerateApiTokenRequest.PermissionsType.All()
      );

      const readAnyCachePermission =
        new _GenerateApiTokenRequest.PermissionsType();
      readAnyCachePermission.setCachePermissions(readAnyCache);

      const writeCacheFoo =
        new _GenerateApiTokenRequest.PermissionsType.CachePermissions();
      writeCacheFoo.setRole(_GenerateApiTokenRequest.CacheRole.CACHEREADWRITE);
      const writeFooCacheSelector =
        new _GenerateApiTokenRequest.PermissionsType.CacheSelector();
      writeFooCacheSelector.setCacheName('foo');
      writeCacheFoo.setCacheSelector(writeFooCacheSelector);
      const writeCacheFooPermission =
        new _GenerateApiTokenRequest.PermissionsType();
      writeCacheFooPermission.setCachePermissions(writeCacheFoo);

      const readAnyTopic =
        new _GenerateApiTokenRequest.PermissionsType.TopicPermissions();
      readAnyTopic.setRole(_GenerateApiTokenRequest.TopicRole.TOPICREADONLY);
      readAnyTopic.setAllCaches(
        new _GenerateApiTokenRequest.PermissionsType.All()
      );
      readAnyTopic.setAllTopics(
        new _GenerateApiTokenRequest.PermissionsType.All()
      );
      const readAnyTopicPermission =
        new _GenerateApiTokenRequest.PermissionsType();
      readAnyTopicPermission.setTopicPermissions(readAnyTopic);

      const readWriteAnyTopicInCacheFoo =
        new _GenerateApiTokenRequest.PermissionsType.TopicPermissions();
      readWriteAnyTopicInCacheFoo.setRole(
        _GenerateApiTokenRequest.TopicRole.TOPICREADWRITE
      );
      const readWriteAnyTopicInCacheFooCacheSelector =
        new _GenerateApiTokenRequest.PermissionsType.CacheSelector();
      readWriteAnyTopicInCacheFooCacheSelector.setCacheName('foo');
      readWriteAnyTopicInCacheFoo.setCacheSelector(
        readWriteAnyTopicInCacheFooCacheSelector
      );
      readWriteAnyTopicInCacheFoo.setAllTopics(
        new _GenerateApiTokenRequest.PermissionsType.All()
      );
      const readWriteAnyTopicInCacheFooPermission =
        new _GenerateApiTokenRequest.PermissionsType();
      readWriteAnyTopicInCacheFooPermission.setTopicPermissions(
        readWriteAnyTopicInCacheFoo
      );

      const readWriteTopicBarInAnyCache =
        new _GenerateApiTokenRequest.PermissionsType.TopicPermissions();
      readWriteTopicBarInAnyCache.setRole(
        _GenerateApiTokenRequest.TopicRole.TOPICREADWRITE
      );
      readWriteTopicBarInAnyCache.setAllCaches(
        new _GenerateApiTokenRequest.PermissionsType.All()
      );
      const readWriteTopicBarInAnyCacheTopicSelector =
        new _GenerateApiTokenRequest.PermissionsType.TopicSelector();
      readWriteTopicBarInAnyCacheTopicSelector.setTopicName('bar');
      readWriteTopicBarInAnyCache.setTopicSelector(
        readWriteTopicBarInAnyCacheTopicSelector
      );
      const readWriteTopicBarInAnyCachePermission =
        new _GenerateApiTokenRequest.PermissionsType();
      readWriteTopicBarInAnyCachePermission.setTopicPermissions(
        readWriteTopicBarInAnyCache
      );

      const readWriteTopicCatInCacheDog =
        new _GenerateApiTokenRequest.PermissionsType.TopicPermissions();
      readWriteTopicCatInCacheDog.setRole(
        _GenerateApiTokenRequest.TopicRole.TOPICREADWRITE
      );
      const readWriteTopicCatInCacheDogCacheSelector =
        new _GenerateApiTokenRequest.PermissionsType.CacheSelector();
      readWriteTopicCatInCacheDogCacheSelector.setCacheName('dog');
      readWriteTopicCatInCacheDog.setCacheSelector(
        readWriteTopicCatInCacheDogCacheSelector
      );
      const readWriteTopicCatInCacheDogTopicSelector =
        new _GenerateApiTokenRequest.PermissionsType.TopicSelector();
      readWriteTopicCatInCacheDogTopicSelector.setTopicName('cat');
      readWriteTopicCatInCacheDog.setTopicSelector(
        readWriteTopicCatInCacheDogTopicSelector
      );
      const readWriteTopicCatInCacheDogPermission =
        new _GenerateApiTokenRequest.PermissionsType();
      readWriteTopicCatInCacheDogPermission.setTopicPermissions(
        readWriteTopicCatInCacheDog
      );

      const explicitPermissions =
        new _GenerateApiTokenRequest.ExplicitPermissions();
      explicitPermissions.setPermissionsList([
        readAnyCachePermission,
        writeCacheFooPermission,
        readAnyTopicPermission,
        readWriteAnyTopicInCacheFooPermission,
        readWriteTopicBarInAnyCachePermission,
        readWriteTopicCatInCacheDogPermission,
      ]);

      const grpcPermissions = new _GenerateApiTokenRequest.Permissions();
      grpcPermissions.setExplicit(explicitPermissions);

      const cacheAndTopicPermissions: Permissions = new Permissions([
        new CachePermission(CacheRole.ReadOnly, {cache: AllCaches}),
        new CachePermission(CacheRole.ReadWrite, {
          cache: {name: 'foo'},
        }),
        new TopicPermission(TopicRole.ReadOnly, {
          cache: AllCaches,
          topic: AllTopics,
        }),
        new TopicPermission(TopicRole.ReadWrite, {
          cache: 'foo',
          topic: AllTopics,
        }),
        new TopicPermission(TopicRole.ReadWrite, {
          cache: AllCaches,
          topic: {name: 'bar'},
        }),
        new TopicPermission(TopicRole.ReadWrite, {
          cache: 'dog',
          topic: 'cat',
        }),
      ]);

      console.log(grpcPermissions);

      expect(permissionsFromScope(cacheAndTopicPermissions)).toEqual(
        grpcPermissions
      );
    });
  });
});
