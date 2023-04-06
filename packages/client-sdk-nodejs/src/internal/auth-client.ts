import {auth} from '@gomomento/generated-types';
import grpcAuth = auth.auth;
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {GenerateApiToken, CredentialProvider, MomentoLogger} from '..';
import {version} from '../../package.json';
import {IdleGrpcClientWrapper} from './grpc/idle-grpc-client-wrapper';
import {GrpcClientWrapper} from './grpc/grpc-client-wrapper';
import {Configuration} from '../config/configuration';
import {_GenerateApiTokenResponse} from '@gomomento/core/dist/src/messages/responses/grpc-response-types';

export interface AuthClientProps {
  configuration: Configuration;
  credentialProvider: CredentialProvider;
}

export class AuthClient {
  private readonly clientAuthWrapper: GrpcClientWrapper<grpcAuth.AuthClient>;
  private readonly interceptors: Interceptor[];
  private static readonly REQUEST_TIMEOUT_MS: number = 60 * 1000;
  private readonly logger: MomentoLogger;

  /**
   * @param {AuthClientProps} props
   */
  constructor(props: AuthClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
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
    this.clientAuthWrapper = new IdleGrpcClientWrapper({
      clientFactoryFn: () =>
        new grpcAuth.AuthClient(
          props.credentialProvider.getControlEndpoint(),
          ChannelCredentials.createSsl()
        ),
      configuration: props.configuration,
    });
  }

  public async generateApiToken(
    sessionToken: string,
    validUntilSeconds?: number
  ): Promise<GenerateApiToken.Response> {
    const request = new grpcAuth._GenerateApiTokenRequest();
    request.session_token = sessionToken;
    if (validUntilSeconds) {
      request.expires = new grpcAuth._GenerateApiTokenRequest.Expires({
        valid_for_seconds: validUntilSeconds,
      });
    } else {
      request.never = new grpcAuth._GenerateApiTokenRequest.Never();
    }
    this.logger.debug("Issuing 'generateApiToken' request");
    return await new Promise<GenerateApiToken.Response>(resolve => {
      this.clientAuthWrapper
        .getClient()
        .GenerateApiToken(
          request,
          {interceptors: this.interceptors},
          (err, resp) => {
            if (err) {
              resolve(new GenerateApiToken.Error(cacheServiceErrorMapper(err)));
            } else {
              const generateApiTokenResponse = new _GenerateApiTokenResponse(
                resp?.api_key,
                resp?.refresh_token,
                resp?.endpoint,
                resp?.valid_until
              );
              resolve(new GenerateApiToken.Success(generateApiTokenResponse));
            }
          }
        );
    });
  }
}
