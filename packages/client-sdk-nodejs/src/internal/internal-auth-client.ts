import {auth, token} from '@gomomento/generated-types';
import grpcAuth = auth.auth;
import {Header, HeaderInterceptor} from './grpc/headers-interceptor';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {version} from '../../package.json';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  InternalSuperUserPermissions,
  validateDisposableTokenExpiry,
  validateValidForSeconds,
  validateCacheKeyOrPrefix,
  validateDisposableTokenTokenID,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import Never = grpcAuth._GenerateApiTokenRequest.Never;
import Expires = grpcAuth._GenerateApiTokenRequest.Expires;
import {
  ExpiresIn,
  ExpiresAt,
  CredentialProvider,
  RefreshApiKey,
  GenerateApiKey,
  PermissionScope,
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
  AllCacheItems,
  isCacheItemKey,
  isCacheItemKeyPrefix,
  DisposableTokenScope,
} from '@gomomento/sdk-core';
import {IAuthClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {
  asCachePermission,
  asPermissionsObject,
  asTopicPermission,
  isCachePermission,
  isPermissionsObject,
  isTopicPermission,
  PredefinedScope,
} from '@gomomento/sdk-core/dist/src/auth/tokens/permission-scope';
import {permission_messages} from '@gomomento/generated-types/dist/permissionmessages';
import {convert} from './utils';
import {
  asDisposableTokenCachePermission,
  asDisposableTokenPermissionsObject,
  DisposableTokenCachePermission,
  DisposableTokenProps,
  isDisposableTokenCachePermission,
  isDisposableTokenPermissionsObject,
} from '@gomomento/sdk-core/dist/src/auth/tokens/disposable-token-scope';
import {RetryInterceptor} from './grpc/retry-interceptor';
import {AuthClientConfigurations} from '../index';
import {AuthClientAllProps} from './auth-client-all-props';
import {secondsToMilliseconds} from '@gomomento/sdk-core/dist/src/utils';

export class InternalAuthClient implements IAuthClient {
  private static readonly REQUEST_TIMEOUT_MS: number =
    secondsToMilliseconds(60);

  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;
  private readonly creds: CredentialProvider;
  private readonly interceptors: Interceptor[];
  private readonly tokenClient: token.token.TokenClient;
  private readonly authClient: grpcAuth.AuthClient;

  constructor(props: AuthClientAllProps) {
    const configuration =
      props.configuration ?? AuthClientConfigurations.Default.latest();
    this.cacheServiceErrorMapper = new CacheServiceErrorMapper(
      props.throwOnErrors ?? false
    );
    this.creds = props.credentialProvider;
    const headers = [
      new Header('agent', `nodejs:auth:${version}`),
      new Header('runtime-version', `nodejs:${process.versions.node}`),
    ];
    this.interceptors = [
      HeaderInterceptor.createHeadersInterceptor(headers),
      RetryInterceptor.createRetryInterceptor({
        clientName: 'AuthClient',
        loggerFactory: configuration.getLoggerFactory(),
        overallRequestTimeoutMs: InternalAuthClient.REQUEST_TIMEOUT_MS,
      }),
    ];
    this.tokenClient = new token.token.TokenClient(
      this.creds.getTokenEndpoint(),
      this.creds.isEndpointSecure()
        ? ChannelCredentials.createSsl()
        : ChannelCredentials.createInsecure()
    );
    this.authClient = new grpcAuth.AuthClient(
      this.creds.getControlEndpoint(),
      this.creds.isEndpointSecure()
        ? ChannelCredentials.createSsl()
        : ChannelCredentials.createInsecure()
    );
  }

  public async generateApiKey(
    scope: PermissionScope,
    expiresIn: ExpiresIn
  ): Promise<GenerateApiKey.Response> {
    let permissions;
    try {
      permissions = permissionsFromTokenScope(scope);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new GenerateApiKey.Error(err)
      );
    }
    const request = new grpcAuth._GenerateApiTokenRequest({
      auth_token: this.creds.getAuthToken(),
      permissions: permissions,
    });

    if (expiresIn.doesExpire()) {
      try {
        validateValidForSeconds(expiresIn.seconds());
      } catch (err) {
        return this.cacheServiceErrorMapper.returnOrThrowError(
          err as Error,
          err => new GenerateApiKey.Error(err)
        );
      }

      request.expires = new Expires({
        valid_for_seconds: expiresIn.seconds(),
      });
    } else {
      request.never = new Never();
    }

    return await new Promise<GenerateApiKey.Response>((resolve, reject) => {
      this.authClient.GenerateApiToken(
        request,
        {interceptors: this.interceptors},
        (err, resp) => {
          if (err || !resp) {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new GenerateApiKey.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          } else {
            resolve(
              new GenerateApiKey.Success(
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

  /**
   * @deprecated please use `generateApiKey` instead
   */
  public generateAuthToken(
    scope: PermissionScope,
    expiresIn: ExpiresIn
  ): Promise<GenerateApiKey.Response> {
    return this.generateApiKey(scope, expiresIn);
  }

  public async refreshApiKey(
    refreshToken: string
  ): Promise<RefreshApiKey.Response> {
    const request = new grpcAuth._RefreshApiTokenRequest({
      api_key: this.creds.getAuthToken(),
      refresh_token: refreshToken,
    });

    return await new Promise<RefreshApiKey.Response>((resolve, reject) => {
      this.authClient.RefreshApiToken(
        request,
        {interceptors: this.interceptors},
        (err, resp) => {
          if (err || !resp) {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new RefreshApiKey.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          } else {
            resolve(
              new RefreshApiKey.Success(
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

  /**
   * @deprecated please use `refreshApiKey` instead
   */
  public refreshAuthToken(
    refreshToken: string
  ): Promise<RefreshApiKey.Response> {
    return this.refreshApiKey(refreshToken);
  }

  public async generateDisposableToken(
    scope: DisposableTokenScope,
    expiresIn: ExpiresIn,
    disposableTokenProps?: DisposableTokenProps
  ): Promise<GenerateDisposableToken.Response> {
    try {
      validateDisposableTokenExpiry(expiresIn);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new GenerateDisposableToken.Error(err)
      );
    }
    const expires = new token.token._GenerateDisposableTokenRequest.Expires({
      valid_for_seconds: expiresIn.seconds(),
    });

    let permissions;
    try {
      permissions = permissionsFromDisposableTokenScope(scope);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new GenerateDisposableToken.Error(err)
      );
    }

    const tokenId = disposableTokenProps?.tokenId;
    if (tokenId !== undefined) {
      try {
        validateDisposableTokenTokenID(tokenId);
      } catch (err) {
        return this.cacheServiceErrorMapper.returnOrThrowError(
          err as Error,
          err => new GenerateDisposableToken.Error(err)
        );
      }
    }

    const request = new token.token._GenerateDisposableTokenRequest({
      expires: expires,
      auth_token: this.creds.getAuthToken(),
      permissions: permissions,
      token_id: tokenId,
    });

    return await new Promise<GenerateDisposableToken.Response>(
      (resolve, reject) => {
        this.tokenClient.GenerateDisposableToken(
          request,
          {interceptors: this.interceptors},
          (err, resp) => {
            if (err || !resp) {
              this.cacheServiceErrorMapper.resolveOrRejectError({
                err: err,
                errorResponseFactoryFn: e =>
                  new GenerateDisposableToken.Error(e),
                resolveFn: resolve,
                rejectFn: reject,
              });
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
      }
    );
  }
}

export function permissionsFromTokenScope(
  scope: PermissionScope
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

export function permissionsFromDisposableTokenScope(
  scope: DisposableTokenScope
): permission_messages.Permissions {
  const result = new permission_messages.Permissions();
  if (
    !(scope instanceof PredefinedScope) &&
    isDisposableTokenPermissionsObject(scope)
  ) {
    const scopePermissions = asDisposableTokenPermissionsObject(scope);
    const explicitPermissions = new permission_messages.ExplicitPermissions();
    explicitPermissions.permissions = scopePermissions.permissions.map(p =>
      disposableTokenPermissionToGrpcPermission(p)
    );
    result.explicit = explicitPermissions;
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
    case TopicRole.PublishOnly: {
      grpcPermission.role = permission_messages.TopicRole.TopicWriteOnly;
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

function assignCacheRole(
  permission: CachePermission | DisposableTokenCachePermission,
  grpcPermission: permission_messages.PermissionsType.CachePermissions
): permission_messages.PermissionsType.CachePermissions {
  switch (permission.role) {
    case CacheRole.ReadWrite: {
      grpcPermission.role = permission_messages.CacheRole.CacheReadWrite;
      break;
    }
    case CacheRole.ReadOnly: {
      grpcPermission.role = permission_messages.CacheRole.CacheReadOnly;
      break;
    }
    case CacheRole.WriteOnly: {
      grpcPermission.role = permission_messages.CacheRole.CacheWriteOnly;
      break;
    }
    default: {
      throw new Error(`Unrecognized cache role: ${JSON.stringify(permission)}`);
    }
  }
  return grpcPermission;
}

function assignCacheSelector(
  permission: CachePermission | DisposableTokenCachePermission,
  grpcPermission: permission_messages.PermissionsType.CachePermissions
): permission_messages.PermissionsType.CachePermissions {
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

function assignCacheItemSelector(
  permission: DisposableTokenCachePermission,
  grpcPermission: permission_messages.PermissionsType.CachePermissions
): permission_messages.PermissionsType.CachePermissions {
  if (permission.item === AllCacheItems) {
    grpcPermission.all_items = new permission_messages.PermissionsType.All();
  } else if (typeof permission.item === 'string') {
    grpcPermission.item_selector =
      new permission_messages.PermissionsType.CacheItemSelector({
        key: convert(permission.item),
      });
  } else if (isCacheItemKey(permission.item)) {
    validateCacheKeyOrPrefix(permission.item.key);
    grpcPermission.item_selector =
      new permission_messages.PermissionsType.CacheItemSelector({
        key: convert(permission.item.key),
      });
  } else if (isCacheItemKeyPrefix(permission.item)) {
    validateCacheKeyOrPrefix(permission.item.keyPrefix);
    grpcPermission.item_selector =
      new permission_messages.PermissionsType.CacheItemSelector({
        key_prefix: convert(permission.item.keyPrefix),
      });
  } else {
    throw new Error(
      `Unrecognized cache item specification in cache permission: ${JSON.stringify(
        permission
      )}`
    );
  }
  return grpcPermission;
}

function cachePermissionToGrpcPermission(
  permission: CachePermission
): permission_messages.PermissionsType.CachePermissions {
  let grpcPermission =
    new permission_messages.PermissionsType.CachePermissions();
  grpcPermission = assignCacheRole(permission, grpcPermission);
  grpcPermission = assignCacheSelector(permission, grpcPermission);
  return grpcPermission;
}

function disposableTokenPermissionToGrpcPermission(
  permission: DisposableTokenCachePermission
): permission_messages.PermissionsType {
  const result = new permission_messages.PermissionsType();
  if (isDisposableTokenCachePermission(permission)) {
    result.cache_permissions = disposableCachePermissionToGrpcPermission(
      asDisposableTokenCachePermission(permission)
    );
    return result;
  }
  throw new Error(
    `Unrecognized token permission: ${JSON.stringify(permission)}`
  );
}

function disposableCachePermissionToGrpcPermission(
  permission: DisposableTokenCachePermission
): permission_messages.PermissionsType.CachePermissions {
  let grpcPermission =
    new permission_messages.PermissionsType.CachePermissions();
  grpcPermission = assignCacheRole(permission, grpcPermission);
  grpcPermission = assignCacheSelector(permission, grpcPermission);
  grpcPermission = assignCacheItemSelector(permission, grpcPermission);

  return grpcPermission;
}
