import {auth} from '@gomomento/generated-types-webtext';
import {MomentoLogger, GenerateApiToken} from '..';
import {version} from '../../package.json';
import {Configuration} from '../config/configuration';
import {Request, UnaryInterceptor, UnaryResponse} from 'grpc-web';
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {_GenerateApiTokenRequest} from '@gomomento/generated-types-webtext/dist/auth_pb';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import Never = _GenerateApiTokenRequest.Never;
import Expires = _GenerateApiTokenRequest.Expires;
import {ExpiresAt, ExpiresIn} from '../../../core';
import {validateValidForSeconds} from '../../../core/dist/src/internal/utils';
import {normalizeSdkError} from '../../../core/dist/src/errors';

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
    controlEndpoint: string,
    sessionToken: string,
    expiresIn: ExpiresIn
  ): Promise<GenerateApiToken.Response> {
    const request = new _GenerateApiTokenRequest();
    request.setSessionToken(sessionToken);

    if (expiresIn.doesExpire()) {
      try {
        validateValidForSeconds(expiresIn.seconds());
      } catch (err) {
        return new GenerateApiToken.Error(normalizeSdkError(err as Error));
      }

      request.setExpires(new Expires().setValidForSeconds(expiresIn.seconds()));
    } else {
      request.setNever(new Never());
    }
    this.logger.debug("Issuing 'generateApiToken' request");
    return await new Promise<GenerateApiToken.Response>(resolve => {
      this.clientAuthWrapper.generateApiToken(request, null, (err, resp) => {
        if (err) {
          resolve(new GenerateApiToken.Error(cacheServiceErrorMapper(err)));
        } else {
          resolve(
            new GenerateApiToken.Success(
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
