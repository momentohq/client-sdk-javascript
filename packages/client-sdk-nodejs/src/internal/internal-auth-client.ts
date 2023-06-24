import {auth} from '@gomomento/generated-types';
import grpcAuth = auth.auth;
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {version} from '../../package.json';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  InternalSuperUserPermissions,
  validateValidForSeconds,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import Never = grpcAuth._GenerateApiTokenRequest.Never;
import Expires = grpcAuth._GenerateApiTokenRequest.Expires;
import {
  ExpiresIn,
  ExpiresAt,
  CredentialProvider,
  RefreshAuthToken,
  GenerateAuthToken,
  TokenScope,
  Permissions,
  Permission,
  TopicPermission,
  CachePermission,
  TopicRole,
  CacheRole,
  Any,
  CacheName,
  TopicName,
} from '@gomomento/sdk-core';
import {IAuthClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {AuthClientProps} from '../auth-client-props';
import {
  normalizeSdkError,
  InvalidArgumentError,
} from '@gomomento/sdk-core/dist/src/errors';

const MAX_PERMISSIONS_PER_TOKEN = 100;

export class InternalAuthClient implements IAuthClient {
  private static readonly REQUEST_TIMEOUT_MS: number = 60 * 1000;

  private readonly creds: CredentialProvider;
  private readonly interceptors: Interceptor[];

  constructor(props: AuthClientProps) {
    this.creds = props.credentialProvider;
    const headers = [new Header('Agent', `nodejs:${version}`)];
    this.interceptors = [
      new HeaderInterceptorProvider(headers).createHeadersInterceptor(),
      ClientTimeoutInterceptor(InternalAuthClient.REQUEST_TIMEOUT_MS),
    ];
  }

  public async generateAuthToken(
    scope: TokenScope,
    expiresIn: ExpiresIn
  ): Promise<GenerateAuthToken.Response> {
    const authClient = new grpcAuth.AuthClient(
      this.creds.getControlEndpoint(),
      ChannelCredentials.createSsl()
    );

    let permissions;
    try {
      permissions = permissionsFromScope(scope);
    } catch (err) {
      return new GenerateAuthToken.Error(normalizeSdkError(err as Error));
    }
    const request = new grpcAuth._GenerateApiTokenRequest({
      auth_token: this.creds.getAuthToken(),
      permissions: permissions,
    });

    if (expiresIn.doesExpire()) {
      try {
        validateValidForSeconds(expiresIn.seconds());
      } catch (err) {
        return new GenerateAuthToken.Error(normalizeSdkError(err as Error));
      }

      request.expires = new Expires({
        valid_for_seconds: expiresIn.seconds(),
      });
    } else {
      request.never = new Never();
    }

    return await new Promise<GenerateAuthToken.Response>(resolve => {
      authClient.GenerateApiToken(
        request,
        {interceptors: this.interceptors},
        (err, resp) => {
          if (err || !resp) {
            resolve(new GenerateAuthToken.Error(cacheServiceErrorMapper(err)));
          } else {
            resolve(
              new GenerateAuthToken.Success(
                resp.api_key,
                resp.refresh_token,
                resp.endpoint,
                ExpiresAt.fromEpoch(resp.valid_until)
              )
            );
          }
        }
      );
    });
  }

  public async refreshAuthToken(
    refreshToken: string
  ): Promise<RefreshAuthToken.Response> {
    const authClient = new grpcAuth.AuthClient(
      this.creds.getControlEndpoint(),
      ChannelCredentials.createSsl()
    );

    const request = new grpcAuth._RefreshApiTokenRequest({
      api_key: this.creds.getAuthToken(),
      refresh_token: refreshToken,
    });

    return await new Promise<RefreshAuthToken.Response>(resolve => {
      authClient.RefreshApiToken(
        request,
        {interceptors: this.interceptors},
        (err, resp) => {
          if (err || !resp) {
            resolve(new RefreshAuthToken.Error(cacheServiceErrorMapper(err)));
          } else {
            resolve(
              new RefreshAuthToken.Success(
                resp.api_key,
                resp.refresh_token,
                resp.endpoint,
                ExpiresAt.fromEpoch(resp.valid_until)
              )
            );
          }
        }
      );
    });
  }
}

export function permissionsFromScope(
  scope: TokenScope
): grpcAuth._GenerateApiTokenRequest.Permissions {
  const result = new grpcAuth._GenerateApiTokenRequest.Permissions();
  if (scope instanceof InternalSuperUserPermissions) {
    result.super_user =
      grpcAuth._GenerateApiTokenRequest.SuperUserPermissions.SuperUser;
    return result;
  } else if (scope instanceof Permissions) {
    validateExplicitPermissions(scope.permissions);
    const explicitPermissions =
      new grpcAuth._GenerateApiTokenRequest.ExplicitPermissions();
    explicitPermissions.permissions = scope.permissions.map(p =>
      tokenPermissionToGrpcPermission(p)
    );
    result.explicit = explicitPermissions;
    return result;
  }
  throw new Error(`Unrecognized token scope: ${JSON.stringify(scope)}`);
}

function tokenPermissionToGrpcPermission(
  permission: Permission
): grpcAuth._GenerateApiTokenRequest.PermissionsType {
  const result = new grpcAuth._GenerateApiTokenRequest.PermissionsType();
  if (permission instanceof TopicPermission) {
    result.topic_permissions = topicPermissionToGrpcPermission(permission);
    return result;
  } else if (permission instanceof CachePermission) {
    result.cache_permissions = cachePermissionToGrpcPermission(permission);
    return result;
  }
  throw new Error(
    `Unrecognized token permission: ${JSON.stringify(permission)}`
  );
}

function topicPermissionToGrpcPermission(
  permission: TopicPermission
): grpcAuth._GenerateApiTokenRequest.PermissionsType.TopicPermissions {
  const grpcPermission =
    new grpcAuth._GenerateApiTokenRequest.PermissionsType.TopicPermissions();
  switch (permission.topicRole) {
    case TopicRole.None:
      throw new Error('TopicRole.None not yet supported');
    case TopicRole.ReadWrite: {
      grpcPermission.role =
        grpcAuth._GenerateApiTokenRequest.TopicRole.TopicReadWrite;
      break;
    }
    case TopicRole.ReadOnly: {
      grpcPermission.role =
        grpcAuth._GenerateApiTokenRequest.TopicRole.TopicReadOnly;
      break;
    }
    default: {
      throw new Error(`Unrecognized topic role: ${JSON.stringify(permission)}`);
    }
  }

  grpcPermission.cache =
    new grpcAuth._GenerateApiTokenRequest.PermissionsType.CacheResource();
  if (permission.cache instanceof Any) {
    const anyCache =
      new grpcAuth._GenerateApiTokenRequest.PermissionsType.Any();
    grpcPermission.cache.any = anyCache;
  } else if (permission.cache instanceof CacheName) {
    grpcPermission.cache.cache_name = permission.cache.name;
  } else {
    throw new Error(
      `Unrecognized cache specification in topic permission: ${JSON.stringify(
        permission
      )}`
    );
  }

  grpcPermission.topic =
    new grpcAuth._GenerateApiTokenRequest.PermissionsType.TopicResource();

  if (permission.topic instanceof Any) {
    const anyTopic =
      new grpcAuth._GenerateApiTokenRequest.PermissionsType.Any();
    grpcPermission.topic.any = anyTopic;
  } else if (permission.topic instanceof TopicName) {
    grpcPermission.topic.topic_name = permission.topic.name;
  } else {
    throw new Error(
      `Unrecognized topic specification in topic permission: ${JSON.stringify(
        permission
      )}`
    );
  }
  return grpcPermission;
}

function cachePermissionToGrpcPermission(
  permission: CachePermission
): grpcAuth._GenerateApiTokenRequest.PermissionsType.CachePermissions {
  const grpcPermission =
    new grpcAuth._GenerateApiTokenRequest.PermissionsType.CachePermissions();
  switch (permission.cacheRole) {
    case CacheRole.None:
      throw new Error('CacheRole.None not yet supported');
    case CacheRole.ReadWrite: {
      grpcPermission.role =
        grpcAuth._GenerateApiTokenRequest.CacheRole.CacheReadWrite;
      break;
    }
    case CacheRole.ReadOnly: {
      grpcPermission.role =
        grpcAuth._GenerateApiTokenRequest.CacheRole.CacheReadOnly;
      break;
    }
    default: {
      throw new Error(`Unrecognized cache role: ${JSON.stringify(permission)}`);
    }
  }

  grpcPermission.cache =
    new grpcAuth._GenerateApiTokenRequest.PermissionsType.CacheResource();
  if (permission.cache instanceof Any) {
    const anyCache =
      new grpcAuth._GenerateApiTokenRequest.PermissionsType.Any();
    grpcPermission.cache.any = anyCache;
  } else if (permission.cache instanceof CacheName) {
    grpcPermission.cache.cache_name = permission.cache.name;
  } else {
    throw new Error(
      `Unrecognized cache specification in cache permission: ${JSON.stringify(
        permission
      )}`
    );
  }
  return grpcPermission;
}

interface ResourceToPermissionMap {
  [resource: string]: Permission;
}

function validateExplicitPermissions(permissions: Array<Permission>) {
  if (!permissions || permissions.length < 1) {
    throw new InvalidArgumentError('At least 1 permission must be specified.');
  }
  if (permissions.length > MAX_PERMISSIONS_PER_TOKEN) {
    throw new InvalidArgumentError(
      `A token cannot have more than ${MAX_PERMISSIONS_PER_TOKEN} permissions, ${permissions.length} permissions were provided.`
    );
  }

  const cachePermissionMap: ResourceToPermissionMap = {};

  function groupByCache(permission: CachePermission) {
    const key = JSON.stringify(permission.cache);
    const entry = cachePermissionMap[key];
    if (entry instanceof CachePermission) {
      // Cannot add multiple permissions for the same resource.
      throw new InvalidArgumentError(
        `Cache ${key} cannot have multiple permissions [${permission.cacheRole}, ${entry.cacheRole}]`
      );
    } else {
      cachePermissionMap[key] = permission;
    }
  }
  (
    permissions.filter(
      p => p instanceof CachePermission
    ) as Array<CachePermission>
  ).forEach(groupByCache);

  const topicPermissionMap: ResourceToPermissionMap = {};

  function groupByTopic(permission: TopicPermission) {
    const key = `{ cache: ${JSON.stringify(
      permission.cache
    )}, topic: ${JSON.stringify(permission.topic)}}`;
    const entry = topicPermissionMap[key];
    if (entry instanceof TopicPermission) {
      // Cannot add multiple permissions for the same resource.
      throw new InvalidArgumentError(
        `Topic ${key} cannot have multiple roles [${permission.topicRole}, ${entry.topicRole}]`
      );
    } else {
      topicPermissionMap[key] = permission;
    }
  }
  (
    permissions.filter(
      p => p instanceof TopicPermission
    ) as Array<TopicPermission>
  ).forEach(groupByTopic);
}
