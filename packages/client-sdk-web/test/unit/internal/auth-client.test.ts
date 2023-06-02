// import {permissionsFromScope} from '../../../src/internal/auth-client';
// import {InternalSuperUserPermissions} from '@gomomento/sdk-core/dist/src/internal/utils';
// import {_GenerateApiTokenRequest} from '@gomomento/generated-types-webtext/dist/auth_pb';
// import {AllDataReadWrite} from '@gomomento/sdk-core';
//
// describe('internal auth client', () => {
//   describe('permissionsFromScope', () => {
//     it('creates expected grpc permissions for InternalSuperUser permissions class', () => {
//       const expectedPermission = new _GenerateApiTokenRequest.Permissions();
//       expectedPermission.setSuperUser(
//         _GenerateApiTokenRequest.SuperUserPermissions.SUPERUSER
//       );
//       expect(permissionsFromScope(new InternalSuperUserPermissions())).toEqual(
//         expectedPermission
//       );
//     });
//     it('creates expected grpc permissions for AllDataReadWrite', () => {
//       const topicPermissions =
//         new _GenerateApiTokenRequest.PermissionsType.TopicPermissions();
//       topicPermissions.setRole(
//         _GenerateApiTokenRequest.TopicRole.TOPICREADWRITE
//       );
//       const topicPermissionType =
//         new _GenerateApiTokenRequest.PermissionsType();
//       topicPermissionType.setTopicPermissions(topicPermissions);
//
//       const cachePermissions =
//         new _GenerateApiTokenRequest.PermissionsType.CachePermissions();
//       cachePermissions.setRole(
//         _GenerateApiTokenRequest.CacheRole.CACHEREADWRITE
//       );
//       const cachePermissionType =
//         new _GenerateApiTokenRequest.PermissionsType();
//       cachePermissionType.setCachePermissions(cachePermissions);
//
//       const explicitPermissions =
//         new _GenerateApiTokenRequest.ExplicitPermissions();
//       explicitPermissions.setPermissionsList([
//         cachePermissionType,
//         topicPermissionType,
//       ]);
//
//       const grpcPermissions = new _GenerateApiTokenRequest.Permissions();
//       grpcPermissions.setExplicit(explicitPermissions);
//       expect(permissionsFromScope(AllDataReadWrite)).toEqual(grpcPermissions);
//     });
//   });
// });
