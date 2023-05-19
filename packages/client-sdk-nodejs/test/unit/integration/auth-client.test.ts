import {InternalSuperUserPermissions} from '@gomomento/sdk-core/dist/src/internal/utils';
import {AllDataReadWrite} from '@gomomento/sdk-core';
import {auth} from '@gomomento/generated-types/dist/auth';
import _GenerateApiTokenRequest = auth._GenerateApiTokenRequest;
import {permissionsFromScope} from '../../../src/internal/internal-auth-client';

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
      const topicPermissionType =
        new _GenerateApiTokenRequest.PermissionsType();
      topicPermissionType.topic_permissions = topicPermissions;

      const cachePermissions =
        new _GenerateApiTokenRequest.PermissionsType.CachePermissions();
      cachePermissions.role = _GenerateApiTokenRequest.CacheRole.CacheReadWrite;
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
  });
});
