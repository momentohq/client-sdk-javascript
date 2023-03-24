// import {control} from '@gomomento/generated-types';
import {control} from '@gomomento/generated-types-webtext';
// import grpcControl = control.control_client;
// import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
// import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
// import {Status} from '@grpc/grpc-js/build/src/constants';
// import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
// import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {
  CreateCache,
  DeleteCache,
  ListCaches,
  CredentialProvider,
  MomentoLogger,
} from '..';
import {version} from '../../package.json';
// import {IdleGrpcClientWrapper} from './grpc/idle-grpc-client-wrapper';
// import {GrpcClientWrapper} from './grpc/grpc-client-wrapper';
import {Configuration} from '../config/configuration';
import {validateCacheName} from '@gomomento/core/dist/src/internal/utils';
import {normalizeSdkError} from '@gomomento/core/dist/src/errors';
import {
  _Cache,
  _ListCachesResponse,
  // _ListSigningKeysResponse,
  // _SigningKey,
} from '@gomomento/core/dist/src/messages/responses/grpc-response-types';
import {Request, StatusCode, UnaryInterceptor, UnaryResponse} from 'grpc-web';
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {
  _CreateCacheRequest,
  _DeleteCacheRequest,
  _ListCachesRequest,
} from '@gomomento/generated-types-webtext/dist/controlclient_pb';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';

export interface ControlClientProps {
  configuration: Configuration;
  credentialProvider: CredentialProvider;
}

export class ControlClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> {
  // private readonly clientWrapper: GrpcClientWrapper<control.ScsControlClient>;
  private readonly clientWrapper: control.ScsControlClient;
  private readonly interceptors: UnaryInterceptor<REQ, RESP>[];
  // private static readonly REQUEST_TIMEOUT_MS: number = 60 * 1000;
  private readonly logger: MomentoLogger;

  /**
   * @param {ControlClientProps} props
   */
  constructor(props: ControlClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    const headers = [
      new Header('Authorization', props.credentialProvider.getAuthToken()),
      new Header('Agent', `nodejs:${version}`),
    ];
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
      `\n\n\nCreating control client with endpoint: ${props.credentialProvider.getCacheEndpoint()}\n\n\n`
    );
    this.clientWrapper = new control.ScsControlClient(
      `https://${props.credentialProvider.getCacheEndpoint()}`,
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
        null,
        // {interceptors: this.interceptors},
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
        null,
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

  // public async flushCache(cacheName: string): Promise<CacheFlush.Response> {
  //   try {
  //     validateCacheName(cacheName);
  //   } catch (err) {
  //     return new CacheFlush.Error(normalizeSdkError(err as Error));
  //   }
  //   this.logger.trace(`Flushing cache: ${cacheName}`);
  //   return await this.sendFlushCache(cacheName);
  // }
  //
  // private async sendFlushCache(
  //   cacheName: string
  // ): Promise<CacheFlush.Response> {
  //   const request = new grpcControl._FlushCacheRequest({
  //     cache_name: cacheName,
  //   });
  //   return await new Promise(resolve => {
  //     this.clientWrapper.getClient().FlushCache(
  //       request,
  //       {
  //         interceptors: this.interceptors,
  //       },
  //       (err, resp) => {
  //         if (resp) {
  //           resolve(new CacheFlush.Success());
  //         } else {
  //           resolve(new CacheFlush.Error(cacheServiceErrorMapper(err)));
  //         }
  //       }
  //     );
  //   });
  // }

  public async listCaches(): Promise<ListCaches.Response> {
    const request = new _ListCachesRequest();
    request.setNextToken('');
    this.logger.debug("Issuing 'listCaches' request");
    return await new Promise<ListCaches.Response>(resolve => {
      this.clientWrapper.listCaches(request, null, (err, resp) => {
        if (err) {
          resolve(new ListCaches.Error(cacheServiceErrorMapper(err)));
        } else {
          const caches = resp
            ?.getCacheList()
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
  //   const request = new grpcControl._CreateSigningKeyRequest();
  //   request.ttl_minutes = ttlMinutes;
  //   return await new Promise<CreateSigningKey.Response>(resolve => {
  //     this.clientWrapper
  //       .getClient()
  //       .CreateSigningKey(
  //         request,
  //         {interceptors: this.interceptors},
  //         (err, resp) => {
  //           if (err) {
  //             resolve(new CreateSigningKey.Error(cacheServiceErrorMapper(err)));
  //           } else {
  //             const signingKey = new _SigningKey(resp?.key, resp?.expires_at);
  //             resolve(new CreateSigningKey.Success(endpoint, signingKey));
  //           }
  //         }
  //       );
  //   });
  // }
  //
  // public async revokeSigningKey(
  //   keyId: string
  // ): Promise<RevokeSigningKey.Response> {
  //   const request = new grpcControl._RevokeSigningKeyRequest();
  //   request.key_id = keyId;
  //   this.logger.debug("Issuing 'revokeSigningKey' request");
  //   return await new Promise<RevokeSigningKey.Response>(resolve => {
  //     this.clientWrapper
  //       .getClient()
  //       .RevokeSigningKey(request, {interceptors: this.interceptors}, err => {
  //         if (err) {
  //           resolve(new RevokeSigningKey.Error(cacheServiceErrorMapper(err)));
  //         } else {
  //           resolve(new RevokeSigningKey.Success());
  //         }
  //       });
  //   });
  // }
  //
  // public async listSigningKeys(
  //   endpoint: string
  // ): Promise<ListSigningKeys.Response> {
  //   const request = new grpcControl._ListSigningKeysRequest();
  //   request.next_token = '';
  //   this.logger.debug("Issuing 'listSigningKeys' request");
  //   return await new Promise<ListSigningKeys.Response>(resolve => {
  //     this.clientWrapper
  //       .getClient()
  //       .ListSigningKeys(
  //         request,
  //         {interceptors: this.interceptors},
  //         (err, resp) => {
  //           if (err) {
  //             resolve(new ListSigningKeys.Error(cacheServiceErrorMapper(err)));
  //           } else {
  //             const signingKeys = resp?.signing_key.map(
  //               sk => new _SigningKey(sk.key_id, sk.expires_at)
  //             );
  //             const listSigningKeyResponse = new _ListSigningKeysResponse(
  //               signingKeys,
  //               resp?.next_token
  //             );
  //             resolve(
  //               new ListSigningKeys.Success(endpoint, listSigningKeyResponse)
  //             );
  //           }
  //         }
  //       );
  //   });
  // }
}
