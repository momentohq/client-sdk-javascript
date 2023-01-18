import {cache} from '@gomomento/generated-types';
import grpcCache = cache.cache_client;
// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {TextEncoder} from 'util';
import {Header, HeaderInterceptor} from '../grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from '../grpc/client-timeout-interceptor';
import {createRetryInterceptorIfEnabled} from '../grpc/retry-interceptor';
import {InvalidArgumentError, UnknownError} from '../errors/errors';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {ChannelCredentials, Interceptor, Metadata} from '@grpc/grpc-js';
import * as CacheGet from '../messages/responses/cache-get';
import * as CacheSet from '../messages/responses/cache-set';
import * as CacheDelete from '../messages/responses/cache-delete';
import * as CacheSetFetch from '../messages/responses/cache-set-fetch';
import * as CacheSetAddElements from '../messages/responses/cache-set-add-elements';
import * as CacheSetRemoveElements from '../messages/responses/cache-set-remove-elements';
import * as CacheListFetch from '../messages/responses/cache-list-fetch';
import * as CacheListPushFront from '../messages/responses/cache-list-push-front';
import {version} from '../../package.json';
import {getLogger, Logger} from '../utils/logging';
import {IdleGrpcClientWrapper} from '../grpc/idle-grpc-client-wrapper';
import {GrpcClientWrapper} from '../grpc/grpc-client-wrapper';
import {normalizeSdkError} from '../errors/error-utils';
import {
  ensureValidKey,
  ensureValidSetRequest,
  validateCacheName,
  validateListName,
  validateSetName,
} from '../utils/validators';
import {CredentialProvider} from '../auth/credential-provider';
import {Configuration} from '../config/configuration';
import {SimpleCacheClientProps} from '../simple-cache-client-props';
import {CollectionTtl} from '../utils/collection-ttl';

export class CacheClient {
  private readonly clientWrapper: GrpcClientWrapper<grpcCache.ScsClient>;
  private readonly textEncoder: TextEncoder;
  private readonly configuration: Configuration;
  private readonly credentialProvider: CredentialProvider;
  private readonly defaultTtlSeconds: number;
  private readonly requestTimeoutMs: number;
  private static readonly DEFAULT_REQUEST_TIMEOUT_MS: number = 5 * 1000;
  private readonly logger: Logger;
  private readonly interceptors: Interceptor[];

  /**
   * @param {MomentoCacheProps} props
   */
  constructor(props: SimpleCacheClientProps) {
    this.configuration = props.configuration;
    this.credentialProvider = props.credentialProvider;
    this.logger = getLogger(this);
    const grpcConfig = this.configuration
      .getTransportStrategy()
      .getGrpcConfig();

    this.requestTimeoutMs =
      grpcConfig.getDeadlineMilliseconds() ||
      CacheClient.DEFAULT_REQUEST_TIMEOUT_MS;
    this.validateRequestTimeout(this.requestTimeoutMs);
    this.logger.debug(
      `Creating cache client using endpoint: '${this.credentialProvider.getCacheEndpoint()}'`
    );

    this.clientWrapper = new IdleGrpcClientWrapper({
      clientFactoryFn: () =>
        new grpcCache.ScsClient(
          this.credentialProvider.getCacheEndpoint(),
          ChannelCredentials.createSsl(),
          {
            // default value for max session memory is 10mb.  Under high load, it is easy to exceed this,
            // after which point all requests will fail with a client-side RESOURCE_EXHAUSTED exception.
            'grpc-node.max_session_memory': grpcConfig.getMaxSessionMemoryMb(),
            // This flag controls whether channels use a shared global pool of subchannels, or whether
            // each channel gets its own subchannel pool.  The default value is 0, meaning a single global
            // pool.  Setting it to 1 provides significant performance improvements when we instantiate more
            // than one grpc client.
            'grpc.use_local_subchannel_pool': 1,
          }
        ),
      configuration: this.configuration,
    });

    this.textEncoder = new TextEncoder();
    this.defaultTtlSeconds = props.defaultTtlSeconds;
    this.interceptors = this.initializeInterceptors();
  }

  public getEndpoint(): string {
    const endpoint = this.credentialProvider.getCacheEndpoint();
    this.logger.debug(`Using cache endpoint: ${endpoint}`);
    return endpoint;
  }

  private validateRequestTimeout(timeout?: number) {
    this.logger.debug(`Request timeout ms: ${String(timeout)}`);
    if (timeout && timeout <= 0) {
      throw new InvalidArgumentError(
        'request timeout must be greater than zero.'
      );
    }
  }

  public async set(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    ttl?: number
  ): Promise<CacheSet.Response> {
    try {
      validateCacheName(cacheName);
      ensureValidSetRequest(key, value, ttl || this.defaultTtlSeconds);
    } catch (err) {
      return new CacheSet.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(
      `Issuing 'set' request; key: ${key.toString()}, value length: ${
        value.length
      }, ttl: ${ttl?.toString() ?? 'null'}`
    );
    const encodedKey = this.convert(key);
    const encodedValue = this.convert(value);

    return await this.sendSet(
      cacheName,
      encodedKey,
      encodedValue,
      ttl || this.defaultTtlSeconds
    );
  }

  private async sendSet(
    cacheName: string,
    key: Uint8Array,
    value: Uint8Array,
    ttl: number
  ): Promise<CacheSet.Response> {
    const request = new grpcCache._SetRequest({
      cache_body: value,
      cache_key: key,
      ttl_milliseconds: ttl * 1000,
    });
    const metadata = this.createMetadata(cacheName);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return await new Promise(resolve => {
      this.clientWrapper.getClient().Set(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheSet.Success(value));
          } else {
            resolve(new CacheSet.Error(cacheServiceErrorMapper(err)));
          }
        }
      );
    });
  }

  public async setFetch(
    cacheName: string,
    setName: string
  ): Promise<CacheSetFetch.Response> {
    validateCacheName(cacheName);
    validateSetName(setName);
    return await this.sendSetFetch(cacheName, this.convert(setName));
  }

  private async sendSetFetch(
    cacheName: string,
    setName: Uint8Array
  ): Promise<CacheSetFetch.Response> {
    const request = new grpcCache._SetFetchRequest({
      set_name: setName,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.getClient().SetFetch(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp?.missing) {
            resolve(new CacheSetFetch.Miss());
          } else if (resp?.found) {
            resolve(new CacheSetFetch.Hit(resp.found.elements));
          } else {
            resolve(new CacheSetFetch.Error(cacheServiceErrorMapper(err)));
          }
        }
      );
    });
  }

  public async setAddElements(
    cacheName: string,
    setName: string,
    elements: string[] | Uint8Array[],
    ttl: CollectionTtl = CollectionTtl.fromCacheTtl()
  ): Promise<CacheSetAddElements.Response> {
    validateCacheName(cacheName);
    validateSetName(setName);
    return await this.sendSetAddElements(
      cacheName,
      this.convert(setName),
      this.convertArray(elements),
      ttl.ttlMilliseconds() || this.defaultTtlSeconds * 1000,
      ttl.refreshTtl()
    );
  }

  private async sendSetAddElements(
    cacheName: string,
    setName: Uint8Array,
    elements: Uint8Array[],
    ttlMilliseconds: number,
    refreshTtl: boolean
  ): Promise<CacheSetAddElements.Response> {
    const request = new grpcCache._SetUnionRequest({
      set_name: setName,
      elements: elements,
      ttl_milliseconds: ttlMilliseconds,
      refresh_ttl: refreshTtl,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.getClient().SetUnion(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (err) {
            resolve(
              new CacheSetAddElements.Error(cacheServiceErrorMapper(err))
            );
          } else {
            resolve(new CacheSetAddElements.Success());
          }
        }
      );
    });
  }

  public async setRemoveElements(
    cacheName: string,
    setName: string,
    elements: string[] | Uint8Array[]
  ): Promise<CacheSetRemoveElements.Response> {
    validateCacheName(cacheName);
    validateSetName(setName);
    return await this.sendSetRemoveElements(
      cacheName,
      this.convert(setName),
      this.convertArray(elements)
    );
  }

  private async sendSetRemoveElements(
    cacheName: string,
    setName: Uint8Array,
    elements: Uint8Array[]
  ): Promise<CacheSetRemoveElements.Response> {
    const subtrahend = new grpcCache._SetDifferenceRequest._Subtrahend({
      set: new grpcCache._SetDifferenceRequest._Subtrahend._Set({
        elements: elements,
      }),
    });
    const request = new grpcCache._SetDifferenceRequest({
      set_name: setName,
      subtrahend: subtrahend,
    });

    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.getClient().SetDifference(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (err) {
            resolve(
              new CacheSetRemoveElements.Error(cacheServiceErrorMapper(err))
            );
          } else {
            resolve(new CacheSetRemoveElements.Success());
          }
        }
      );
    });
  }

  public async delete(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<CacheDelete.Response> {
    try {
      validateCacheName(cacheName);
      ensureValidKey(key);
    } catch (err) {
      return new CacheDelete.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(`Issuing 'delete' request; key: ${key.toString()}`);
    return await this.sendDelete(cacheName, this.convert(key));
  }

  private async sendDelete(
    cacheName: string,
    key: Uint8Array
  ): Promise<CacheDelete.Response> {
    const request = new grpcCache._DeleteRequest({
      cache_key: key,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.getClient().Delete(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheDelete.Success());
          } else {
            resolve(new CacheDelete.Error(cacheServiceErrorMapper(err)));
          }
        }
      );
    });
  }

  public async get(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<CacheGet.Response> {
    try {
      validateCacheName(cacheName);
      ensureValidKey(key);
    } catch (err) {
      return new CacheGet.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(`Issuing 'get' request; key: ${key.toString()}`);
    const result = await this.sendGet(cacheName, this.convert(key));
    this.logger.trace(`'get' request result: ${result.toString()}`);
    return result;
  }

  private async sendGet(
    cacheName: string,
    key: Uint8Array
  ): Promise<CacheGet.Response> {
    const request = new grpcCache._GetRequest({
      cache_key: key,
    });
    const metadata = this.createMetadata(cacheName);

    return await new Promise(resolve => {
      this.clientWrapper.getClient().Get(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            switch (resp.result) {
              case grpcCache.ECacheResult.Miss:
                resolve(new CacheGet.Miss());
                break;
              case grpcCache.ECacheResult.Hit:
                resolve(new CacheGet.Hit(resp.cache_body));
                break;
              case grpcCache.ECacheResult.Invalid:
              case grpcCache.ECacheResult.Ok:
                resolve(new CacheGet.Error(new UnknownError(resp.message)));
                break;
              default:
                resolve(
                  new CacheGet.Error(
                    new UnknownError(
                      'An unknown error occurred: ' + resp.message
                    )
                  )
                );
                break;
            }
          } else {
            resolve(new CacheGet.Error(cacheServiceErrorMapper(err)));
          }
        }
      );
    });
  }

  public async listFetch(
    cacheName: string,
    listName: string
  ): Promise<CacheListFetch.Response> {
    try {
      validateCacheName(cacheName);
      validateListName(listName);
    } catch (err) {
      return new CacheListFetch.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(`Issuing 'listFetch' request; listName: ${listName}`);
    const result = await this.sendListFetch(cacheName, this.convert(listName));
    this.logger.trace(`'listFetch' request result: ${result.toString()}`);
    return result;
  }

  private async sendListFetch(
    cacheName: string,
    listName: Uint8Array
  ): Promise<CacheListFetch.Response> {
    const request = new grpcCache._ListFetchRequest({
      list_name: listName,
    });
    const metadata = this.createMetadata(cacheName);

    return await new Promise(resolve => {
      this.clientWrapper.getClient().ListFetch(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp?.missing) {
            resolve(new CacheListFetch.Miss());
          } else if (resp?.found) {
            resolve(new CacheListFetch.Hit(resp.found.values));
          } else {
            resolve(new CacheListFetch.Error(cacheServiceErrorMapper(err)));
          }
        }
      );
    });
  }

  public async listPushFront(
    cacheName: string,
    listName: string,
    value: string | Uint8Array,
    ttl: CollectionTtl = CollectionTtl.fromCacheTtl(),
    truncateBackToSize?: number
  ): Promise<CacheListFetch.Response> {
    try {
      validateCacheName(cacheName);
      validateListName(listName);
    } catch (err) {
      return new CacheListFetch.Error(normalizeSdkError(err as Error));
    }

    this.logger.trace(
      `Issuing 'listPushFront' request; listName: ${listName}, value length: ${
        value.length
      }, ${ttl.toString()}, truncateBackToSize: ${
        truncateBackToSize?.toString() ?? 'null'
      }`
    );

    const result = await this.sendListPushFront(
      cacheName,
      this.convert(listName),
      this.convert(value),
      ttl.ttlMilliseconds() || this.defaultTtlSeconds * 1000,
      ttl.refreshTtl(),
      truncateBackToSize
    );
    this.logger.trace(`'listPushFront' request result: ${result.toString()}`);
    return result;
  }

  private async sendListPushFront(
    cacheName: string,
    listName: Uint8Array,
    value: Uint8Array,
    ttlMilliseconds: number,
    refreshTtl: boolean,
    truncateBackToSize?: number
  ): Promise<CacheListPushFront.Response> {
    const request = new grpcCache._ListPushFrontRequest({
      list_name: listName,
      value: value,
      ttl_milliseconds: ttlMilliseconds,
      refresh_ttl: refreshTtl,
      truncate_back_to_size: truncateBackToSize,
    });
    const metadata = this.createMetadata(cacheName);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return await new Promise(resolve => {
      this.clientWrapper.getClient().ListPushFront(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheListPushFront.Success(resp.list_length));
          } else {
            resolve(new CacheListPushFront.Error(cacheServiceErrorMapper(err)));
          }
        }
      );
    });
  }

  private initializeInterceptors(): Interceptor[] {
    const headers = [
      new Header('Authorization', this.credentialProvider.getAuthToken()),
      new Header('Agent', `javascript:${version}`),
    ];
    return [
      new HeaderInterceptor(headers).addHeadersInterceptor(),
      ClientTimeoutInterceptor(this.requestTimeoutMs),
      ...createRetryInterceptorIfEnabled(),
    ];
  }

  private convert(v: string | Uint8Array): Uint8Array {
    if (typeof v === 'string') {
      return this.textEncoder.encode(v);
    }
    return v;
  }

  private convertArray(v: string[] | Uint8Array[]): Uint8Array[] {
    return v.map(i => this.convert(i));
  }

  private createMetadata(cacheName: string): Metadata {
    const metadata = new Metadata();
    metadata.set('cache', cacheName);
    return metadata;
  }
}
