import {auth} from '@gomomento/generated-types-webtext';
import {MomentoLogger, GenerateApiToken} from '..';
import {version} from '../../package.json';
import {Configuration} from '../config/configuration';
import {Request, UnaryInterceptor, UnaryResponse} from 'grpc-web';
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {_GenerateApiTokenRequest} from '@gomomento/generated-types-webtext/dist/auth_pb';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {_GenerateApiTokenResponse} from '@gomomento/common';
import Never = _GenerateApiTokenRequest.Never;
import Expires = _GenerateApiTokenRequest.Expires;

export interface AuthClientProps {
  configuration: Configuration;
  controlEndpoint: string;
}

export class InternalWebGrpcAuthClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> {
  private readonly clientAuthWrapper: auth.AuthClient;
  private readonly interceptors: UnaryInterceptor<REQ, RESP>[];
  private readonly logger: MomentoLogger;

  /**
   * @param {AuthClientProps} props
   */
  constructor(props: AuthClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    const headers = [new Header('Agent', `nodejs:${version}`)];
    this.interceptors = [
      new HeaderInterceptorProvider<REQ, RESP>(
        headers
      ).createHeadersInterceptor(),
    ];
    this.logger.debug(
      `Creating control client using endpoint: ${props.controlEndpoint}`
    );
    this.clientAuthWrapper = new auth.AuthClient(
      `https://${props.controlEndpoint}`,
      null,
      {
        unaryInterceptors: this.interceptors,
      }
    );
  }

  public async generateApiToken(
    sessionToken: string,
    validUntilSeconds?: number
  ): Promise<GenerateApiToken.Response> {
    const request = new _GenerateApiTokenRequest();
    request.setSessionToken(sessionToken);
    if (validUntilSeconds) {
      request.setExpires(new Expires().setValidForSeconds(validUntilSeconds));
    } else {
      request.setNever(new Never());
    }
    this.logger.debug("Issuing 'generateApiToken' request");
    return await new Promise<GenerateApiToken.Response>(resolve => {
      this.clientAuthWrapper.generateApiToken(request, null, (err, resp) => {
        if (err) {
          resolve(new GenerateApiToken.Error(cacheServiceErrorMapper(err)));
        } else {
          const generateApiTokenResponse = new _GenerateApiTokenResponse(
            resp.getApiKey(),
            resp.getRefreshToken(),
            resp.getEndpoint(),
            resp.getValidUntil()
          );
          resolve(new GenerateApiToken.Success(generateApiTokenResponse));
        }
      });
    });
  }
}
