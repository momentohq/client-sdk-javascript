import {auth} from '@gomomento/generated-types-webtext';
import {GenerateAuthToken, RefreshAuthToken} from '..';
import {version} from '../../package.json';
import {Request, UnaryInterceptor, UnaryResponse} from 'grpc-web';
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
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
  Permissions,
  Permission,
  TopicPermission,
  CachePermission,
  CacheRole,
  TopicRole,
} from '@gomomento/sdk-core';
import {IAuthClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {AuthClientProps} from '../auth-client-props';
import {
  InternalSuperUserPermissions,
  validateValidForSeconds,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {normalizeSdkError} from '@gomomento/sdk-core/dist/src/errors';

export class InternalWebGrpcAuthClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> implements IAuthClient
{
  private readonly creds: CredentialProvider;
  private readonly interceptors: UnaryInterceptor<REQ, RESP>[];

  constructor(props: AuthClientProps) {
    this.creds = props.credentialProvider;
    const headers = [new Header('Agent', `nodejs:${version}`)];

    this.interceptors = [
      new HeaderInterceptorProvider<REQ, RESP>(
        headers
      ).createHeadersInterceptor(),
    ];
  }

  public async generateAuthToken(
    scope: TokenScope,
    expiresIn: ExpiresIn
  ): Promise<GenerateAuthToken.Response> {
    const authClient = new auth.AuthClient(
      `https://${this.creds.getControlEndpoint()}`,
      null,
      {
        unaryInterceptors: this.interceptors,
      }
    );

    const request = new _GenerateApiTokenRequest();
    request.setAuthToken(this.creds.getAuthToken());
    request.setPermissions(permissionsFromScope(scope));

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
      authClient.generateApiToken(request, null, (err, resp) => {
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
      });
    });
  }

  public async refreshAuthToken(
    _refreshToken: string
  ): Promise<RefreshAuthToken.Response> {
    const authClient = new auth.AuthClient(
      `https://${this.creds.getControlEndpoint()}`,
      null,
      {
        unaryInterceptors: this.interceptors,
      }
    );

    const request = new _RefreshApiTokenRequest();
    request.setApiKey(this.creds.getAuthToken());
    request.setRefreshToken(_refreshToken);

    return await new Promise<RefreshAuthToken.Response>(resolve => {
      authClient.refreshApiToken(request, null, (err, resp) => {
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
      });
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
  } else if (scope instanceof Permissions) {
    const explicitPermissions =
      new _GenerateApiTokenRequest.ExplicitPermissions();
    explicitPermissions.setPermissionsList(
      scope.permissions.map(p => tokenPermissionToGrpcPermission(p))
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
  if (permission instanceof TopicPermission) {
    result.setTopicPermissions(topicPermissionToGrpcPermission(permission));
    return result;
  } else if (permission instanceof CachePermission) {
    result.setCachePermissions(cachePermissionToGrpcPermission(permission));
    return result;
  }
  throw new Error(
    `Unrecognized token permission: ${JSON.stringify(permission)}`
  );
}

function topicPermissionToGrpcPermission(
  permission: TopicPermission
): _GenerateApiTokenRequest.PermissionsType.TopicPermissions {
  switch (permission.topicRole) {
    case TopicRole.None:
      throw new Error('TopicRole.None not yet supported');
    case TopicRole.ReadWrite: {
      const grpcPermission =
        new _GenerateApiTokenRequest.PermissionsType.TopicPermissions();
      grpcPermission.setRole(_GenerateApiTokenRequest.TopicRole.TOPICREADWRITE);
      return grpcPermission;
    }
  }

  throw new Error(
    `Unrecognized topic permission: ${JSON.stringify(permission)}`
  );
}

function cachePermissionToGrpcPermission(
  permission: CachePermission
): _GenerateApiTokenRequest.PermissionsType.CachePermissions {
  switch (permission.cacheRole) {
    case CacheRole.None:
      throw new Error('CacheRole.None not yet supported');
    case CacheRole.ReadWrite: {
      const grpcPermission =
        new _GenerateApiTokenRequest.PermissionsType.CachePermissions();
      grpcPermission.setRole(_GenerateApiTokenRequest.CacheRole.CACHEREADWRITE);
      return grpcPermission;
    }
  }

  throw new Error(
    `Unrecognized cache permission: ${JSON.stringify(permission)}`
  );
}
