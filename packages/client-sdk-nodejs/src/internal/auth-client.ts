import {auth} from '@gomomento/generated-types';
import grpcAuth = auth.auth;
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {GenerateApiToken, RefreshApiToken, MomentoLogger} from '..';
import {version} from '../../package.json';
import {IdleGrpcClientWrapper} from './grpc/idle-grpc-client-wrapper';
import {Configuration} from '../config/configuration';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {normalizeSdkError} from '@gomomento/sdk-core/dist/src/errors';
import {validateValidForSeconds} from '@gomomento/sdk-core/dist/src/internal/utils';
import Never = grpcAuth._GenerateApiTokenRequest.Never;
import Expires = grpcAuth._GenerateApiTokenRequest.Expires;
import {
  ExpiresIn,
  ExpiresAt,
  CredentialProvider,
} from '@gomomento/sdk-core/dist/src';

export interface AuthClientProps {
  configuration: Configuration;
}

export class AuthClient {
  private static readonly REQUEST_TIMEOUT_MS: number = 60 * 1000;

  private readonly interceptors: Interceptor[];
  private readonly logger: MomentoLogger;
  private readonly config: Configuration;

  /**
   * @param {AuthClientProps} props
   */
  constructor(props: AuthClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    const headers = [new Header('Agent', `nodejs:${version}`)];
    this.interceptors = [
      new HeaderInterceptorProvider(headers).createHeadersInterceptor(),
      ClientTimeoutInterceptor(AuthClient.REQUEST_TIMEOUT_MS),
    ];
    this.config = props.configuration;
  }

  public async generateApiToken(
    controlEndpoint: string,
    sessionToken: string,
    expiresIn: ExpiresIn
  ): Promise<GenerateApiToken.Response> {
    const generateClientWrapper = new IdleGrpcClientWrapper({
      clientFactoryFn: () =>
        new grpcAuth.AuthClient(
          controlEndpoint,
          ChannelCredentials.createSsl()
        ),
      configuration: this.config,
    });

    this.logger.info(
      `Creating control client using endpoint: '${controlEndpoint}`
    );

    const request = new grpcAuth._GenerateApiTokenRequest({
      session_token: sessionToken,
    });

    if (expiresIn.doesExpire()) {
      try {
        validateValidForSeconds(expiresIn.seconds());
      } catch (err) {
        return new GenerateApiToken.Error(normalizeSdkError(err as Error));
      }

      request.expires = new Expires({
        valid_for_seconds: expiresIn.seconds()!,
      });
    } else {
      request.never = new Never();
    }

    return await new Promise<GenerateApiToken.Response>(resolve => {
      generateClientWrapper
        .getClient()
        .GenerateApiToken(
          request,
          {interceptors: this.interceptors},
          (err, resp) => {
            if (err || !resp) {
              resolve(new GenerateApiToken.Error(cacheServiceErrorMapper(err)));
            } else {
              resolve(
                new GenerateApiToken.Success(
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

  public async refreshApiToken(
    credentialProvider: CredentialProvider,
    refreshToken: string
  ): Promise<RefreshApiToken.Response> {
    const refreshClientWrapper = new IdleGrpcClientWrapper({
      clientFactoryFn: () =>
        new grpcAuth.AuthClient(
          credentialProvider.getControlEndpoint(),
          ChannelCredentials.createSsl()
        ),
      configuration: this.config,
    });

    this.logger.info(
      `Creating control client using endpoint: '${credentialProvider.getControlEndpoint()}`
    );

    const request = new grpcAuth._RefreshApiTokenRequest({
      api_key: credentialProvider.getAuthToken(),
      refresh_token: refreshToken,
    });

    return await new Promise<RefreshApiToken.Response>(resolve => {
      refreshClientWrapper
        .getClient()
        .RefreshApiToken(
          request,
          {interceptors: this.interceptors},
          (err, resp) => {
            if (err || !resp) {
              resolve(new RefreshApiToken.Error(cacheServiceErrorMapper(err)));
            } else {
              resolve(
                new RefreshApiToken.Success(
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
