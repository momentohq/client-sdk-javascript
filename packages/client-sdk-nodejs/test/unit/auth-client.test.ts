import {InternalSuperUserPermissions} from '@gomomento/sdk-core/dist/src/internal/utils';
import {
  AllDataReadWrite,
  AllCaches,
  AllTopics,
  CachePermission,
  CacheRole,
  Permissions,
  TopicPermission,
  TopicRole,
} from '@gomomento/sdk-core';
import {auth} from '@gomomento/generated-types/dist/auth';
import _GenerateApiTokenRequest = auth._GenerateApiTokenRequest;
import {permissionsFromScope} from '../../src/internal/internal-auth-client';

describe('internal auth client', () => {
  describe('permissionsFromScope', () => {
    it('creates expected grpc permissions for InternalSuperUser permissions class', () => {
      const expectedPermission = new _GenerateApiTokenRequest.Permissions();
      expectedPermission.super_user =
        _GenerateApiTokenRequest.SuperUserPermissions.SuperUser;
      expect(permissionsFromScope(new InternalSuperUserPermissions())).toEqual(
        expectedPermission
      );
    });

    it('creates expected grpc permissions for AllDataReadWrite', () => {
      const topicPermissions =
        new _GenerateApiTokenRequest.PermissionsType.TopicPermissions();
      topicPermissions.role = _GenerateApiTokenRequest.TopicRole.TopicReadWrite;
      topicPermissions.all_caches =
        new _GenerateApiTokenRequest.PermissionsType.All();
      topicPermissions.all_topics =
        new _GenerateApiTokenRequest.PermissionsType.All();
      const topicPermissionType =
        new _GenerateApiTokenRequest.PermissionsType();
      topicPermissionType.topic_permissions = topicPermissions;

      const cachePermissions =
        new _GenerateApiTokenRequest.PermissionsType.CachePermissions();
      cachePermissions.role = _GenerateApiTokenRequest.CacheRole.CacheReadWrite;
      cachePermissions.all_caches =
        new _GenerateApiTokenRequest.PermissionsType.All();
      const cachePermissionType =
        new _GenerateApiTokenRequest.PermissionsType();
      cachePermissionType.cache_permissions = cachePermissions;

      const explicitPermissions =
        new _GenerateApiTokenRequest.ExplicitPermissions();
      explicitPermissions.permissions = [
        cachePermissionType,
        topicPermissionType,
      ];

      const grpcPermissions = new _GenerateApiTokenRequest.Permissions();
      grpcPermissions.explicit = explicitPermissions;
      expect(permissionsFromScope(AllDataReadWrite)).toEqual(grpcPermissions);
    });

    it('creates expected grpc permissions for cache and topic specific permissions', () => {
      const readAnyCache =
        new _GenerateApiTokenRequest.PermissionsType.CachePermissions();
      readAnyCache.role = _GenerateApiTokenRequest.CacheRole.CacheReadOnly;
      readAnyCache.all_caches =
        new _GenerateApiTokenRequest.PermissionsType.All();
      const readAnyCachePermission =
        new _GenerateApiTokenRequest.PermissionsType({
          cache_permissions: readAnyCache,
        });

      const writeCacheFoo =
        new _GenerateApiTokenRequest.PermissionsType.CachePermissions();
      writeCacheFoo.role = _GenerateApiTokenRequest.CacheRole.CacheReadWrite;
      writeCacheFoo.cache_selector =
        new _GenerateApiTokenRequest.PermissionsType.CacheSelector({
          cache_name: 'foo',
        });
      const writeCacheFooPermission =
        new _GenerateApiTokenRequest.PermissionsType();
      writeCacheFooPermission.cache_permissions = writeCacheFoo;

      const readAnyTopic =
        new _GenerateApiTokenRequest.PermissionsType.TopicPermissions();
      readAnyTopic.role = _GenerateApiTokenRequest.TopicRole.TopicReadOnly;
      readAnyTopic.all_caches =
        new _GenerateApiTokenRequest.PermissionsType.All();
      readAnyTopic.all_topics =
        new _GenerateApiTokenRequest.PermissionsType.All();
      const readAnyTopicPermission =
        new _GenerateApiTokenRequest.PermissionsType({
          topic_permissions: readAnyTopic,
        });

      const readWriteAnyTopicInCacheFoo =
        new _GenerateApiTokenRequest.PermissionsType.TopicPermissions();
      readWriteAnyTopicInCacheFoo.role =
        _GenerateApiTokenRequest.TopicRole.TopicReadWrite;
      readWriteAnyTopicInCacheFoo.cache_selector =
        new _GenerateApiTokenRequest.PermissionsType.CacheSelector({
          cache_name: 'foo',
        });
      readWriteAnyTopicInCacheFoo.all_topics =
        new _GenerateApiTokenRequest.PermissionsType.All();
      const readWriteAnyTopicInCacheFooPermission =
        new _GenerateApiTokenRequest.PermissionsType({
          topic_permissions: readWriteAnyTopicInCacheFoo,
        });

      const readWriteTopicBarInAnyCache =
        new _GenerateApiTokenRequest.PermissionsType.TopicPermissions();
      readWriteTopicBarInAnyCache.role =
        _GenerateApiTokenRequest.TopicRole.TopicReadWrite;
      readWriteTopicBarInAnyCache.all_caches =
        new _GenerateApiTokenRequest.PermissionsType.All();
      readWriteTopicBarInAnyCache.topic_selector =
        new _GenerateApiTokenRequest.PermissionsType.TopicSelector({
          topic_name: 'bar',
        });
      const readWriteTopicBarInAnyCachePermission =
        new _GenerateApiTokenRequest.PermissionsType({
          topic_permissions: readWriteTopicBarInAnyCache,
        });

      const readWriteTopicCatInCacheDog =
        new _GenerateApiTokenRequest.PermissionsType.TopicPermissions();
      readWriteTopicCatInCacheDog.role =
        _GenerateApiTokenRequest.TopicRole.TopicReadWrite;
      readWriteTopicCatInCacheDog.cache_selector =
        new _GenerateApiTokenRequest.PermissionsType.CacheSelector({
          cache_name: 'dog',
        });
      readWriteTopicCatInCacheDog.topic_selector =
        new _GenerateApiTokenRequest.PermissionsType.TopicSelector({
          topic_name: 'cat',
        });
      const readWriteTopicCatInCacheDogPermission =
        new _GenerateApiTokenRequest.PermissionsType();
      readWriteTopicCatInCacheDogPermission.topic_permissions =
        readWriteTopicCatInCacheDog;

      const explicitPermissions =
        new _GenerateApiTokenRequest.ExplicitPermissions();
      explicitPermissions.permissions = [
        readAnyCachePermission,
        writeCacheFooPermission,
        readAnyTopicPermission,
        readWriteAnyTopicInCacheFooPermission,
        readWriteTopicBarInAnyCachePermission,
        readWriteTopicCatInCacheDogPermission,
      ];

      const grpcPermissions = new _GenerateApiTokenRequest.Permissions();
      grpcPermissions.explicit = explicitPermissions;
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

      expect(permissionsFromScope(cacheAndTopicPermissions)).toEqual(
        grpcPermissions
      );
    });
  });
});
