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
import {AuthClientProps} from '../auth-client-props';
import {normalizeSdkError} from '@gomomento/sdk-core/dist/src/errors';
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

  public async generateApiKey(
    scope: PermissionScope,
    expiresIn: ExpiresIn
  ): Promise<GenerateApiKey.Response> {
    const authClient = new grpcAuth.AuthClient(
      this.creds.getControlEndpoint(),
      ChannelCredentials.createSsl()
    );

    let permissions;
    try {
      permissions = permissionsFromTokenScope(scope);
    } catch (err) {
      return new GenerateApiKey.Error(normalizeSdkError(err as Error));
    }
    const request = new grpcAuth._GenerateApiTokenRequest({
      auth_token: this.creds.getAuthToken(),
      permissions: permissions,
    });

    if (expiresIn.doesExpire()) {
      try {
        validateValidForSeconds(expiresIn.seconds());
      } catch (err) {
        return new GenerateApiKey.Error(normalizeSdkError(err as Error));
      }

      request.expires = new Expires({
        valid_for_seconds: expiresIn.seconds(),
      });
    } else {
      request.never = new Never();
    }

    return await new Promise<GenerateApiKey.Response>(resolve => {
      authClient.GenerateApiToken(
        request,
        {interceptors: this.interceptors},
        (err, resp) => {
          if (err || !resp) {
            resolve(new GenerateApiKey.Error(cacheServiceErrorMapper(err)));
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
    const authClient = new grpcAuth.AuthClient(
      this.creds.getControlEndpoint(),
      ChannelCredentials.createSsl()
    );

    const request = new grpcAuth._RefreshApiTokenRequest({
      api_key: this.creds.getAuthToken(),
      refresh_token: refreshToken,
    });

    return await new Promise<RefreshApiKey.Response>(resolve => {
      authClient.RefreshApiToken(
        request,
        {interceptors: this.interceptors},
        (err, resp) => {
          if (err || !resp) {
            resolve(new RefreshApiKey.Error(cacheServiceErrorMapper(err)));
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

    console.time('Constructing client');
    const tokenClient = new token.token.TokenClient(
      this.creds.getTokenEndpoint(),
      ChannelCredentials.createSsl()
    );
    console.timeEnd('Constructing client');

    console.time('Validating token');
    try {
      validateDisposableTokenExpiry(expiresIn);
    } catch (err) {
      return new GenerateDisposableToken.Error(normalizeSdkError(err as Error));
    }
    console.timeEnd('Validating token');

    console.time('_GenerateDisposableTokenRequest.Expires');
    const expires = new token.token._GenerateDisposableTokenRequest.Expires({
      valid_for_seconds: expiresIn.seconds(),
    });
    console.timeEnd('_GenerateDisposableTokenRequest.Expire');

    console.time('permissionsFromDisposableTokenScope');
    let permissions;
    try {
      permissions = permissionsFromDisposableTokenScope(scope);
    } catch (err) {
      return new GenerateDisposableToken.Error(normalizeSdkError(err as Error));
    }
    console.timeEnd('permissionsFromDisposableTokenScope');

    console.time('validateDisposableTokenTokenID');
    const tokenId = disposableTokenProps?.tokenId;
    if (tokenId !== undefined) {
      try {
        validateDisposableTokenTokenID(tokenId);
      } catch (err) {
        return new GenerateDisposableToken.Error(
          normalizeSdkError(err as Error)
        );
      }
    }
    console.timeEnd('validateDisposableTokenTokenID');

    console.time('token.token._GenerateDisposableTokenRequest');
    const request = new token.token._GenerateDisposableTokenRequest({
      expires: expires,
      auth_token: this.creds.getAuthToken(),
      permissions: permissions,
      token_id: tokenId,
    });
    console.timeEnd('token.token._GenerateDisposableTokenRequest');


    return await new Promise<GenerateDisposableToken.Response>(resolve => {
      console.time('APICall');
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
      console.timeEnd('APICall');
    });
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
  console.log(
    `PERMISSIONS FROM DISPOSABLE TOKEN SCOPE: ${JSON.stringify(scope)}`
  );
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
