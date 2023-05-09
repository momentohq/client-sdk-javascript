import {auth} from '@gomomento/generated-types-webtext';
import {MomentoLogger, GenerateApiToken} from '..';
import {version} from '../../package.json';
import {Request, UnaryInterceptor, UnaryResponse} from 'grpc-web';
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {_GenerateApiTokenRequest} from '@gomomento/generated-types-webtext/dist/auth_pb';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import Never = _GenerateApiTokenRequest.Never;
import Expires = _GenerateApiTokenRequest.Expires;
import {CredentialProvider, ExpiresAt, ExpiresIn} from '@gomomento/sdk-core';

export class InternalWebGrpcAuthClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> {
  private readonly interceptors: UnaryInterceptor<REQ, RESP>[];
  private readonly logger: MomentoLogger;

  constructor() {
    const headers = [new Header('Agent', `nodejs:${version}`)];
    this.interceptors = [
      new HeaderInterceptorProvider<REQ, RESP>(
        headers
      ).createHeadersInterceptor(),
    ];
  }

  public async generateApiToken(
    controlEndpoint: string,
    sessionToken: string,
    expiresIn: ExpiresIn
  ): Promise<GenerateApiToken.Response> {
    const request = new _GenerateApiTokenRequest();
    request.setSessionToken(sessionToken);
    if (expiresIn.doesExpire()) {
      request.setExpires(new Expires().setValidForSeconds(expiresIn.seconds()));
    } else {
      request.setNever(new Never());
    }
    const clientAuthWrapper = new auth.AuthClient(
      `https://${controlEndpoint}`,
      null,
      {
        unaryInterceptors: this.interceptors,
      }
    );
    this.logger.debug("Issuing 'generateApiToken' request");
    return await new Promise<GenerateApiToken.Response>(resolve => {
      clientAuthWrapper.generateApiToken(request, null, (err, resp) => {
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

  public refreshApiToken(
    _credentialProvider: CredentialProvider,
    _refreshToken: string
  ): Promise<GenerateApiToken.Response> {
    throw new Error('not implemented');
  }
}
