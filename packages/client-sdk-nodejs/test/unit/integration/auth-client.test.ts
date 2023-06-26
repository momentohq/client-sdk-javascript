import {InternalSuperUserPermissions} from '@gomomento/sdk-core/dist/src/internal/utils';
import {
  AllDataReadWrite,
  All,
  CacheName,
  CachePermission,
  CacheRole,
  Permission,
  Permissions,
  TopicName,
  TopicPermission,
  TopicRole,
} from '@gomomento/sdk-core';
import {auth} from '@gomomento/generated-types/dist/auth';
import _GenerateApiTokenRequest = auth._GenerateApiTokenRequest;
import {permissionsFromScope} from '../../../src/internal/internal-auth-client';
import {InvalidArgumentError} from '@gomomento/sdk-core/dist/src/errors';

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
      topicPermissions.cache =
        new _GenerateApiTokenRequest.PermissionsType.CacheResource({
          all: new _GenerateApiTokenRequest.PermissionsType.All(),
        });
      topicPermissions.topic =
        new _GenerateApiTokenRequest.PermissionsType.TopicResource({
          all: new _GenerateApiTokenRequest.PermissionsType.All(),
        });
      const topicPermissionType =
        new _GenerateApiTokenRequest.PermissionsType();
      topicPermissionType.topic_permissions = topicPermissions;

      const cachePermissions =
        new _GenerateApiTokenRequest.PermissionsType.CachePermissions();
      cachePermissions.role = _GenerateApiTokenRequest.CacheRole.CacheReadWrite;
      cachePermissions.cache =
        new _GenerateApiTokenRequest.PermissionsType.CacheResource({
          all: new _GenerateApiTokenRequest.PermissionsType.All(),
        });
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
      readAnyCache.cache =
        new _GenerateApiTokenRequest.PermissionsType.CacheResource({
          all: new _GenerateApiTokenRequest.PermissionsType.All(),
        });
      const readAnyCachePermission =
        new _GenerateApiTokenRequest.PermissionsType();
      readAnyCachePermission.cache_permissions = readAnyCache;

      const writeCacheFoo =
        new _GenerateApiTokenRequest.PermissionsType.CachePermissions();
      writeCacheFoo.role = _GenerateApiTokenRequest.CacheRole.CacheReadWrite;
      writeCacheFoo.cache =
        new _GenerateApiTokenRequest.PermissionsType.CacheResource({
          cache_name: 'foo',
        });
      const writeCacheFooPermission =
        new _GenerateApiTokenRequest.PermissionsType();
      writeCacheFooPermission.cache_permissions = writeCacheFoo;

      const readAnyTopic =
        new _GenerateApiTokenRequest.PermissionsType.TopicPermissions();
      readAnyTopic.role = _GenerateApiTokenRequest.TopicRole.TopicReadOnly;
      readAnyTopic.cache =
        new _GenerateApiTokenRequest.PermissionsType.CacheResource({
          all: new _GenerateApiTokenRequest.PermissionsType.All(),
        });
      readAnyTopic.topic =
        new _GenerateApiTokenRequest.PermissionsType.TopicResource({
          all: new _GenerateApiTokenRequest.PermissionsType.All(),
        });
      const readAnyTopicPermission =
        new _GenerateApiTokenRequest.PermissionsType();
      readAnyTopicPermission.topic_permissions = readAnyTopic;

      const readWriteAnyTopicInCacheFoo =
        new _GenerateApiTokenRequest.PermissionsType.TopicPermissions();
      readWriteAnyTopicInCacheFoo.role =
        _GenerateApiTokenRequest.TopicRole.TopicReadWrite;
      readWriteAnyTopicInCacheFoo.cache =
        new _GenerateApiTokenRequest.PermissionsType.CacheResource({
          cache_name: 'foo',
        });
      readWriteAnyTopicInCacheFoo.topic =
        new _GenerateApiTokenRequest.PermissionsType.TopicResource({
          all: new _GenerateApiTokenRequest.PermissionsType.All(),
        });
      const readWriteAnyTopicInCacheFooPermission =
        new _GenerateApiTokenRequest.PermissionsType();
      readWriteAnyTopicInCacheFooPermission.topic_permissions =
        readWriteAnyTopicInCacheFoo;

      const readWriteTopicBarInAnyCache =
        new _GenerateApiTokenRequest.PermissionsType.TopicPermissions();
      readWriteTopicBarInAnyCache.role =
        _GenerateApiTokenRequest.TopicRole.TopicReadWrite;
      readWriteTopicBarInAnyCache.cache =
        new _GenerateApiTokenRequest.PermissionsType.CacheResource({
          all: new _GenerateApiTokenRequest.PermissionsType.All(),
        });
      readWriteTopicBarInAnyCache.topic =
        new _GenerateApiTokenRequest.PermissionsType.TopicResource({
          topic_name: 'bar',
        });
      const readWriteTopicBarInAnyCachePermission =
        new _GenerateApiTokenRequest.PermissionsType();
      readWriteTopicBarInAnyCachePermission.topic_permissions =
        readWriteTopicBarInAnyCache;

      const readWriteTopicCatInCacheDog =
        new _GenerateApiTokenRequest.PermissionsType.TopicPermissions();
      readWriteTopicCatInCacheDog.role =
        _GenerateApiTokenRequest.TopicRole.TopicReadWrite;
      readWriteTopicCatInCacheDog.cache =
        new _GenerateApiTokenRequest.PermissionsType.CacheResource({
          cache_name: 'dog',
        });
      readWriteTopicCatInCacheDog.topic =
        new _GenerateApiTokenRequest.PermissionsType.TopicResource({
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
        new CachePermission(CacheRole.ReadOnly, new All()),
        new CachePermission(CacheRole.ReadWrite, new CacheName('foo')),
        new TopicPermission(TopicRole.ReadOnly, new All(), new All()),
        new TopicPermission(
          TopicRole.ReadWrite,
          new CacheName('foo'),
          new All()
        ),
        new TopicPermission(
          TopicRole.ReadWrite,
          new All(),
          new TopicName('bar')
        ),
        new TopicPermission(
          TopicRole.ReadWrite,
          new CacheName('dog'),
          new TopicName('cat')
        ),
      ]);

      expect(permissionsFromScope(cacheAndTopicPermissions)).toEqual(
        grpcPermissions
      );
    });

    it('validate explicit permissions - empty list', () => {
      const emptyPermissions: Permissions = new Permissions([]);
      expect(() => permissionsFromScope(emptyPermissions)).toThrow(
        InvalidArgumentError
      );
    });

    it('validate explicit permissions - too many permissions', () => {
      const permissions: Array<Permission> = [];
      for (let i = 0; i < 100; i++) {
        permissions.push(
          new CachePermission(CacheRole.ReadOnly, new CacheName(`cache-${i}`))
        );
      }
      const hundredGrpcPermissions = permissionsFromScope(
        new Permissions(permissions)
      );
      expect(hundredGrpcPermissions.has_explicit).toBeTrue();
      expect(hundredGrpcPermissions.explicit.permissions).toBeArrayOfSize(100);
      permissions.push(
        new CachePermission(
          CacheRole.ReadWrite,
          new CacheName('the-last-straw')
        )
      );
      expect(() => permissionsFromScope(new Permissions(permissions))).toThrow(
        InvalidArgumentError
      );
    });

    it('validate explicit permissions - duplicate cache permissions any cache', () => {
      const dupPermissions: Permissions = new Permissions([
        new CachePermission(CacheRole.ReadOnly, new All()),
        new CachePermission(CacheRole.ReadWrite, new All()),
      ]);
      expect(() => permissionsFromScope(dupPermissions)).toThrow(
        InvalidArgumentError
      );
    });

    it('validate explicit permissions - duplicate cache permissions some cache', () => {
      const dupPermissions: Permissions = new Permissions([
        new CachePermission(CacheRole.ReadOnly, new CacheName('clone')),
        new CachePermission(CacheRole.ReadWrite, new CacheName('clone')),
      ]);
      expect(() => permissionsFromScope(dupPermissions)).toThrow(
        InvalidArgumentError
      );
    });

    it('validate explicit permissions - duplicate topic permissions any', () => {
      const dupPermissions: Permissions = new Permissions([
        new TopicPermission(TopicRole.ReadOnly, new All(), new All()),
        new TopicPermission(TopicRole.ReadWrite, new All(), new All()),
      ]);
      expect(() => permissionsFromScope(dupPermissions)).toThrow(
        InvalidArgumentError
      );
    });

    it('validate explicit permissions - duplicate topic permissions some topic', () => {
      const dupPermissions: Permissions = new Permissions([
        new TopicPermission(
          TopicRole.ReadOnly,
          new CacheName('abc'),
          new TopicName('xyz')
        ),
        new TopicPermission(
          TopicRole.ReadWrite,
          new CacheName('abc'),
          new TopicName('xyz')
        ),
        new TopicPermission(
          TopicRole.ReadWrite,
          new CacheName('def'),
          new TopicName('rst')
        ),
      ]);
      expect(() => permissionsFromScope(dupPermissions)).toThrow(
        InvalidArgumentError
      );
    });
  });
});
