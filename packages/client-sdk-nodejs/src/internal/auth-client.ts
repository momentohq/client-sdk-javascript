import {auth} from '@gomomento/generated-types';
import grpcAuth = auth.auth;
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {version} from '../../package.json';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {normalizeSdkError} from '@gomomento/sdk-core/dist/src/errors';
import {validateValidForSeconds} from '@gomomento/sdk-core/dist/src/internal/utils';
import Never = grpcAuth._GenerateApiTokenRequest.Never;
import Expires = grpcAuth._GenerateApiTokenRequest.Expires;
import {
  ExpiresIn,
  ExpiresAt,
  CredentialProvider,
  RefreshAuthToken,
  GenerateAuthToken,
} from '@gomomento/sdk-core/dist/src';

interface MomentoRoleProps {
  expiresIn: ExpiresIn;
}

abstract class MomentoRole {
  private readonly _expiresIn: ExpiresIn;
  constructor(props: MomentoRoleProps) {
    this._expiresIn = props.expiresIn;
  }

  public expiresIn(): ExpiresIn {
    return this._expiresIn;
  }
}

class DataPlaneReadOnlyRole extends MomentoRole {
  constructor(props: {expiresInSeconds: number}) {
    // these readonly roles can have a max expiration of 1 day
    const oneDayInSeconds = 24 * 60 * 60;
    let numSecondsToUse: number;
    if (props.expiresInSeconds > oneDayInSeconds) {
      console.warn(
        'requested number of seconds til expiration is greater than 1 day, limiting expiration time to a day'
      );
      numSecondsToUse = oneDayInSeconds;
    } else {
      numSecondsToUse = props.expiresInSeconds;
    }
    const expiresIn = ExpiresIn.seconds(numSecondsToUse);
    super({expiresIn});
  }
}

class GodTierRole extends MomentoRole {
  constructor(props: MomentoRoleProps) {
    super(props);
  }
}

interface TopicSpecificRoleProps extends MomentoRoleProps {
  topicName: string;
  cacheName: string;
}

class TopicSpecificRole extends MomentoRole {
  private readonly _topicName: string;
  private readonly _cacheName: string;
  constructor(props: TopicSpecificRoleProps) {
    super(props);

    this._topicName = props.topicName;
    this._cacheName = props.cacheName;
  }

  public topicName(): string {
    return this._topicName;
  }

  public cacheName(): string {
    return this._cacheName;
  }
}

export class AuthClient {
  private static readonly REQUEST_TIMEOUT_MS: number = 60 * 1000;

  private readonly interceptors: Interceptor[];

  constructor() {
    const headers = [new Header('Agent', `nodejs:${version}`)];
    this.interceptors = [
      new HeaderInterceptorProvider(headers).createHeadersInterceptor(),
      ClientTimeoutInterceptor(AuthClient.REQUEST_TIMEOUT_MS),
    ];
  }

  public async generateAuthToken(
    credentialsProvider: CredentialProvider,
    role: MomentoRole
  ): Promise<GenerateAuthToken.Response> {
    const authClient = new grpcAuth.AuthClient(
      credentialsProvider.getControlEndpoint(),
      ChannelCredentials.createSsl()
    );

    const request = new grpcAuth._GenerateApiTokenRequest({
      session_token: credentialsProvider.getAuthToken(),
    });

    if (role instanceof GodTierRole) {
      // handle creating role request
    } else if (role instanceof DataPlaneReadOnlyRole) {
      // handle creating role request
    } else if (role instanceof TopicSpecificRole) {
      // handle creating role request
    }

    if (role.expiresIn().doesExpire()) {
      try {
        validateValidForSeconds(role.expiresIn().seconds());
      } catch (err) {
        return new GenerateAuthToken.Error(normalizeSdkError(err as Error));
      }

      request.expires = new Expires({
        valid_for_seconds: role.expiresIn().seconds(),
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
    credentialProvider: CredentialProvider,
    refreshToken: string
  ): Promise<RefreshAuthToken.Response> {
    const authClient = new grpcAuth.AuthClient(
      credentialProvider.getControlEndpoint(),
      ChannelCredentials.createSsl()
    );

    const request = new grpcAuth._RefreshApiTokenRequest({
      api_key: credentialProvider.getAuthToken(),
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
