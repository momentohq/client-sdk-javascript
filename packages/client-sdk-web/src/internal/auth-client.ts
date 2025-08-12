import {auth, token} from '@gomomento/generated-types-webtext';
import {Request, UnaryResponse} from 'grpc-web';
import {
  _GenerateApiTokenRequest,
  _RefreshApiTokenRequest,
} from '@gomomento/generated-types-webtext/dist/auth_pb';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import Never = _GenerateApiTokenRequest.Never;
import Expires = _GenerateApiTokenRequest.Expires;
import {
  CredentialProvider,
  ExpiresAt,
  ExpiresIn,
  PermissionScope,
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
  GenerateApiKey,
  RefreshApiKey,
} from '@gomomento/sdk-core';
import {IAuthClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {
  InternalSuperUserPermissions,
  validateValidForSeconds,
  validateDisposableTokenExpiry,
  validateCacheKeyOrPrefix,
  validateDisposableTokenTokenID,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {
  convertToB64String,
  getWebControlEndpoint,
  getWebTokenEndpoint,
} from '../utils/web-client-utils';
import {ClientMetadataProvider} from './client-metadata-provider';
import {
  AllFunctions,
  asCachePermission,
  asFunctionPermission,
  asPermissionsObject,
  asTopicPermission,
  FunctionPermission,
  FunctionRole,
  isCachePermission,
  isFunction,
  isFunctionNamePrefix,
  isFunctionPermission,
  isPermissionsObject,
  isTopicPermission,
  PredefinedScope,
} from '@gomomento/sdk-core/dist/src/auth/tokens/permission-scope';
import {
  DisposableTokenScope,
  asDisposableTokenCachePermission,
  isDisposableTokenPermissionsObject,
  DisposableTokenCachePermission,
  isDisposableTokenCachePermission,
  asDisposableTokenPermissionsObject,
  DisposableTokenProps,
} from '@gomomento/sdk-core/dist/src/auth/tokens/disposable-token-scope';
import {_GenerateDisposableTokenRequest} from '@gomomento/generated-types-webtext/dist/token_pb';
import {
  ExplicitPermissions,
  Permissions,
  PermissionsType,
  SuperUserPermissions,
  TopicRole as TokenTopicRole,
  CacheRole as TokenCacheRole,
  FunctionRole as TokenFunctionRole,
} from '@gomomento/generated-types-webtext/dist/permissionmessages_pb';
import {AuthClientAllProps} from './auth-client-all-props';

export class InternalWebGrpcAuthClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> implements IAuthClient
{
  private readonly creds: CredentialProvider;
  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;
  private readonly clientMetadataProvider: ClientMetadataProvider;
  private readonly authClient: auth.AuthClient;
  private readonly tokenClient: token.TokenClient;

  constructor(props: AuthClientAllProps) {
    this.creds = props.credentialProvider;
    this.cacheServiceErrorMapper = new CacheServiceErrorMapper(
      props.throwOnErrors ?? false
    );
    this.clientMetadataProvider = new ClientMetadataProvider({
      clientType: 'auth',
    });
    this.authClient = new auth.AuthClient(
      // Note: all web SDK requests are routed to a `web.` subdomain to allow us flexibility on the server
      getWebControlEndpoint(this.creds),
      null,
      {}
    );
    this.tokenClient = new token.TokenClient(
      // Note: all web SDK requests are routed to a `web.` subdomain to allow us flexibility on the server
      getWebTokenEndpoint(this.creds),
      null,
      {}
    );
  }

  public async generateApiKey(
    scope: PermissionScope,
    expiresIn: ExpiresIn
  ): Promise<GenerateApiKey.Response> {
    const request = new _GenerateApiTokenRequest();
    request.setAuthToken(this.creds.getAuthToken());

    let permissions;
    try {
      permissions = permissionsFromScope(scope);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new GenerateApiKey.Error(err)
      );
    }

    request.setPermissions(permissions);

    if (expiresIn.doesExpire()) {
      try {
        validateValidForSeconds(expiresIn.seconds());
      } catch (err) {
        return this.cacheServiceErrorMapper.returnOrThrowError(
          err as Error,
          err => new GenerateApiKey.Error(err)
        );
      }

      const grpcExpires = new Expires();
      grpcExpires.setValidForSeconds(expiresIn.seconds());
      request.setExpires(grpcExpires);
    } else {
      request.setNever(new Never());
    }

    return await new Promise<GenerateApiKey.Response>((resolve, reject) => {
      this.authClient.generateApiToken(
        request,
        this.clientMetadataProvider.createClientMetadata(),
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
    const request = new _RefreshApiTokenRequest();
    request.setApiKey(this.creds.getAuthToken());
    request.setRefreshToken(refreshToken);

    return await new Promise<RefreshApiKey.Response>((resolve, reject) => {
      this.authClient.refreshApiToken(
        request,
        this.clientMetadataProvider.createClientMetadata(),
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
    const request = new _GenerateDisposableTokenRequest();
    request.setAuthToken(this.creds.getAuthToken());

    let permissions;
    try {
      permissions = permissionsFromScope(scope);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new GenerateDisposableToken.Error(err)
      );
    }

    request.setPermissions(permissions);

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
      request.setTokenId(tokenId);
    }

    try {
      validateDisposableTokenExpiry(expiresIn);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new GenerateDisposableToken.Error(err)
      );
    }

    const grpcExpires = new _GenerateDisposableTokenRequest.Expires();
    grpcExpires.setValidForSeconds(expiresIn.seconds());
    request.setExpires(grpcExpires);

    return await new Promise<GenerateDisposableToken.Response>(
      (resolve, reject) => {
        this.tokenClient.generateDisposableToken(
          request,
          this.clientMetadataProvider.createClientMetadata(),
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
                  resp.getApiKey(),
                  resp.getEndpoint(),
                  ExpiresAt.fromEpoch(resp.getValidUntil())
                )
              );
            }
          }
        );
      }
    );
  }
}

export function permissionsFromScope(
  scope: PermissionScope | DisposableTokenScope
): Permissions {
  const result = new Permissions();
  if (scope instanceof InternalSuperUserPermissions) {
    result.setSuperUser(SuperUserPermissions.SUPERUSER);
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
  } else if (isPermissionsObject(scope)) {
    const scopePermissions = asPermissionsObject(scope);
    const explicitPermissions = new ExplicitPermissions();
    explicitPermissions.setPermissionsList(
      scopePermissions.permissions.map(p => tokenPermissionToGrpcPermission(p))
    );
    result.setExplicit(explicitPermissions);
  } else {
    throw new Error(`Unrecognized token scope: ${JSON.stringify(scope)}`);
  }
  return result;
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
  } else if (isFunctionPermission(permission)) {
    result.setFunctionPermissions(
      functionPermissionToGrpcPermission(asFunctionPermission(permission))
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

function assignFunctionRole(
  permission: FunctionPermission,
  grpcPermission: PermissionsType.FunctionPermissions
): PermissionsType.FunctionPermissions {
  switch (permission.role) {
    case FunctionRole.FunctionPermitNone: {
      grpcPermission.setRole(TokenFunctionRole.FUNCTIONPERMITNONE);
      break;
    }
    case FunctionRole.FunctionInvoke: {
      grpcPermission.setRole(TokenFunctionRole.FUNCTIONINVOKE);
      break;
    }
    default: {
      throw new Error(
        `Unrecognized function role: ${JSON.stringify(permission)}`
      );
    }
  }
  return grpcPermission;
}

function assignFunctionCacheSelector(
  permission: FunctionPermission,
  grpcPermission: PermissionsType.FunctionPermissions
): PermissionsType.FunctionPermissions {
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
      `Unrecognized cache specification in function permission: ${JSON.stringify(
        permission
      )}`
    );
  }
  return grpcPermission;
}

function assignFunctionSelector(
  permission: FunctionPermission,
  grpcPermissions: PermissionsType.FunctionPermissions
): PermissionsType.FunctionPermissions {
  const functionSelector = new PermissionsType.FunctionSelector();
  if (permission.func === AllFunctions) {
    grpcPermissions.setAllFunctions(new PermissionsType.All());
  } else if (isFunctionNamePrefix(permission.func)) {
    functionSelector.setFunctionNamePrefix(permission.func.namePrefix);
    grpcPermissions.setFunctionSelector(functionSelector);
  } else if (typeof permission.func === 'string') {
    functionSelector.setFunctionName(permission.func);
    grpcPermissions.setFunctionSelector(functionSelector);
  } else if (isFunction(permission.func)) {
    functionSelector.setFunctionName(permission.func.name);
    grpcPermissions.setFunctionSelector(functionSelector);
  } else {
    throw new Error(
      `Unrecognized function specification in function permission: ${JSON.stringify(
        permission
      )}`
    );
  }
  return grpcPermissions;
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

function functionPermissionToGrpcPermission(
  permission: FunctionPermission
): PermissionsType.FunctionPermissions {
  let grpcPermission = new PermissionsType.FunctionPermissions();
  grpcPermission = assignFunctionRole(permission, grpcPermission);
  grpcPermission = assignFunctionCacheSelector(permission, grpcPermission);
  grpcPermission = assignFunctionSelector(permission, grpcPermission);
  return grpcPermission;
}

function disposableTokenPermissionToGrpcPermission(
  permission: DisposableTokenCachePermission | FunctionPermission
): PermissionsType {
  const result = new PermissionsType();
  if (isDisposableTokenCachePermission(permission)) {
    result.setCachePermissions(
      disposableCachePermissionToGrpcPermission(
        asDisposableTokenCachePermission(permission)
      )
    );
  } else if (isFunctionPermission(permission)) {
    result.setFunctionPermissions(
      functionPermissionToGrpcPermission(asFunctionPermission(permission))
    );
  } else {
    throw new Error(
      `Unrecognized token permission: ${JSON.stringify(permission)}`
    );
  }
  return result;
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
