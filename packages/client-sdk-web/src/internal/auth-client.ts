import {auth} from '@gomomento/generated-types-webtext';
import {GenerateAuthToken, RefreshAuthToken} from '..';
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
  constructor() {
    const headers = [new Header('Agent', `nodejs:${version}`)];
    this.interceptors = [
      new HeaderInterceptorProvider<REQ, RESP>(
        headers
      ).createHeadersInterceptor(),
    ];
  }

  public async generateAuthToken(
    controlEndpoint: string,
    token: string,
    expiresIn: ExpiresIn
  ): Promise<GenerateAuthToken.Response> {
    const request = new _GenerateApiTokenRequest();
    request.setSessionToken(token);
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
    return await new Promise<GenerateAuthToken.Response>(resolve => {
      clientAuthWrapper.generateApiToken(request, null, (err, resp) => {
        if (err) {
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

  public refreshAuthToken(
    _credentialProvider: CredentialProvider,
    _refreshToken: string
  ): Promise<RefreshAuthToken.Response> {
    throw new Error('not implemented');
  }
}
