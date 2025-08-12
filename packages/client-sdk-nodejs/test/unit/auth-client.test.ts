import {InternalSuperUserPermissions} from '@gomomento/sdk-core/dist/src/internal/utils';
import {
  AllCaches,
  AllDataReadWrite,
  AllTopics,
  CacheRole,
  Permissions,
  TopicRole,
} from '@gomomento/sdk-core';
import {
  permissionsFromTokenScope,
  permissionsFromDisposableTokenScope,
} from '../../src/internal/internal-auth-client';
import {permission_messages} from '@gomomento/generated-types/dist/permissionmessages';
import {DisposableTokenCachePermissions} from '@gomomento/sdk-core/dist/src/auth/tokens/disposable-token-scope';
import {convert} from '../../src/internal/utils';
import {
  AllFunctions,
  FunctionRole,
} from '@gomomento/sdk-core/dist/src/auth/tokens/permission-scope';

describe('internal auth client', () => {
  describe('permissionsFromScope', () => {
    it('creates expected grpc permissions for InternalSuperUser permissions class', () => {
      const expectedPermission = new permission_messages.Permissions();
      expectedPermission.super_user =
        permission_messages.SuperUserPermissions.SuperUser;
      expect(
        permissionsFromTokenScope(new InternalSuperUserPermissions())
      ).toEqual(expectedPermission);
    });

    it('creates expected grpc permissions for AllDataReadWrite', () => {
      const topicPermissions =
        new permission_messages.PermissionsType.TopicPermissions();
      topicPermissions.role = permission_messages.TopicRole.TopicReadWrite;
      topicPermissions.all_caches =
        new permission_messages.PermissionsType.All();
      topicPermissions.all_topics =
        new permission_messages.PermissionsType.All();
      const topicPermissionType = new permission_messages.PermissionsType();
      topicPermissionType.topic_permissions = topicPermissions;

      const cachePermissions =
        new permission_messages.PermissionsType.CachePermissions();
      cachePermissions.role = permission_messages.CacheRole.CacheReadWrite;
      cachePermissions.all_caches =
        new permission_messages.PermissionsType.All();
      const cachePermissionType = new permission_messages.PermissionsType();
      cachePermissionType.cache_permissions = cachePermissions;

      const functionPermissions =
        new permission_messages.PermissionsType.FunctionPermissions();
      functionPermissions.role =
        permission_messages.FunctionRole.FunctionInvoke;
      functionPermissions.all_caches =
        new permission_messages.PermissionsType.All();
      functionPermissions.all_functions =
        new permission_messages.PermissionsType.All();

      const functionPermissionsType = new permission_messages.PermissionsType();
      functionPermissionsType.function_permissions = functionPermissions;

      const explicitPermissions = new permission_messages.ExplicitPermissions();
      explicitPermissions.permissions = [
        cachePermissionType,
        topicPermissionType,
        functionPermissionsType,
      ];

      const grpcPermissions = new permission_messages.Permissions();
      grpcPermissions.explicit = explicitPermissions;
      expect(permissionsFromTokenScope(AllDataReadWrite)).toEqual(
        grpcPermissions
      );
    });

    it('creates expected grpc permissions for function invoke on all caches and all functions', () => {
      const functionPermissions =
        new permission_messages.PermissionsType.FunctionPermissions();
      functionPermissions.role =
        permission_messages.FunctionRole.FunctionInvoke;
      functionPermissions.all_caches =
        new permission_messages.PermissionsType.All();
      functionPermissions.all_functions =
        new permission_messages.PermissionsType.All();

      const functionPermissionType = new permission_messages.PermissionsType();
      functionPermissionType.function_permissions = functionPermissions;

      const explicitPermissions = new permission_messages.ExplicitPermissions();
      explicitPermissions.permissions = [functionPermissionType];

      const grpcPermissions = new permission_messages.Permissions();
      grpcPermissions.explicit = explicitPermissions;

      const functionOnlyPermissions: Permissions = {
        permissions: [
          {
            role: FunctionRole.FunctionInvoke,
            cache: AllCaches,
            func: AllFunctions,
          },
        ],
      };

      expect(permissionsFromTokenScope(functionOnlyPermissions)).toEqual(
        grpcPermissions
      );
    });

    it('creates expected grpc permissions for function invoke on specific cache and function', () => {
      const functionPermissions =
        new permission_messages.PermissionsType.FunctionPermissions();
      functionPermissions.role =
        permission_messages.FunctionRole.FunctionInvoke;
      functionPermissions.cache_selector =
        new permission_messages.PermissionsType.CacheSelector({
          cache_name: 'my-cache',
        });
      functionPermissions.function_selector =
        new permission_messages.PermissionsType.FunctionSelector({
          function_name: 'my-func',
        });

      const functionPermissionType = new permission_messages.PermissionsType();
      functionPermissionType.function_permissions = functionPermissions;

      const explicitPermissions = new permission_messages.ExplicitPermissions();
      explicitPermissions.permissions = [functionPermissionType];

      const grpcPermissions = new permission_messages.Permissions();
      grpcPermissions.explicit = explicitPermissions;

      const functionOnlyPermissions: Permissions = {
        permissions: [
          {
            role: FunctionRole.FunctionInvoke,
            cache: {name: 'my-cache'},
            func: 'my-func',
          },
        ],
      };

      expect(permissionsFromTokenScope(functionOnlyPermissions)).toEqual(
        grpcPermissions
      );
    });

    it('creates expected grpc permissions for function permit none on all caches and all functions', () => {
      const functionPermissions =
        new permission_messages.PermissionsType.FunctionPermissions();
      functionPermissions.role =
        permission_messages.FunctionRole.FunctionPermitNone;
      functionPermissions.all_caches =
        new permission_messages.PermissionsType.All();
      functionPermissions.all_functions =
        new permission_messages.PermissionsType.All();

      const functionPermissionType = new permission_messages.PermissionsType();
      functionPermissionType.function_permissions = functionPermissions;

      const explicitPermissions = new permission_messages.ExplicitPermissions();
      explicitPermissions.permissions = [functionPermissionType];

      const grpcPermissions = new permission_messages.Permissions();
      grpcPermissions.explicit = explicitPermissions;

      const functionOnlyPermissions: Permissions = {
        permissions: [
          {
            role: FunctionRole.FunctionPermitNone,
            cache: AllCaches,
            func: AllFunctions,
          },
        ],
      };

      expect(permissionsFromTokenScope(functionOnlyPermissions)).toEqual(
        grpcPermissions
      );
    });

    it('creates expected grpc permissions for function invoke with function name prefix', () => {
      const functionPermissions =
        new permission_messages.PermissionsType.FunctionPermissions();
      functionPermissions.role =
        permission_messages.FunctionRole.FunctionInvoke;
      functionPermissions.cache_selector =
        new permission_messages.PermissionsType.CacheSelector({
          cache_name: 'prefix-cache',
        });
      functionPermissions.function_selector =
        new permission_messages.PermissionsType.FunctionSelector({
          function_name_prefix: 'prefix-',
        });

      const functionPermissionType = new permission_messages.PermissionsType();
      functionPermissionType.function_permissions = functionPermissions;

      const explicitPermissions = new permission_messages.ExplicitPermissions();
      explicitPermissions.permissions = [functionPermissionType];

      const grpcPermissions = new permission_messages.Permissions();
      grpcPermissions.explicit = explicitPermissions;

      const functionOnlyPermissions: Permissions = {
        permissions: [
          {
            role: FunctionRole.FunctionInvoke,
            cache: {name: 'prefix-cache'},
            func: {namePrefix: 'prefix-'},
          },
        ],
      };

      expect(permissionsFromTokenScope(functionOnlyPermissions)).toEqual(
        grpcPermissions
      );
    });

    it('creates expected grpc permissions for cache and topic specific permissions', () => {
      const readAnyCache =
        new permission_messages.PermissionsType.CachePermissions();
      readAnyCache.role = permission_messages.CacheRole.CacheReadOnly;
      readAnyCache.all_caches = new permission_messages.PermissionsType.All();
      const readAnyCachePermission = new permission_messages.PermissionsType({
        cache_permissions: readAnyCache,
      });

      const writeCacheFoo =
        new permission_messages.PermissionsType.CachePermissions();
      writeCacheFoo.role = permission_messages.CacheRole.CacheReadWrite;
      writeCacheFoo.cache_selector =
        new permission_messages.PermissionsType.CacheSelector({
          cache_name: 'foo',
        });
      const writeCacheFooPermission = new permission_messages.PermissionsType();
      writeCacheFooPermission.cache_permissions = writeCacheFoo;

      const readAnyTopic =
        new permission_messages.PermissionsType.TopicPermissions();
      readAnyTopic.role = permission_messages.TopicRole.TopicReadOnly;
      readAnyTopic.all_caches = new permission_messages.PermissionsType.All();
      readAnyTopic.all_topics = new permission_messages.PermissionsType.All();
      const readAnyTopicPermission = new permission_messages.PermissionsType({
        topic_permissions: readAnyTopic,
      });

      const readWriteAnyTopicInCacheFoo =
        new permission_messages.PermissionsType.TopicPermissions();
      readWriteAnyTopicInCacheFoo.role =
        permission_messages.TopicRole.TopicReadWrite;
      readWriteAnyTopicInCacheFoo.cache_selector =
        new permission_messages.PermissionsType.CacheSelector({
          cache_name: 'foo',
        });
      readWriteAnyTopicInCacheFoo.all_topics =
        new permission_messages.PermissionsType.All();
      const readWriteAnyTopicInCacheFooPermission =
        new permission_messages.PermissionsType({
          topic_permissions: readWriteAnyTopicInCacheFoo,
        });

      const readWriteTopicBarInAnyCache =
        new permission_messages.PermissionsType.TopicPermissions();
      readWriteTopicBarInAnyCache.role =
        permission_messages.TopicRole.TopicReadWrite;
      readWriteTopicBarInAnyCache.all_caches =
        new permission_messages.PermissionsType.All();
      readWriteTopicBarInAnyCache.topic_selector =
        new permission_messages.PermissionsType.TopicSelector({
          topic_name: 'bar',
        });
      const readWriteTopicBarInAnyCachePermission =
        new permission_messages.PermissionsType({
          topic_permissions: readWriteTopicBarInAnyCache,
        });

      const readWriteTopicCatInCacheDog =
        new permission_messages.PermissionsType.TopicPermissions();
      readWriteTopicCatInCacheDog.role =
        permission_messages.TopicRole.TopicReadWrite;
      readWriteTopicCatInCacheDog.cache_selector =
        new permission_messages.PermissionsType.CacheSelector({
          cache_name: 'dog',
        });
      readWriteTopicCatInCacheDog.topic_selector =
        new permission_messages.PermissionsType.TopicSelector({
          topic_name: 'cat',
        });
      const readWriteTopicCatInCacheDogPermission =
        new permission_messages.PermissionsType();
      readWriteTopicCatInCacheDogPermission.topic_permissions =
        readWriteTopicCatInCacheDog;

      const explicitPermissions = new permission_messages.ExplicitPermissions();
      explicitPermissions.permissions = [
        readAnyCachePermission,
        writeCacheFooPermission,
        readAnyTopicPermission,
        readWriteAnyTopicInCacheFooPermission,
        readWriteTopicBarInAnyCachePermission,
        readWriteTopicCatInCacheDogPermission,
      ];

      const grpcPermissions = new permission_messages.Permissions();
      grpcPermissions.explicit = explicitPermissions;
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

      expect(permissionsFromTokenScope(cacheAndTopicPermissions)).toEqual(
        grpcPermissions
      );
    });

    it('creates expected grpc permissions for write-only cache and topic permissions', () => {
      // Construct permissions to match {role: CacheRole.WriteOnly, cache: AllCaches}
      const cachePermissions =
        new permission_messages.PermissionsType.CachePermissions();
      cachePermissions.role = permission_messages.CacheRole.CacheWriteOnly;
      cachePermissions.all_caches =
        new permission_messages.PermissionsType.All();
      const cachePermissionType = new permission_messages.PermissionsType({
        cache_permissions: cachePermissions,
      });

      // Construct permissions to match {role: CacheRole.WriteOnly, cache: {name: 'foo'}}
      const cacheFooPermissions =
        new permission_messages.PermissionsType.CachePermissions();
      cacheFooPermissions.role = permission_messages.CacheRole.CacheWriteOnly;
      cacheFooPermissions.cache_selector =
        new permission_messages.PermissionsType.CacheSelector({
          cache_name: 'foo',
        });
      const cacheFooPermissionType = new permission_messages.PermissionsType({
        cache_permissions: cacheFooPermissions,
      });

      // Construct permissions to match {role: TopicRole.PublishOnly, cache: 'foo', topic: AllTopics}
      const topicPermissions =
        new permission_messages.PermissionsType.TopicPermissions();
      topicPermissions.role = permission_messages.TopicRole.TopicWriteOnly;
      topicPermissions.cache_selector =
        new permission_messages.PermissionsType.CacheSelector({
          cache_name: 'foo',
        });
      topicPermissions.all_topics =
        new permission_messages.PermissionsType.All();
      const topicPermissionType = new permission_messages.PermissionsType({
        topic_permissions: topicPermissions,
      });

      // Construct permissions to match {role: TopicRole.PublishOnly, cache: AllCaches, topic: {name: 'bar'}
      const topicAllCachesBarTopic =
        new permission_messages.PermissionsType.TopicPermissions();
      topicAllCachesBarTopic.role =
        permission_messages.TopicRole.TopicWriteOnly;
      topicAllCachesBarTopic.all_caches =
        new permission_messages.PermissionsType.All();
      topicAllCachesBarTopic.topic_selector =
        new permission_messages.PermissionsType.TopicSelector({
          topic_name: 'bar',
        });
      const topicAllCachesBarTopicPermission =
        new permission_messages.PermissionsType({
          topic_permissions: topicAllCachesBarTopic,
        });

      // Construct permissions to match {role: TopicRole.PublishOnly, cache: 'dog', topic: 'cat'}
      const topicDogCacheCatTopic =
        new permission_messages.PermissionsType.TopicPermissions();
      topicDogCacheCatTopic.role = permission_messages.TopicRole.TopicWriteOnly;
      topicDogCacheCatTopic.cache_selector =
        new permission_messages.PermissionsType.CacheSelector({
          cache_name: 'dog',
        });
      topicDogCacheCatTopic.topic_selector =
        new permission_messages.PermissionsType.TopicSelector({
          topic_name: 'cat',
        });
      const topicDogCacheCatTopicPermission =
        new permission_messages.PermissionsType({
          topic_permissions: topicDogCacheCatTopic,
        });

      const explicitPermissions = new permission_messages.ExplicitPermissions();
      explicitPermissions.permissions = [
        cachePermissionType,
        cacheFooPermissionType,
        topicPermissionType,
        topicAllCachesBarTopicPermission,
        topicDogCacheCatTopicPermission,
      ];

      const grpcPermissions = new permission_messages.Permissions();
      grpcPermissions.explicit = explicitPermissions;

      const cacheAndTopicPermissions: Permissions = {
        permissions: [
          {role: CacheRole.WriteOnly, cache: AllCaches},
          {role: CacheRole.WriteOnly, cache: {name: 'foo'}},
          {role: TopicRole.PublishOnly, cache: 'foo', topic: AllTopics},
          {
            role: TopicRole.PublishOnly,
            cache: AllCaches,
            topic: {name: 'bar'},
          },
          {role: TopicRole.PublishOnly, cache: 'dog', topic: 'cat'},
        ],
      };

      expect(permissionsFromTokenScope(cacheAndTopicPermissions)).toEqual(
        grpcPermissions
      );
    });

    it('creates expected grpc permissions for key-specific, write-only cache permissions', () => {
      // Construct permissions to match {role: CacheRole.WriteOnly, cache: AllCaches, item: "specific-key"}
      const oneKeyAllCaches =
        new permission_messages.PermissionsType.CachePermissions();
      oneKeyAllCaches.role = permission_messages.CacheRole.CacheWriteOnly;
      oneKeyAllCaches.all_caches =
        new permission_messages.PermissionsType.All();
      oneKeyAllCaches.item_selector =
        new permission_messages.PermissionsType.CacheItemSelector({
          key: convert('specific-key'),
        });
      const oneKeyAllCachesPermissions =
        new permission_messages.PermissionsType({
          cache_permissions: oneKeyAllCaches,
        });

      // Construct permissions to match {role: CacheRole.WriteOnly, cache: {name: 'foo'}, item: "key-prefix"}
      const keyPrefixOneCache =
        new permission_messages.PermissionsType.CachePermissions();
      keyPrefixOneCache.role = permission_messages.CacheRole.CacheWriteOnly;
      keyPrefixOneCache.cache_selector =
        new permission_messages.PermissionsType.CacheSelector({
          cache_name: 'foo',
        });
      keyPrefixOneCache.item_selector =
        new permission_messages.PermissionsType.CacheItemSelector({
          key_prefix: convert('key-prefix'),
        });
      const keyPrefixOneCachePermissions =
        new permission_messages.PermissionsType({
          cache_permissions: keyPrefixOneCache,
        });

      const explicitPermissions = new permission_messages.ExplicitPermissions();
      explicitPermissions.permissions = [
        oneKeyAllCachesPermissions,
        keyPrefixOneCachePermissions,
      ];

      const grpcPermissions = new permission_messages.Permissions();
      grpcPermissions.explicit = explicitPermissions;

      const cacheAndItemPermissions: DisposableTokenCachePermissions = {
        permissions: [
          {
            role: CacheRole.WriteOnly,
            cache: AllCaches,
            item: {key: 'specific-key'},
          },
          {
            role: CacheRole.WriteOnly,
            cache: {name: 'foo'},
            item: {keyPrefix: 'key-prefix'},
          },
        ],
      };

      expect(
        permissionsFromDisposableTokenScope(cacheAndItemPermissions)
      ).toEqual(grpcPermissions);
    });

    it('creates expected grpc permissions for key-specific, read-only cache permissions', () => {
      // Construct permissions to match {role: CacheRole.WriteOnly, cache: AllCaches, item: "specific-key"}
      const oneKeyAllCaches =
        new permission_messages.PermissionsType.CachePermissions();
      oneKeyAllCaches.role = permission_messages.CacheRole.CacheReadOnly;
      oneKeyAllCaches.all_caches =
        new permission_messages.PermissionsType.All();
      oneKeyAllCaches.item_selector =
        new permission_messages.PermissionsType.CacheItemSelector({
          key: convert('specific-key'),
        });
      const oneKeyAllCachesPermissions =
        new permission_messages.PermissionsType({
          cache_permissions: oneKeyAllCaches,
        });

      // Construct permissions to match {role: CacheRole.WriteOnly, cache: {name: 'foo'}, item: "key-prefix"}
      const keyPrefixOneCache =
        new permission_messages.PermissionsType.CachePermissions();
      keyPrefixOneCache.role = permission_messages.CacheRole.CacheReadOnly;
      keyPrefixOneCache.cache_selector =
        new permission_messages.PermissionsType.CacheSelector({
          cache_name: 'foo',
        });
      keyPrefixOneCache.item_selector =
        new permission_messages.PermissionsType.CacheItemSelector({
          key_prefix: convert('key-prefix'),
        });
      const keyPrefixOneCachePermissions =
        new permission_messages.PermissionsType({
          cache_permissions: keyPrefixOneCache,
        });

      const explicitPermissions = new permission_messages.ExplicitPermissions();
      explicitPermissions.permissions = [
        oneKeyAllCachesPermissions,
        keyPrefixOneCachePermissions,
      ];

      const grpcPermissions = new permission_messages.Permissions();
      grpcPermissions.explicit = explicitPermissions;

      const cacheAndItemPermissions: DisposableTokenCachePermissions = {
        permissions: [
          {
            role: CacheRole.ReadOnly,
            cache: AllCaches,
            item: {key: 'specific-key'},
          },
          {
            role: CacheRole.ReadOnly,
            cache: {name: 'foo'},
            item: {keyPrefix: 'key-prefix'},
          },
        ],
      };
      expect(
        permissionsFromDisposableTokenScope(cacheAndItemPermissions)
      ).toEqual(grpcPermissions);
    });

    it('creates expected grpc permissions for key-specific, read-write cache permissions', () => {
      // Construct permissions to match {role: CacheRole.WriteOnly, cache: AllCaches, item: "specific-key"}
      const oneKeyAllCaches =
        new permission_messages.PermissionsType.CachePermissions();
      oneKeyAllCaches.role = permission_messages.CacheRole.CacheReadWrite;
      oneKeyAllCaches.all_caches =
        new permission_messages.PermissionsType.All();
      oneKeyAllCaches.item_selector =
        new permission_messages.PermissionsType.CacheItemSelector({
          key: convert('specific-key'),
        });
      const oneKeyAllCachesPermissions =
        new permission_messages.PermissionsType({
          cache_permissions: oneKeyAllCaches,
        });

      // Construct permissions to match {role: CacheRole.WriteOnly, cache: {name: 'foo'}, item: "key-prefix"}
      const keyPrefixOneCache =
        new permission_messages.PermissionsType.CachePermissions();
      keyPrefixOneCache.role = permission_messages.CacheRole.CacheReadWrite;
      keyPrefixOneCache.cache_selector =
        new permission_messages.PermissionsType.CacheSelector({
          cache_name: 'foo',
        });
      keyPrefixOneCache.item_selector =
        new permission_messages.PermissionsType.CacheItemSelector({
          key_prefix: convert('key-prefix'),
        });
      const keyPrefixOneCachePermissions =
        new permission_messages.PermissionsType({
          cache_permissions: keyPrefixOneCache,
        });

      const explicitPermissions = new permission_messages.ExplicitPermissions();
      explicitPermissions.permissions = [
        oneKeyAllCachesPermissions,
        keyPrefixOneCachePermissions,
      ];

      const grpcPermissions = new permission_messages.Permissions();
      grpcPermissions.explicit = explicitPermissions;

      const cacheAndItemPermissions: DisposableTokenCachePermissions = {
        permissions: [
          {
            role: CacheRole.ReadWrite,
            cache: AllCaches,
            item: {key: 'specific-key'},
          },
          {
            role: CacheRole.ReadWrite,
            cache: {name: 'foo'},
            item: {keyPrefix: 'key-prefix'},
          },
        ],
      };
      expect(
        permissionsFromDisposableTokenScope(cacheAndItemPermissions)
      ).toEqual(grpcPermissions);
    });
  });
});
