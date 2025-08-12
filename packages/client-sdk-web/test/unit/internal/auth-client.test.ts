import {permissionsFromScope} from '../../../src/internal/auth-client';
import {InternalSuperUserPermissions} from '@gomomento/sdk-core/dist/src/internal/utils';
import {
  ExplicitPermissions,
  Permissions as GrpcPermissions,
  PermissionsType,
  SuperUserPermissions,
  TopicRole as GrpcTopicRole,
  CacheRole as GrpcCacheRole,
  FunctionRole as GrpcFunctionRole,
} from '@gomomento/generated-types-webtext/dist/permissionmessages_pb';
import {
  AllCaches,
  AllDataReadWrite,
  AllTopics,
  CacheRole,
  Permissions,
  TopicRole,
} from '@gomomento/sdk-core';
import {DisposableTokenCachePermissions} from '@gomomento/sdk-core/dist/src/auth/tokens/disposable-token-scope';
import {convertToB64String} from '../../../src/utils/web-client-utils';
import {
  AllFunctions,
  FunctionRole,
} from '@gomomento/sdk-core/dist/src/auth/tokens/permission-scope';

describe('internal auth client', () => {
  describe('permissionsFromScope', () => {
    it('creates expected grpc permissions for InternalSuperUser permissions class', () => {
      const expectedPermission = new GrpcPermissions();
      expectedPermission.setSuperUser(SuperUserPermissions.SUPERUSER);
      expect(permissionsFromScope(new InternalSuperUserPermissions())).toEqual(
        expectedPermission
      );
    });

    it('creates expected grpc permissions for AllDataReadWrite', () => {
      const topicPermissions = new PermissionsType.TopicPermissions();
      topicPermissions.setRole(GrpcTopicRole.TOPICREADWRITE);
      topicPermissions.setAllCaches(new PermissionsType.All());
      topicPermissions.setAllTopics(new PermissionsType.All());
      const topicPermissionType = new PermissionsType();
      topicPermissionType.setTopicPermissions(topicPermissions);

      const cachePermissions = new PermissionsType.CachePermissions();
      cachePermissions.setRole(GrpcCacheRole.CACHEREADWRITE);
      cachePermissions.setAllCaches(new PermissionsType.All());
      const cachePermissionType = new PermissionsType();
      cachePermissionType.setCachePermissions(cachePermissions);

      const functionPermissions = new PermissionsType.FunctionPermissions();
      functionPermissions.setRole(GrpcFunctionRole.FUNCTIONINVOKE);
      functionPermissions.setAllCaches(new PermissionsType.All());
      functionPermissions.setAllFunctions(new PermissionsType.All());
      const functionPermissionsType = new PermissionsType();
      functionPermissionsType.setFunctionPermissions(functionPermissions);

      const explicitPermissions = new ExplicitPermissions();
      explicitPermissions.setPermissionsList([
        cachePermissionType,
        topicPermissionType,
        functionPermissionsType,
      ]);

      const grpcPermissions = new GrpcPermissions();
      grpcPermissions.setExplicit(explicitPermissions);
      expect(permissionsFromScope(AllDataReadWrite)).toEqual(grpcPermissions);
    });

    it('creates expected grpc permissions for function invoke on all caches and all functions', () => {
      const functionInvoke = new PermissionsType.FunctionPermissions();
      functionInvoke.setRole(GrpcFunctionRole.FUNCTIONINVOKE);
      functionInvoke.setAllCaches(new PermissionsType.All());
      functionInvoke.setAllFunctions(new PermissionsType.All());

      const functionPermissionsType = new PermissionsType();
      functionPermissionsType.setFunctionPermissions(functionInvoke);

      const explicitPermissions = new ExplicitPermissions();
      explicitPermissions.setPermissionsList([functionPermissionsType]);

      const grpcPermissions = new GrpcPermissions();
      grpcPermissions.setExplicit(explicitPermissions);

      const functionPermissions: Permissions = {
        permissions: [
          {
            role: FunctionRole.FunctionInvoke,
            cache: AllCaches,
            func: AllFunctions,
          },
        ],
      };

      expect(permissionsFromScope(functionPermissions)).toEqual(
        grpcPermissions
      );
    });

    it('creates expected grpc permissions for function invoke on specific cache and function', () => {
      const functionInvoke = new PermissionsType.FunctionPermissions();
      functionInvoke.setRole(GrpcFunctionRole.FUNCTIONINVOKE);
      const cacheSelector = new PermissionsType.CacheSelector();
      cacheSelector.setCacheName('foo');
      functionInvoke.setCacheSelector(cacheSelector);

      const functionSelector = new PermissionsType.FunctionSelector();
      functionSelector.setFunctionName('foo');
      functionInvoke.setFunctionSelector(functionSelector);

      const functionPermissionsType = new PermissionsType();
      functionPermissionsType.setFunctionPermissions(functionInvoke);

      const explicitPermissions = new ExplicitPermissions();
      explicitPermissions.setPermissionsList([functionPermissionsType]);

      const grpcPermissions = new GrpcPermissions();
      grpcPermissions.setExplicit(explicitPermissions);

      const functionPermissions: Permissions = {
        permissions: [
          {role: FunctionRole.FunctionInvoke, cache: 'foo', func: 'foo'},
        ],
      };

      expect(permissionsFromScope(functionPermissions)).toEqual(
        grpcPermissions
      );
    });

    it('creates expected grpc permissions for function permit none on all caches and all functions', () => {
      const functionPermitNone = new PermissionsType.FunctionPermissions();
      functionPermitNone.setRole(GrpcFunctionRole.FUNCTIONPERMITNONE);
      functionPermitNone.setAllCaches(new PermissionsType.All());
      functionPermitNone.setAllFunctions(new PermissionsType.All());

      const functionPermissionsType = new PermissionsType();
      functionPermissionsType.setFunctionPermissions(functionPermitNone);

      const explicitPermissions = new ExplicitPermissions();
      explicitPermissions.setPermissionsList([functionPermissionsType]);

      const grpcPermissions = new GrpcPermissions();
      grpcPermissions.setExplicit(explicitPermissions);

      const functionPermissions: Permissions = {
        permissions: [
          {
            role: FunctionRole.FunctionPermitNone,
            cache: AllCaches,
            func: AllFunctions,
          },
        ],
      };

      expect(permissionsFromScope(functionPermissions)).toEqual(
        grpcPermissions
      );
    });

    it('creates expected grpc permissions for function invoke with function name prefix', () => {
      const functionInvoke = new PermissionsType.FunctionPermissions();
      functionInvoke.setRole(GrpcFunctionRole.FUNCTIONINVOKE);
      const cacheSelector = new PermissionsType.CacheSelector();
      cacheSelector.setCacheName('foo');
      functionInvoke.setCacheSelector(cacheSelector);

      const functionSelector = new PermissionsType.FunctionSelector();
      functionSelector.setFunctionNamePrefix('fooo');
      functionInvoke.setFunctionSelector(functionSelector);

      const functionPermissionsType = new PermissionsType();
      functionPermissionsType.setFunctionPermissions(functionInvoke);

      const explicitPermissions = new ExplicitPermissions();
      explicitPermissions.setPermissionsList([functionPermissionsType]);

      const grpcPermissions = new GrpcPermissions();
      grpcPermissions.setExplicit(explicitPermissions);

      const functionPermissions: Permissions = {
        permissions: [
          {
            role: FunctionRole.FunctionInvoke,
            cache: 'foo',
            func: {namePrefix: 'foo'},
          },
        ],
      };

      expect(permissionsFromScope(functionPermissions)).toEqual(
        grpcPermissions
      );
    });

    it('creates expected grpc permissions for cache and topic specific permissions', () => {
      const readAnyCache = new PermissionsType.CachePermissions();
      readAnyCache.setRole(GrpcCacheRole.CACHEREADONLY);
      readAnyCache.setAllCaches(new PermissionsType.All());

      const readAnyCachePermission = new PermissionsType();
      readAnyCachePermission.setCachePermissions(readAnyCache);

      const writeCacheFoo = new PermissionsType.CachePermissions();
      writeCacheFoo.setRole(GrpcCacheRole.CACHEREADWRITE);
      const writeFooCacheSelector = new PermissionsType.CacheSelector();
      writeFooCacheSelector.setCacheName('foo');
      writeCacheFoo.setCacheSelector(writeFooCacheSelector);
      const writeCacheFooPermission = new PermissionsType();
      writeCacheFooPermission.setCachePermissions(writeCacheFoo);

      const readAnyTopic = new PermissionsType.TopicPermissions();
      readAnyTopic.setRole(GrpcTopicRole.TOPICREADONLY);
      readAnyTopic.setAllCaches(new PermissionsType.All());
      readAnyTopic.setAllTopics(new PermissionsType.All());
      const readAnyTopicPermission = new PermissionsType();
      readAnyTopicPermission.setTopicPermissions(readAnyTopic);

      const readWriteAnyTopicInCacheFoo =
        new PermissionsType.TopicPermissions();
      readWriteAnyTopicInCacheFoo.setRole(GrpcTopicRole.TOPICREADWRITE);
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
      readWriteTopicBarInAnyCache.setRole(GrpcTopicRole.TOPICREADWRITE);
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
      readWriteTopicCatInCacheDog.setRole(GrpcTopicRole.TOPICREADWRITE);
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

      const grpcPermissions = new GrpcPermissions();
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

      expect(permissionsFromScope(cacheAndTopicPermissions)).toEqual(
        grpcPermissions
      );
    });

    it('creates expected grpc permissions for write-only cache and topic permissions', () => {
      // Construct permissions to match {role: CacheRole.WriteOnly, cache: AllCaches}
      const cachePermissions = new PermissionsType.CachePermissions();
      cachePermissions.setRole(GrpcCacheRole.CACHEWRITEONLY);
      cachePermissions.setAllCaches(new PermissionsType.All());
      const cachePermissionType = new PermissionsType();
      cachePermissionType.setCachePermissions(cachePermissions);

      // Construct permissions to match {role: CacheRole.WriteOnly, cache: {name: 'foo'}}
      const cacheFooPermissions = new PermissionsType.CachePermissions();
      cacheFooPermissions.setRole(GrpcCacheRole.CACHEWRITEONLY);
      const cacheFooPermissionsCacheSelector =
        new PermissionsType.CacheSelector();
      cacheFooPermissionsCacheSelector.setCacheName('foo');
      cacheFooPermissions.setCacheSelector(cacheFooPermissionsCacheSelector);
      const cacheFooPermissionType = new PermissionsType();
      cacheFooPermissionType.setCachePermissions(cacheFooPermissions);

      // Construct permissions to match {role: TopicRole.PublishOnly, cache: 'foo', topic: AllTopics}
      const topicPermissions = new PermissionsType.TopicPermissions();
      topicPermissions.setRole(GrpcTopicRole.TOPICWRITEONLY);
      const topicPermissionsCacheSelector = new PermissionsType.CacheSelector();
      topicPermissionsCacheSelector.setCacheName('foo');
      topicPermissions.setCacheSelector(topicPermissionsCacheSelector);
      topicPermissions.setAllTopics(new PermissionsType.All());
      const topicPermissionType = new PermissionsType();
      topicPermissionType.setTopicPermissions(topicPermissions);

      // Construct permissions to match {role: TopicRole.PublishOnly, cache: AllCaches, topic: {name: 'bar'}
      const topicAllCachesBarTopic = new PermissionsType.TopicPermissions();
      topicAllCachesBarTopic.setRole(GrpcTopicRole.TOPICWRITEONLY);
      topicAllCachesBarTopic.setAllCaches(new PermissionsType.All());
      const topicAllCachesBarTopicTopicSelector =
        new PermissionsType.TopicSelector();
      topicAllCachesBarTopicTopicSelector.setTopicName('bar');
      topicAllCachesBarTopic.setTopicSelector(
        topicAllCachesBarTopicTopicSelector
      );
      const topicAllCachesBarTopicPermission = new PermissionsType();
      topicAllCachesBarTopicPermission.setTopicPermissions(
        topicAllCachesBarTopic
      );

      // Construct permissions to match {role: TopicRole.PublishOnly, cache: 'dog', topic: 'cat'}
      const topicDogCacheCatTopic = new PermissionsType.TopicPermissions();
      topicDogCacheCatTopic.setRole(GrpcTopicRole.TOPICWRITEONLY);
      const topicDogCacheCatTopicCacheSelector =
        new PermissionsType.CacheSelector();
      topicDogCacheCatTopicCacheSelector.setCacheName('dog');
      topicDogCacheCatTopic.setCacheSelector(
        topicDogCacheCatTopicCacheSelector
      );
      const topicDogCacheCatTopicTopicSelector =
        new PermissionsType.TopicSelector();
      topicDogCacheCatTopicTopicSelector.setTopicName('cat');
      topicDogCacheCatTopic.setTopicSelector(
        topicDogCacheCatTopicTopicSelector
      );
      const topicDogCacheCatTopicPermission = new PermissionsType();
      topicDogCacheCatTopicPermission.setTopicPermissions(
        topicDogCacheCatTopic
      );

      const explicitPermissions = new ExplicitPermissions();
      explicitPermissions.setPermissionsList([
        cachePermissionType,
        cacheFooPermissionType,
        topicPermissionType,
        topicAllCachesBarTopicPermission,
        topicDogCacheCatTopicPermission,
      ]);

      const grpcPermissions = new GrpcPermissions();
      grpcPermissions.setExplicit(explicitPermissions);

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

      expect(permissionsFromScope(cacheAndTopicPermissions)).toEqual(
        grpcPermissions
      );
    });

    it('creates expected grpc permissions for key-specific, write-only cache permissions', () => {
      // Construct permissions to match {role: CacheRole.WriteOnly, cache: AllCaches, item: "specific-key"}
      const oneKeyAllCaches = new PermissionsType.CachePermissions();
      oneKeyAllCaches.setRole(GrpcCacheRole.CACHEWRITEONLY);
      oneKeyAllCaches.setAllCaches(new PermissionsType.All());
      const itemSelector = new PermissionsType.CacheItemSelector();
      itemSelector.setKey(convertToB64String('specific-key'));
      oneKeyAllCaches.setItemSelector(itemSelector);
      const oneKeyAllCachesPermissions = new PermissionsType();
      oneKeyAllCachesPermissions.setCachePermissions(oneKeyAllCaches);

      // Construct permissions to match {role: CacheRole.WriteOnly, cache: {name: 'foo'}, item: "key-prefix"}
      const keyPrefixOneCache = new PermissionsType.CachePermissions();
      keyPrefixOneCache.setRole(GrpcCacheRole.CACHEWRITEONLY);
      const cacheSelector = new PermissionsType.CacheSelector();
      cacheSelector.setCacheName('foo');
      keyPrefixOneCache.setCacheSelector(cacheSelector);
      const prefixItemSelector = new PermissionsType.CacheItemSelector();
      prefixItemSelector.setKeyPrefix(convertToB64String('key-prefix'));
      keyPrefixOneCache.setItemSelector(prefixItemSelector);
      const keyPrefixOneCachePermissions = new PermissionsType();
      keyPrefixOneCachePermissions.setCachePermissions(keyPrefixOneCache);

      const explicitPermissions = new ExplicitPermissions();
      explicitPermissions.setPermissionsList([
        oneKeyAllCachesPermissions,
        keyPrefixOneCachePermissions,
      ]);

      const grpcPermissions = new GrpcPermissions();
      grpcPermissions.setExplicit(explicitPermissions);

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

      expect(permissionsFromScope(cacheAndItemPermissions)).toEqual(
        grpcPermissions
      );
    });

    it('creates expected grpc permissions for key-specific, read-only cache permissions', () => {
      // Construct permissions to match {role: CacheRole.ReadOnly, cache: AllCaches, item: "specific-key"}
      const oneKeyAllCaches = new PermissionsType.CachePermissions();
      oneKeyAllCaches.setRole(GrpcCacheRole.CACHEREADONLY);
      oneKeyAllCaches.setAllCaches(new PermissionsType.All());
      const itemSelector = new PermissionsType.CacheItemSelector();
      itemSelector.setKey(convertToB64String('specific-key'));
      oneKeyAllCaches.setItemSelector(itemSelector);
      const oneKeyAllCachesPermissions = new PermissionsType();
      oneKeyAllCachesPermissions.setCachePermissions(oneKeyAllCaches);

      // Construct permissions to match {role: CacheRole.ReadOnly, cache: {name: 'foo'}, item: "key-prefix"}
      const keyPrefixOneCache = new PermissionsType.CachePermissions();
      keyPrefixOneCache.setRole(GrpcCacheRole.CACHEREADONLY);
      const cacheSelector = new PermissionsType.CacheSelector();
      cacheSelector.setCacheName('foo');
      keyPrefixOneCache.setCacheSelector(cacheSelector);
      const prefixItemSelector = new PermissionsType.CacheItemSelector();
      prefixItemSelector.setKeyPrefix(convertToB64String('key-prefix'));
      keyPrefixOneCache.setItemSelector(prefixItemSelector);
      const keyPrefixOneCachePermissions = new PermissionsType();
      keyPrefixOneCachePermissions.setCachePermissions(keyPrefixOneCache);

      const explicitPermissions = new ExplicitPermissions();
      explicitPermissions.setPermissionsList([
        oneKeyAllCachesPermissions,
        keyPrefixOneCachePermissions,
      ]);

      const grpcPermissions = new GrpcPermissions();
      grpcPermissions.setExplicit(explicitPermissions);

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
      expect(permissionsFromScope(cacheAndItemPermissions)).toEqual(
        grpcPermissions
      );
    });

    it('creates expected grpc permissions for key-specific, read-write cache permissions', () => {
      // Construct permissions to match {role: CacheRole.ReadWrite, cache: AllCaches, item: "specific-key"}
      const oneKeyAllCaches = new PermissionsType.CachePermissions();
      oneKeyAllCaches.setRole(GrpcCacheRole.CACHEREADWRITE);
      oneKeyAllCaches.setAllCaches(new PermissionsType.All());
      const itemSelector = new PermissionsType.CacheItemSelector();
      itemSelector.setKey(convertToB64String('specific-key'));
      oneKeyAllCaches.setItemSelector(itemSelector);
      const oneKeyAllCachesPermissions = new PermissionsType();
      oneKeyAllCachesPermissions.setCachePermissions(oneKeyAllCaches);

      // Construct permissions to match {role: CacheRole.ReadWrite, cache: {name: 'foo'}, item: "key-prefix"}
      const keyPrefixOneCache = new PermissionsType.CachePermissions();
      keyPrefixOneCache.setRole(GrpcCacheRole.CACHEREADWRITE);
      const cacheSelector = new PermissionsType.CacheSelector();
      cacheSelector.setCacheName('foo');
      keyPrefixOneCache.setCacheSelector(cacheSelector);
      const prefixItemSelector = new PermissionsType.CacheItemSelector();
      prefixItemSelector.setKeyPrefix(convertToB64String('key-prefix'));
      keyPrefixOneCache.setItemSelector(prefixItemSelector);
      const keyPrefixOneCachePermissions = new PermissionsType();
      keyPrefixOneCachePermissions.setCachePermissions(keyPrefixOneCache);

      const explicitPermissions = new ExplicitPermissions();
      explicitPermissions.setPermissionsList([
        oneKeyAllCachesPermissions,
        keyPrefixOneCachePermissions,
      ]);

      const grpcPermissions = new GrpcPermissions();
      grpcPermissions.setExplicit(explicitPermissions);

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
      expect(permissionsFromScope(cacheAndItemPermissions)).toEqual(
        grpcPermissions
      );
    });
  });
});
