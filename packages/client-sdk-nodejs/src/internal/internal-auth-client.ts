import {auth, token} from '@gomomento/generated-types';
import grpcAuth = auth.auth;
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {version} from '../../package.json';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  InternalSuperUserPermissions,
  validateDisposableTokenExpiry,
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
  AllCaches,
  AllTopics,
  isCacheName,
  isTopicName,
  GenerateDisposableToken,
} from '@gomomento/sdk-core';
import {IAuthClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {AuthClientProps} from '../auth-client-props';
import {normalizeSdkError} from '@gomomento/sdk-core/dist/src/errors';
import {
  TemporaryTokenScope,
  asCachePermission,
  asPermissionsObject,
  asTopicPermission,
  isCachePermission,
  isPermissionsObject,
  isTopicPermission,
} from '@gomomento/sdk-core/dist/src/auth/tokens/token-scope';
import {permission_messages} from '@gomomento/generated-types/dist/permissionmessages';

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

  public async generateDisposableToken(
    scope: TemporaryTokenScope,
    expiresIn: ExpiresIn
  ): Promise<GenerateDisposableToken.Response> {
    const tokenClient = new token.token.TokenClient(
      this.creds.getControlEndpoint(),
      ChannelCredentials.createSsl()
    );

    try {
      validateDisposableTokenExpiry(expiresIn);
    } catch (err) {
      return new GenerateDisposableToken.Error(normalizeSdkError(err as Error));
    }
    const expires = new Expires({
      valid_for_seconds: expiresIn.seconds(),
    });

    let permissions;
    try {
      permissions = permissionsFromScope(scope);
    } catch (err) {
      return new GenerateDisposableToken.Error(normalizeSdkError(err as Error));
    }

    const request = token.token._GenerateDisposableTokenRequest.fromObject({
      expires: expires,
      auth_token: this.creds.getAuthToken(),
      permissions: permissions,
    });

    return await new Promise<GenerateDisposableToken.Response>(resolve => {
      tokenClient.GenerateDisposableToken(
        request,
        {interceptors: this.interceptors},
        (err, resp) => {
          if (err || !resp) {
            resolve(
              new GenerateDisposableToken.Error(cacheServiceErrorMapper(err))
            );
          } else {
            resolve(
              new GenerateDisposableToken.Success(
                resp.api_key,
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
  scope: TokenScope | TemporaryTokenScope
): permission_messages.Permissions {
  const result = new permission_messages.Permissions();
  if (scope instanceof InternalSuperUserPermissions) {
    result.super_user = permission_messages.SuperUserPermissions.SuperUser;
    return result;
  } else if (isPermissionsObject(scope)) {
    const scopePermissions: Permissions = asPermissionsObject(scope);
    const explicitPermissions = new permission_messages.ExplicitPermissions();
    explicitPermissions.permissions = scopePermissions.permissions.map(p =>
      tokenPermissionToGrpcPermission(p)
    );
    result.explicit = explicitPermissions;
    return result;
  }
  throw new Error(`Unrecognized token scope: ${JSON.stringify(scope)}`);
}

function tokenPermissionToGrpcPermission(
  permission: Permission
): permission_messages.PermissionsType {
  const result = new permission_messages.PermissionsType();
  if (isTopicPermission(permission)) {
    result.topic_permissions = topicPermissionToGrpcPermission(
      asTopicPermission(permission)
    );
    return result;
  } else if (isCachePermission(permission)) {
    result.cache_permissions = cachePermissionToGrpcPermission(
      asCachePermission(permission)
    );
    return result;
  }
  throw new Error(
    `Unrecognized token permission: ${JSON.stringify(permission)}`
  );
}

function topicPermissionToGrpcPermission(
  permission: TopicPermission
): permission_messages.PermissionsType.TopicPermissions {
  const grpcPermission =
    new permission_messages.PermissionsType.TopicPermissions();
  switch (permission.role) {
    case TopicRole.PublishSubscribe: {
      grpcPermission.role = permission_messages.TopicRole.TopicReadWrite;
      break;
    }
    case TopicRole.SubscribeOnly: {
      grpcPermission.role = permission_messages.TopicRole.TopicReadOnly;
      break;
    }
    default: {
      throw new Error(`Unrecognized topic role: ${JSON.stringify(permission)}`);
    }
  }

  if (permission.cache === AllCaches) {
    grpcPermission.all_caches = new permission_messages.PermissionsType.All();
  } else if (typeof permission.cache === 'string') {
    grpcPermission.cache_selector =
      new permission_messages.PermissionsType.CacheSelector({
        cache_name: permission.cache,
      });
  } else if (isCacheName(permission.cache)) {
    grpcPermission.cache_selector =
      new permission_messages.PermissionsType.CacheSelector({
        cache_name: permission.cache.name,
      });
  } else {
    throw new Error(
      `Unrecognized cache specification in topic permission: ${JSON.stringify(
        permission
      )}`
    );
  }

  if (permission.topic === AllTopics) {
    grpcPermission.all_topics = new permission_messages.PermissionsType.All();
  } else if (typeof permission.topic === 'string') {
    grpcPermission.topic_selector =
      new permission_messages.PermissionsType.TopicSelector({
        topic_name: permission.topic,
      });
  } else if (isTopicName(permission.topic)) {
    grpcPermission.topic_selector =
      new permission_messages.PermissionsType.TopicSelector({
        topic_name: permission.topic.name,
      });
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
): permission_messages.PermissionsType.CachePermissions {
  const grpcPermission =
    new permission_messages.PermissionsType.CachePermissions();
  switch (permission.role) {
    case CacheRole.ReadWrite: {
      grpcPermission.role = permission_messages.CacheRole.CacheReadWrite;
      break;
    }
    case CacheRole.ReadOnly: {
      grpcPermission.role = permission_messages.CacheRole.CacheReadOnly;
      break;
    }
    default: {
      throw new Error(`Unrecognized cache role: ${JSON.stringify(permission)}`);
    }
  }

  if (permission.cache === AllCaches) {
    grpcPermission.all_caches = new permission_messages.PermissionsType.All();
  } else if (typeof permission.cache === 'string') {
    grpcPermission.cache_selector =
      new permission_messages.PermissionsType.CacheSelector({
        cache_name: permission.cache,
      });
  } else if (isCacheName(permission.cache)) {
    grpcPermission.cache_selector =
      new permission_messages.PermissionsType.CacheSelector({
        cache_name: permission.cache.name,
      });
  } else {
    throw new Error(
      `Unrecognized cache specification in cache permission: ${JSON.stringify(
        permission
      )}`
    );
  }
  return grpcPermission;
}
