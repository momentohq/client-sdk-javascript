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
  asCachePermission,
  asPermissionsObject,
  asTopicPermission,
  isCachePermission,
  isPermissionsObject,
  isTopicPermission,
} from '@gomomento/sdk-core/dist/src/auth/tokens/token-scope';
import {
  ExplicitPermissions,
  Permissions,
  PermissionsType,
  SuperUserPermissions,
  TopicRole as grcpTopicRole,
  CacheRole as grpcCacheRole,
} from '@gomomento/generated-types-webtext/dist/permissions_pb';

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
}

export function permissionsFromScope(scope: TokenScope): Permissions {
  const result = new Permissions();
  if (scope instanceof InternalSuperUserPermissions) {
    result.setSuperUser(SuperUserPermissions.SUPERUSER);
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
      grpcPermission.setRole(grcpTopicRole.TOPICREADWRITE);
      break;
    }
    case TopicRole.SubscribeOnly: {
      grpcPermission.setRole(grcpTopicRole.TOPICREADONLY);
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

function cachePermissionToGrpcPermission(
  permission: CachePermission
): PermissionsType.CachePermissions {
  const grpcPermission = new PermissionsType.CachePermissions();

  switch (permission.role) {
    case CacheRole.ReadWrite: {
      grpcPermission.setRole(grpcCacheRole.CACHEREADWRITE);
      break;
    }
    case CacheRole.ReadOnly: {
      grpcPermission.setRole(grpcCacheRole.CACHEREADONLY);
      break;
    }
    default: {
      throw new Error(`Unrecognized cache role: ${JSON.stringify(permission)}`);
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
      `Unrecognized cache specification in cache permission: ${JSON.stringify(
        permission
      )}`
    );
  }

  return grpcPermission;
}
