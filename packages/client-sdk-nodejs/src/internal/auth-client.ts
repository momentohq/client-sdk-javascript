import {auth} from '@gomomento/generated-types';
import grpcAuth = auth.auth;
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {GenerateApiToken, CredentialProvider, MomentoLogger} from '..';
import {version} from '../../package.json';
import {IdleGrpcClientWrapper} from './grpc/idle-grpc-client-wrapper';
import {GrpcClientWrapper} from './grpc/grpc-client-wrapper';
import {Configuration} from '../config/configuration';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';

export interface AuthClientProps {
  configuration: Configuration;
  credentialProvider: CredentialProvider;
}

export class AuthClient {
  private readonly clientWrapper: GrpcClientWrapper<grpcAuth.AuthClient>;
  private readonly interceptors: Interceptor[];
  private static readonly REQUEST_TIMEOUT_MS: number = 60 * 1000;
  private readonly logger: MomentoLogger;
  private readonly sessionToken: string;

  /**
   * @param {AuthClientProps} props
   */
  constructor(props: AuthClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.sessionToken = props.credentialProvider.getAuthToken();
    const headers = [
      new Header('Authorization', props.credentialProvider.getAuthToken()),
      new Header('Agent', `nodejs:${version}`),
    ];
    this.interceptors = [
      new HeaderInterceptorProvider(headers).createHeadersInterceptor(),
      ClientTimeoutInterceptor(AuthClient.REQUEST_TIMEOUT_MS),
    ];
    this.logger.debug(
      `Creating control client using endpoint: '${props.credentialProvider.getControlEndpoint()}`
    );
    this.clientWrapper = new IdleGrpcClientWrapper({
      clientFactoryFn: () =>
        new grpcAuth.AuthClient(
          props.credentialProvider.getControlEndpoint(),
          ChannelCredentials.createSsl()
        ),
      configuration: props.configuration,
    });
  }

  public async GenerateApiToken(): Promise<GenerateApiToken.Response> {
    const request = new grpcAuth._GenerateApiTokenRequest({
      session_token: this.sessionToken,
    });
    return await new Promise<GenerateApiToken.Response>(resolve => {
      this.clientWrapper
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
                  resp.valid_until
                )
              );
            }
          }
        );
    });
  }

  public async RefreshApiToken(
    api_key: string,
    refresh_token: string
  ): Promise<GenerateApiToken.Response> {
    const request = new grpcAuth._RefreshApiTokenRequest({
      api_key: api_key,
      refresh_token: refresh_token,
    });
    return await new Promise<GenerateApiToken.Response>(resolve => {
      this.clientWrapper
        .getClient()
        .RefreshApiToken(
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
                  resp.valid_until
                )
              );
            }
          }
        );
    });
  }
}
