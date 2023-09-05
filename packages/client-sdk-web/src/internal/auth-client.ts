import {auth, token} from '@gomomento/generated-types-webtext';
import {GenerateAuthToken, RefreshAuthToken} from '..';
import {Request, UnaryResponse} from 'grpc-web';
import {
  _GenerateApiTokenRequest,
  _RefreshApiTokenRequest,
} from '@gomomento/generated-types-webtext/dist/auth_pb';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import Never = _GenerateApiTokenRequest.Never;
import Expires = _GenerateApiTokenRequest.Expires;
import {
  CredentialProvider,
  ExpiresAt,
  ExpiresIn,
  TokenScope,
  Permission,
  TopicPermission,
  CachePermission,
  CacheRole,
  TopicRole,
  AllCaches,
  isCacheName,
  AllTopics,
  isTopicName,
  GenerateDisposableToken,
  AllCacheItems,
  isCacheItemKey,
  isCacheItemKeyPrefix,
} from '@gomomento/sdk-core';
import {IAuthClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {AuthClientProps} from '../auth-client-props';
import {
  InternalSuperUserPermissions,
  validateValidForSeconds,
  validateDisposableTokenExpiry,
  validateCacheKeyOrPrefix,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {normalizeSdkError} from '@gomomento/sdk-core/dist/src/errors';
import {
  convertToB64String,
  getWebControlEndpoint,
  getWebTokenEndpoint,
} from '../utils/web-client-utils';
import {ClientMetadataProvider} from './client-metadata-provider';
import {
  DisposableTokenScope,
  asCachePermission,
  asPermissionsObject,
  asTopicPermission,
  isCachePermission,
  isPermissionsObject,
  isTopicPermission,
  asDisposableTokenCachePermission,
  isDisposableTokenPermissionsObject,
  DisposableTokenCachePermission,
  isDisposableTokenCachePermission,
  asDisposableTokenPermissionsObject,
  PredefinedScope,
} from '@gomomento/sdk-core/dist/src/auth/tokens/token-scope';
import {_GenerateDisposableTokenRequest} from '@gomomento/generated-types-webtext/dist/token_pb';
import {
  ExplicitPermissions,
  Permissions,
  PermissionsType,
  SuperUserPermissions,
  TopicRole as TokenTopicRole,
  CacheRole as TokenCacheRole,
} from '@gomomento/generated-types-webtext/dist/permissionmessages_pb';

export class InternalWebGrpcAuthClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> implements IAuthClient
{
  private readonly creds: CredentialProvider;
  private readonly clientMetadataProvider: ClientMetadataProvider;
  private readonly authClient: auth.AuthClient;

  constructor(props: AuthClientProps) {
    this.creds = props.credentialProvider;
    this.clientMetadataProvider = new ClientMetadataProvider({});
    this.authClient = new auth.AuthClient(
      // Note: all web SDK requests are routed to a `web.` subdomain to allow us flexibility on the server
      getWebControlEndpoint(this.creds),
      null,
      {}
    );
  }

  public async generateAuthToken(
    scope: TokenScope,
    expiresIn: ExpiresIn
  ): Promise<GenerateAuthToken.Response> {
    const request = new _GenerateApiTokenRequest();
    request.setAuthToken(this.creds.getAuthToken());

    let permissions;
    try {
      permissions = permissionsFromScope(scope);
    } catch (err) {
      return new GenerateAuthToken.Error(normalizeSdkError(err as Error));
    }

    request.setPermissions(permissions);

    if (expiresIn.doesExpire()) {
      try {
        validateValidForSeconds(expiresIn.seconds());
      } catch (err) {
        return new GenerateAuthToken.Error(normalizeSdkError(err as Error));
      }

      const grpcExpires = new Expires();
      grpcExpires.setValidForSeconds(expiresIn.seconds());
      request.setExpires(grpcExpires);
    } else {
      request.setNever(new Never());
    }

    return await new Promise<GenerateAuthToken.Response>(resolve => {
      this.authClient.generateApiToken(
        request,
        this.clientMetadataProvider.createClientMetadata(),
        (err, resp) => {
          if (err || !resp) {
            resolve(new GenerateAuthToken.Error(cacheServiceErrorMapper(err)));
          } else {
            resolve(
              new GenerateAuthToken.Success(
                resp.getApiKey(),
                resp.getRefreshToken(),
                resp.getEndpoint(),
                ExpiresAt.fromEpoch(resp.getValidUntil())
              )
            );
          }
        }
      );
    });
  }

  public async refreshAuthToken(
    _refreshToken: string
  ): Promise<RefreshAuthToken.Response> {
    const request = new _RefreshApiTokenRequest();
    request.setApiKey(this.creds.getAuthToken());
    request.setRefreshToken(_refreshToken);

    return await new Promise<RefreshAuthToken.Response>(resolve => {
      this.authClient.refreshApiToken(
        request,
        this.clientMetadataProvider.createClientMetadata(),
        (err, resp) => {
          if (err || !resp) {
            resolve(new RefreshAuthToken.Error(cacheServiceErrorMapper(err)));
          } else {
            resolve(
              new RefreshAuthToken.Success(
                resp.getApiKey(),
                resp.getRefreshToken(),
                resp.getEndpoint(),
                ExpiresAt.fromEpoch(resp.getValidUntil())
              )
            );
          }
        }
      );
    });
  }

  public async generateDisposableToken(
    scope: DisposableTokenScope,
    expiresIn: ExpiresIn
  ): Promise<GenerateDisposableToken.Response> {
    const tokenClient = new token.TokenClient(
      // Note: all web SDK requests are routed to a `web.` subdomain to allow us flexibility on the server
      getWebTokenEndpoint(this.creds),
      null,
      {}
    );

    const request = new _GenerateDisposableTokenRequest();
    request.setAuthToken(this.creds.getAuthToken());

    let permissions;
    try {
      permissions = permissionsFromScope(scope);
    } catch (err) {
      return new GenerateDisposableToken.Error(normalizeSdkError(err as Error));
    }

    request.setPermissions(permissions);

    try {
      validateDisposableTokenExpiry(expiresIn);
    } catch (err) {
      return new GenerateDisposableToken.Error(normalizeSdkError(err as Error));
    }

    const grpcExpires = new _GenerateDisposableTokenRequest.Expires();
    grpcExpires.setValidForSeconds(expiresIn.seconds());
    request.setExpires(grpcExpires);

    return await new Promise<GenerateDisposableToken.Response>(resolve => {
      tokenClient.generateDisposableToken(
        request,
        this.clientMetadataProvider.createClientMetadata(),
        (err, resp) => {
          if (err || !resp) {
            resolve(
              new GenerateDisposableToken.Error(cacheServiceErrorMapper(err))
            );
          } else {
            resolve(
              new GenerateDisposableToken.Success(
                resp.getApiKey(),
                resp.getEndpoint(),
                ExpiresAt.fromEpoch(resp.getValidUntil())
              )
            );
          }
        }
      );
    });
  }
}

export function permissionsFromScope(
  scope: TokenScope | DisposableTokenScope
): Permissions {
  const result = new Permissions();
  if (scope instanceof InternalSuperUserPermissions) {
    result.setSuperUser(SuperUserPermissions.SUPERUSER);
    return result;
  } else if (
    !(scope instanceof PredefinedScope) &&
    isDisposableTokenPermissionsObject(scope)
  ) {
    const scopePermissions = asDisposableTokenPermissionsObject(scope);
    const explicitPermissions = new ExplicitPermissions();
    explicitPermissions.setPermissionsList(
      scopePermissions.permissions.map(p =>
        disposableTokenPermissionToGrpcPermission(p)
      )
    );
    result.setExplicit(explicitPermissions);
    return result;
  } else if (isPermissionsObject(scope)) {
    const scopePermissions = asPermissionsObject(scope);
    const explicitPermissions = new ExplicitPermissions();
    explicitPermissions.setPermissionsList(
      scopePermissions.permissions.map(p => tokenPermissionToGrpcPermission(p))
    );
    result.setExplicit(explicitPermissions);
    return result;
  }
  throw new Error(`Unrecognized token scope: ${JSON.stringify(scope)}`);
}

function tokenPermissionToGrpcPermission(
  permission: Permission
): PermissionsType {
  const result = new PermissionsType();
  if (isTopicPermission(permission)) {
    result.setTopicPermissions(
      topicPermissionToGrpcPermission(asTopicPermission(permission))
    );
    return result;
  } else if (isCachePermission(permission)) {
    result.setCachePermissions(
      cachePermissionToGrpcPermission(asCachePermission(permission))
    );
    return result;
  }
  throw new Error(
    `Unrecognized token permission: ${JSON.stringify(permission)}`
  );
}

function topicPermissionToGrpcPermission(
  permission: TopicPermission
): PermissionsType.TopicPermissions {
  const grpcPermission = new PermissionsType.TopicPermissions();

  switch (permission.role) {
    case TopicRole.PublishSubscribe: {
      grpcPermission.setRole(TokenTopicRole.TOPICREADWRITE);
      break;
    }
    case TopicRole.SubscribeOnly: {
      grpcPermission.setRole(TokenTopicRole.TOPICREADONLY);
      break;
    }
    case TopicRole.PublishOnly: {
      grpcPermission.setRole(TokenTopicRole.TOPICWRITEONLY);
      break;
    }
    default: {
      throw new Error(`Unrecognized topic role: ${JSON.stringify(permission)}`);
    }
  }

  const cacheSelector = new PermissionsType.CacheSelector();

  if (permission.cache === AllCaches) {
    grpcPermission.setAllCaches(new PermissionsType.All());
  } else if (typeof permission.cache === 'string') {
    cacheSelector.setCacheName(permission.cache);
    grpcPermission.setCacheSelector(cacheSelector);
  } else if (isCacheName(permission.cache)) {
    cacheSelector.setCacheName(permission.cache.name);
    grpcPermission.setCacheSelector(cacheSelector);
  } else {
    throw new Error(
      `Unrecognized cache specification in topic permission: ${JSON.stringify(
        permission
      )}`
    );
  }

  const topicSelector = new PermissionsType.TopicSelector();

  if (permission.topic === AllTopics) {
    grpcPermission.setAllTopics(new PermissionsType.All());
  } else if (typeof permission.topic === 'string') {
    topicSelector.setTopicName(permission.topic);
    grpcPermission.setTopicSelector(topicSelector);
  } else if (isTopicName(permission.topic)) {
    topicSelector.setTopicName(permission.topic.name);
    grpcPermission.setTopicSelector(topicSelector);
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
  grpcPermission: PermissionsType.CachePermissions
): PermissionsType.CachePermissions {
  switch (permission.role) {
    case CacheRole.ReadWrite: {
      grpcPermission.setRole(TokenCacheRole.CACHEREADWRITE);
      break;
    }
    case CacheRole.ReadOnly: {
      grpcPermission.setRole(TokenCacheRole.CACHEREADONLY);
      break;
    }
    case CacheRole.WriteOnly: {
      grpcPermission.setRole(TokenCacheRole.CACHEWRITEONLY);
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
  grpcPermission: PermissionsType.CachePermissions
): PermissionsType.CachePermissions {
  const cacheSelector = new PermissionsType.CacheSelector();

  if (permission.cache === AllCaches) {
    grpcPermission.setAllCaches(new PermissionsType.All());
  } else if (typeof permission.cache === 'string') {
    cacheSelector.setCacheName(permission.cache);
    grpcPermission.setCacheSelector(cacheSelector);
  } else if (isCacheName(permission.cache)) {
    cacheSelector.setCacheName(permission.cache.name);
    grpcPermission.setCacheSelector(cacheSelector);
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
  grpcPermission: PermissionsType.CachePermissions
): PermissionsType.CachePermissions {
  const itemSelector = new PermissionsType.CacheItemSelector();

  if (permission.item === AllCacheItems) {
    grpcPermission.setAllItems(new PermissionsType.All());
  } else if (typeof permission.item === 'string') {
    itemSelector.setKey(convertToB64String(permission.item));
    grpcPermission.setItemSelector(itemSelector);
  } else if (isCacheItemKey(permission.item)) {
    validateCacheKeyOrPrefix(permission.item.key);
    itemSelector.setKey(convertToB64String(permission.item.key));
    grpcPermission.setItemSelector(itemSelector);
  } else if (isCacheItemKeyPrefix(permission.item)) {
    validateCacheKeyOrPrefix(permission.item.keyPrefix);
    itemSelector.setKeyPrefix(convertToB64String(permission.item.keyPrefix));
    grpcPermission.setItemSelector(itemSelector);
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
): PermissionsType.CachePermissions {
  let grpcPermission = new PermissionsType.CachePermissions();
  grpcPermission = assignCacheRole(permission, grpcPermission);
  grpcPermission = assignCacheSelector(permission, grpcPermission);
  return grpcPermission;
}

function disposableTokenPermissionToGrpcPermission(
  permission: DisposableTokenCachePermission
): PermissionsType {
  const result = new PermissionsType();
  if (isDisposableTokenCachePermission(permission)) {
    result.setCachePermissions(
      disposableCachePermissionToGrpcPermission(
        asDisposableTokenCachePermission(permission)
      )
    );
    return result;
  }
  throw new Error(
    `Unrecognized token permission: ${JSON.stringify(permission)}`
  );
}

function disposableCachePermissionToGrpcPermission(
  permission: DisposableTokenCachePermission
): PermissionsType.CachePermissions {
  let grpcPermission = new PermissionsType.CachePermissions();
  grpcPermission = assignCacheRole(permission, grpcPermission);
  grpcPermission = assignCacheSelector(permission, grpcPermission);
  grpcPermission = assignCacheItemSelector(permission, grpcPermission);
  return grpcPermission;
}
