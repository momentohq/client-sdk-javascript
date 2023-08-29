import {auth} from '@gomomento/generated-types-webtext';
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
} from '@gomomento/sdk-core';
import {IAuthClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {AuthClientProps} from '../auth-client-props';
import {
  InternalSuperUserPermissions,
  validateValidForSeconds,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {normalizeSdkError} from '@gomomento/sdk-core/dist/src/errors';
import {getWebControlEndpoint} from '../utils/web-client-utils';
import {ClientMetadataProvider} from './client-metadata-provider';
import {
  TemporaryTokenScope,
  asCachePermission,
  asPermissionsObject,
  asTopicPermission,
  isCachePermission,
  isPermissionsObject,
  isTopicPermission,
} from '@gomomento/sdk-core/dist/src/auth/tokens/token-scope';

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
    scope: TemporaryTokenScope,
    expiresIn: ExpiresIn
  ): Promise<GenerateDisposableToken.Response> {
    console.log('TODO: implement generateDisposableToken');

    const request = new _GenerateApiTokenRequest();
    request.setAuthToken(this.creds.getAuthToken());

    let permissions;
    try {
      permissions = permissionsFromScope(scope);
    } catch (err) {
      return new GenerateDisposableToken.Error(normalizeSdkError(err as Error));
    }

    request.setPermissions(permissions);

    if (expiresIn.doesExpire()) {
      try {
        validateValidForSeconds(expiresIn.seconds());
      } catch (err) {
        return new GenerateDisposableToken.Error(
          normalizeSdkError(err as Error)
        );
      }

      const grpcExpires = new Expires();
      grpcExpires.setValidForSeconds(expiresIn.seconds());
      request.setExpires(grpcExpires);
    } else {
      request.setNever(new Never());
    }

    return await new Promise<GenerateDisposableToken.Response>(resolve => {
      this.authClient.generateApiToken(
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
  scope: TokenScope
): _GenerateApiTokenRequest.Permissions {
  const result = new _GenerateApiTokenRequest.Permissions();
  if (scope instanceof InternalSuperUserPermissions) {
    result.setSuperUser(
      _GenerateApiTokenRequest.SuperUserPermissions.SUPERUSER
    );
    return result;
  } else if (isPermissionsObject(scope)) {
    const scopePermissions = asPermissionsObject(scope);
    const explicitPermissions =
      new _GenerateApiTokenRequest.ExplicitPermissions();
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
): _GenerateApiTokenRequest.PermissionsType {
  const result = new _GenerateApiTokenRequest.PermissionsType();
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
): _GenerateApiTokenRequest.PermissionsType.TopicPermissions {
  const grpcPermission =
    new _GenerateApiTokenRequest.PermissionsType.TopicPermissions();

  switch (permission.role) {
    case TopicRole.PublishSubscribe: {
      grpcPermission.setRole(_GenerateApiTokenRequest.TopicRole.TOPICREADWRITE);
      break;
    }
    case TopicRole.SubscribeOnly: {
      grpcPermission.setRole(_GenerateApiTokenRequest.TopicRole.TOPICREADONLY);
      break;
    }
    default: {
      throw new Error(`Unrecognized topic role: ${JSON.stringify(permission)}`);
    }
  }

  const cacheSelector =
    new _GenerateApiTokenRequest.PermissionsType.CacheSelector();

  if (permission.cache === AllCaches) {
    grpcPermission.setAllCaches(
      new _GenerateApiTokenRequest.PermissionsType.All()
    );
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

  const topicSelector =
    new _GenerateApiTokenRequest.PermissionsType.TopicSelector();

  if (permission.topic === AllTopics) {
    grpcPermission.setAllTopics(
      new _GenerateApiTokenRequest.PermissionsType.All()
    );
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

function cachePermissionToGrpcPermission(
  permission: CachePermission
): _GenerateApiTokenRequest.PermissionsType.CachePermissions {
  const grpcPermission =
    new _GenerateApiTokenRequest.PermissionsType.CachePermissions();

  switch (permission.role) {
    case CacheRole.ReadWrite: {
      grpcPermission.setRole(_GenerateApiTokenRequest.CacheRole.CACHEREADWRITE);
      break;
    }
    case CacheRole.ReadOnly: {
      grpcPermission.setRole(_GenerateApiTokenRequest.CacheRole.CACHEREADONLY);
      break;
    }
    default: {
      throw new Error(`Unrecognized cache role: ${JSON.stringify(permission)}`);
    }
  }

  const cacheSelector =
    new _GenerateApiTokenRequest.PermissionsType.CacheSelector();

  if (permission.cache === AllCaches) {
    grpcPermission.setAllCaches(
      new _GenerateApiTokenRequest.PermissionsType.All()
    );
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
