import {InternalSuperUserPermissions} from '@gomomento/sdk-core/dist/src/internal/utils';
import {
  AllCaches,
  AllDataReadWrite,
  AllTopics,
  CacheRole,
  Permissions,
  TopicRole,
} from '@gomomento/sdk-core';
import {auth} from '@gomomento/generated-types/dist/auth';
import {permissionsFromScope} from '../../src/internal/internal-auth-client';
import {
  Permissions as grpcPermissions,
  PermissionsType,
  SuperUserPermissions,
  TopicRole as grpcTopicRole,
  CacheRole as grpcCacheRole,
  ExplicitPermissions,
} from '@gomomento/generated-types/dist/permissions';

describe('internal auth client', () => {
  describe('permissionsFromScope', () => {
    it('creates expected grpc permissions for InternalSuperUser permissions class', () => {
      const expectedPermission = new grpcPermissions();
      expectedPermission.super_user = SuperUserPermissions.SuperUser;
      expect(permissionsFromScope(new InternalSuperUserPermissions())).toEqual(
        expectedPermission
      );
    });

    it('creates expected grpc permissions for AllDataReadWrite', () => {
      const topicPermissions = new PermissionsType.TopicPermissions();
      topicPermissions.role = grpcTopicRole.TopicReadWrite;
      topicPermissions.all_caches = new PermissionsType.All();
      topicPermissions.all_topics = new PermissionsType.All();
      const topicPermissionType = new PermissionsType();
      topicPermissionType.topic_permissions = topicPermissions;

      const cachePermissions = new PermissionsType.CachePermissions();
      cachePermissions.role = grpcCacheRole.CacheReadWrite;
      cachePermissions.all_caches = new PermissionsType.All();
      const cachePermissionType = new PermissionsType();
      cachePermissionType.cache_permissions = cachePermissions;

      const explicitPermissions = new ExplicitPermissions();
      explicitPermissions.permissions = [
        cachePermissionType,
        topicPermissionType,
      ];

      const grpcPermission = new grpcPermissions();
      grpcPermission.explicit = explicitPermissions;
      expect(permissionsFromScope(AllDataReadWrite)).toEqual(grpcPermission);
    });

    it('creates expected grpc permissions for cache and topic specific permissions', () => {
      const readAnyCache = new PermissionsType.CachePermissions();
      readAnyCache.role = grpcCacheRole.CacheReadOnly;
      readAnyCache.all_caches = new PermissionsType.All();
      const readAnyCachePermission = new PermissionsType({
        cache_permissions: readAnyCache,
      });

      const writeCacheFoo = new PermissionsType.CachePermissions();
      writeCacheFoo.role = grpcCacheRole.CacheReadWrite;
      writeCacheFoo.cache_selector = new PermissionsType.CacheSelector({
        cache_name: 'foo',
      });
      const writeCacheFooPermission = new PermissionsType();
      writeCacheFooPermission.cache_permissions = writeCacheFoo;

      const readAnyTopic = new PermissionsType.TopicPermissions();
      readAnyTopic.role = grpcTopicRole.TopicReadOnly;
      readAnyTopic.all_caches = new PermissionsType.All();
      readAnyTopic.all_topics = new PermissionsType.All();
      const readAnyTopicPermission = new PermissionsType({
        topic_permissions: readAnyTopic,
      });

      const readWriteAnyTopicInCacheFoo =
        new PermissionsType.TopicPermissions();
      readWriteAnyTopicInCacheFoo.role = grpcTopicRole.TopicReadWrite;
      readWriteAnyTopicInCacheFoo.cache_selector =
        new PermissionsType.CacheSelector({
          cache_name: 'foo',
        });
      readWriteAnyTopicInCacheFoo.all_topics = new PermissionsType.All();
      const readWriteAnyTopicInCacheFooPermission = new PermissionsType({
        topic_permissions: readWriteAnyTopicInCacheFoo,
      });

      const readWriteTopicBarInAnyCache =
        new PermissionsType.TopicPermissions();
      readWriteTopicBarInAnyCache.role = grpcTopicRole.TopicReadWrite;
      readWriteTopicBarInAnyCache.all_caches = new PermissionsType.All();
      readWriteTopicBarInAnyCache.topic_selector =
        new PermissionsType.TopicSelector({
          topic_name: 'bar',
        });
      const readWriteTopicBarInAnyCachePermission = new PermissionsType({
        topic_permissions: readWriteTopicBarInAnyCache,
      });

      const readWriteTopicCatInCacheDog =
        new PermissionsType.TopicPermissions();
      readWriteTopicCatInCacheDog.role = grpcTopicRole.TopicReadWrite;
      readWriteTopicCatInCacheDog.cache_selector =
        new PermissionsType.CacheSelector({
          cache_name: 'dog',
        });
      readWriteTopicCatInCacheDog.topic_selector =
        new PermissionsType.TopicSelector({
          topic_name: 'cat',
        });
      const readWriteTopicCatInCacheDogPermission = new PermissionsType();
      readWriteTopicCatInCacheDogPermission.topic_permissions =
        readWriteTopicCatInCacheDog;

      const explicitPermissions = new ExplicitPermissions();
      explicitPermissions.permissions = [
        readAnyCachePermission,
        writeCacheFooPermission,
        readAnyTopicPermission,
        readWriteAnyTopicInCacheFooPermission,
        readWriteTopicBarInAnyCachePermission,
        readWriteTopicCatInCacheDogPermission,
      ];

      const grpcPermission = new grpcPermissions();
      grpcPermission.explicit = explicitPermissions;
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

      expect(permissionsFromScope(cacheAndTopicPermissions)).toEqual(
        grpcPermissions
      );
    });
  });
});
