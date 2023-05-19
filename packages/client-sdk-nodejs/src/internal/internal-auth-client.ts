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
} from '@gomomento/sdk-core';
import {IAuthClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {AuthClientProps} from '../auth-client-props';
import {normalizeSdkError} from '@gomomento/sdk-core/dist/src/errors';

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

    const request = new grpcAuth._GenerateApiTokenRequest({
      auth_token: this.creds.getAuthToken(),
      permissions: permissionsFromScope(scope),
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
  switch (permission.topicRole) {
    case TopicRole.None:
      throw new Error('TopicRole.None not yet supported');
    case TopicRole.ReadWrite: {
      const grpcPermission =
        new grpcAuth._GenerateApiTokenRequest.PermissionsType.TopicPermissions();
      grpcPermission.role =
        grpcAuth._GenerateApiTokenRequest.TopicRole.TopicReadWrite;
      return grpcPermission;
    }
  }

  throw new Error(
    `Unrecognized topic permission: ${JSON.stringify(permission)}`
  );
}

function cachePermissionToGrpcPermission(
  permission: CachePermission
): grpcAuth._GenerateApiTokenRequest.PermissionsType.CachePermissions {
  switch (permission.cacheRole) {
    case CacheRole.None:
      throw new Error('CacheRole.None not yet supported');
    case CacheRole.ReadWrite: {
      const grpcPermission =
        new grpcAuth._GenerateApiTokenRequest.PermissionsType.CachePermissions();
      grpcPermission.role =
        grpcAuth._GenerateApiTokenRequest.CacheRole.CacheReadWrite;
      return grpcPermission;
    }
  }

  throw new Error(
    `Unrecognized cache permission: ${JSON.stringify(permission)}`
  );
}
