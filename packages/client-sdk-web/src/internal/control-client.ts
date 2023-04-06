import {auth, control} from '@gomomento/generated-types-webtext';
import {
  CreateCache,
  DeleteCache,
  ListCaches,
  CredentialProvider,
  MomentoLogger,
  CacheFlush,
  GenerateApiToken,
} from '..';
import {version} from '../../package.json';
import {Configuration} from '../config/configuration';
import {Request, StatusCode, UnaryInterceptor, UnaryResponse} from 'grpc-web';
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {
  _CreateCacheRequest,
  _DeleteCacheRequest,
  _ListCachesRequest,
  _FlushCacheRequest,
} from '@gomomento/generated-types-webtext/dist/controlclient_pb';
import {_GenerateApiTokenRequest} from '@gomomento/generated-types-webtext/dist/auth_pb';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  normalizeSdkError,
  validateCacheName,
  _Cache,
  _ListCachesResponse,
  IControlClient,
  _GenerateApiTokenResponse,
} from '@gomomento/common';
//import {_GenerateApiTokenRequest} from '@gomomento/generated-types-webtext/dist/auth_pb';
import Never = _GenerateApiTokenRequest.Never;
export interface ControlClientProps {
  configuration: Configuration;
  credentialProvider: CredentialProvider;
}

export class ControlClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> implements IControlClient
{
  private readonly clientWrapper: control.ScsControlClient;
  private readonly clientAuthWrapper: auth.AuthClient;
  private readonly interceptors: UnaryInterceptor<REQ, RESP>[];
  // private static readonly REQUEST_TIMEOUT_MS: number = 60 * 1000;
  private readonly logger: MomentoLogger;
  private readonly authHeaders: {authorization: string};

  /**
   * @param {ControlClientProps} props
   */
  constructor(props: ControlClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    const headers = [new Header('Agent', `nodejs:${version}`)];
    this.interceptors = [
      new HeaderInterceptorProvider<REQ, RESP>(
        headers
      ).createHeadersInterceptor(),
      // ClientTimeoutInterceptor(ControlClient.REQUEST_TIMEOUT_MS),
    ];
    this.logger.debug(
      `Creating control client using endpoint: '${props.credentialProvider.getControlEndpoint()}`
    );
    // this.clientWrapper = new IdleGrpcClientWrapper({
    //   clientFactoryFn: () =>
    //     new grpcControl.ScsControlClient(
    //       props.credentialProvider.getControlEndpoint(),
    //       ChannelCredentials.createSsl()
    //     ),
    //   configuration: props.configuration,
    // });
    console.log(
      `\n\n\nCreating control client with endpoint: ${props.credentialProvider.getControlEndpoint()}\n\n\n`
    );

    this.authHeaders = {authorization: props.credentialProvider.getAuthToken()};
    this.clientWrapper = new control.ScsControlClient(
      `https://${props.credentialProvider.getControlEndpoint()}`,
      null,
      {
        unaryInterceptors: this.interceptors,
      }
    );
    this.clientAuthWrapper = new auth.AuthClient(
      `https://${props.credentialProvider.getControlEndpoint()}`,
      null,
      {
        unaryInterceptors: this.interceptors,
      }
    );
  }

  public async createCache(name: string): Promise<CreateCache.Response> {
    try {
      validateCacheName(name);
    } catch (err) {
      return new CreateCache.Error(normalizeSdkError(err as Error));
    }
    this.logger.info(`Creating cache: ${name}`);
    const request = new _CreateCacheRequest();
    request.setCacheName(name);

    return await new Promise<CreateCache.Response>(resolve => {
      this.clientWrapper.createCache(
        request,
        this.authHeaders,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err, resp) => {
          if (err) {
            if (err.code === StatusCode.ALREADY_EXISTS) {
              resolve(new CreateCache.AlreadyExists());
            } else {
              resolve(new CreateCache.Error(cacheServiceErrorMapper(err)));
            }
          } else {
            resolve(new CreateCache.Success());
          }
        }
      );
    });
  }

  public async deleteCache(name: string): Promise<DeleteCache.Response> {
    try {
      validateCacheName(name);
    } catch (err) {
      return new DeleteCache.Error(normalizeSdkError(err as Error));
    }
    const request = new _DeleteCacheRequest();
    request.setCacheName(name);
    this.logger.info(`Deleting cache: ${name}`);
    return await new Promise<DeleteCache.Response>(resolve => {
      this.clientWrapper.deleteCache(
        request,
        this.authHeaders,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err, resp) => {
          if (err) {
            resolve(new DeleteCache.Error(cacheServiceErrorMapper(err)));
          } else {
            resolve(new DeleteCache.Success());
          }
        }
      );
    });
  }

  public async flushCache(cacheName: string): Promise<CacheFlush.Response> {
    try {
      validateCacheName(cacheName);
    } catch (err) {
      return new CacheFlush.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(`Flushing cache: ${cacheName}`);
    return await this.sendFlushCache(cacheName);
  }

  private async sendFlushCache(
    cacheName: string
  ): Promise<CacheFlush.Response> {
    const request = new _FlushCacheRequest();
    request.setCacheName(cacheName);
    return await new Promise<CacheFlush.Response>(resolve => {
      this.clientWrapper.flushCache(
        request,
        this.authHeaders,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err, resp) => {
          if (resp) {
            resolve(new CacheFlush.Success());
          } else {
            resolve(new CacheFlush.Error(cacheServiceErrorMapper(err)));
          }
        }
      );
    });
  }

  public async listCaches(): Promise<ListCaches.Response> {
    const request = new _ListCachesRequest();
    request.setNextToken('');
    this.logger.debug("Issuing 'listCaches' request");
    return await new Promise<ListCaches.Response>(resolve => {
      this.clientWrapper.listCaches(request, this.authHeaders, (err, resp) => {
        if (err) {
          resolve(new ListCaches.Error(cacheServiceErrorMapper(err)));
        } else {
          const caches = resp
            .getCacheList()
            .map(cache => new _Cache(cache.getCacheName()));
          const listCachesResponse = new _ListCachesResponse(
            caches,
            resp?.getNextToken()
          );
          resolve(new ListCaches.Success(listCachesResponse));
        }
      });
    });
  }

  public async generateApiToken(
    sessionToken: string
  ): Promise<GenerateApiToken.Response> {
    const request = new _GenerateApiTokenRequest();
    request.setNever(new Never());
    this.logger.debug("Issuing 'generateApiToken' request");
    return await new Promise<GenerateApiToken.Response>(resolve => {
      this.clientAuthWrapper.generateApiToken(
        request,
        {authorization: sessionToken},
        (err, resp) => {
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
        }
      );
    });
  }

  // public async createSigningKey(
  //   ttlMinutes: number,
  //   endpoint: string
  // ): Promise<CreateSigningKey.Response> {
  //   try {
  //     validateTtlMinutes(ttlMinutes);
  //   } catch (err) {
  //     return new CreateSigningKey.Error(normalizeSdkError(err as Error));
  //   }
  //   this.logger.debug("Issuing 'createSigningKey' request");
  //   const request = new _CreateSigningKeyRequest();
  //   request.setTtlMinutes(ttlMinutes);
  //   return await new Promise<CreateSigningKey.Response>(resolve => {
  //     this.clientWrapper.createSigningKey(
  //       request,
  //       this.authHeaders,
  //       (err, resp) => {
  //         if (err) {
  //           resolve(new CreateSigningKey.Error(cacheServiceErrorMapper(err)));
  //         } else {
  //           const signingKey = new _SigningKey(
  //             resp?.getKey(),
  //             resp?.getExpiresAt()
  //           );
  //           resolve(new CreateSigningKey.Success(endpoint, signingKey));
  //         }
  //       }
  //     );
  //   });
  // }
  //
  // public async revokeSigningKey(
  //   keyId: string
  // ): Promise<RevokeSigningKey.Response> {
  //   const request = new _RevokeSigningKeyRequest();
  //   request.setKeyId(keyId);
  //   this.logger.debug("Issuing 'revokeSigningKey' request");
  //   return await new Promise<RevokeSigningKey.Response>(resolve => {
  //     this.clientWrapper.revokeSigningKey(request, this.authHeaders, err => {
  //       if (err) {
  //         resolve(new RevokeSigningKey.Error(cacheServiceErrorMapper(err)));
  //       } else {
  //         resolve(new RevokeSigningKey.Success());
  //       }
  //     });
  //   });
  // }
  //
  // public async listSigningKeys(
  //   endpoint: string
  // ): Promise<ListSigningKeys.Response> {
  //   const request = new _ListSigningKeysRequest();
  //   request.setNextToken('');
  //   this.logger.debug("Issuing 'listSigningKeys' request");
  //   return await new Promise<ListSigningKeys.Response>(resolve => {
  //     this.clientWrapper.listSigningKeys(
  //       request,
  //       this.authHeaders,
  //       (err, resp) => {
  //         if (err) {
  //           resolve(new ListSigningKeys.Error(cacheServiceErrorMapper(err)));
  //         } else {
  //           const signingKeys = resp
  //             .getSigningKeyList()
  //             .map(sk => new _SigningKey(sk.getKeyId(), sk.getExpiresAt()));
  //           const listSigningKeyResponse = new _ListSigningKeysResponse(
  //             signingKeys,
  //             resp.getNextToken()
  //           );
  //           resolve(
  //             new ListSigningKeys.Success(endpoint, listSigningKeyResponse)
  //           );
  //         }
  //       }
  //     );
  //   });
  // }
}
