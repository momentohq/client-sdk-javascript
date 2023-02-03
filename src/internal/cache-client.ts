import {cache} from '@gomomento/generated-types';
import grpcCache = cache.cache_client;
// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {TextEncoder} from 'util';
import {Header, HeaderInterceptor} from '../grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from '../grpc/client-timeout-interceptor';
import {createRetryInterceptorIfEnabled} from '../grpc/retry-interceptor';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {ChannelCredentials, Interceptor, Metadata} from '@grpc/grpc-js';
import {
  CacheGet,
  CacheSet,
  CacheDelete,
  CacheSetFetch,
  CacheDictionaryFetch,
  CacheDictionarySetField,
  CacheDictionarySetFields,
  CacheDictionaryGetField,
  CacheDictionaryGetFields,
  CacheDictionaryRemoveField,
  CacheDictionaryRemoveFields,
  CacheDictionaryIncrement,
  CacheSetAddElements,
  CacheSetRemoveElements,
  CacheListConcatenateBack,
  CacheListConcatenateFront,
  CacheListFetch,
  CacheListLength,
  CacheListPopBack,
  CacheListPopFront,
  CacheListPushBack,
  CacheListPushFront,
  CacheListRemoveValue,
  CollectionTtl,
  Configuration,
  CredentialProvider,
  InvalidArgumentError,
  UnknownError,
} from '..';
import {version} from '../../package.json';
import {getLogger, Logger} from '../utils/logging';
import {IdleGrpcClientWrapper} from '../grpc/idle-grpc-client-wrapper';
import {GrpcClientWrapper} from '../grpc/grpc-client-wrapper';
import {normalizeSdkError} from '../errors/error-utils';
import {
  validateCacheName,
  validateDictionaryName,
  validateListName,
  validateSetName,
} from '../utils/validators';
import {SimpleCacheClientProps} from '../simple-cache-client-props';

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
   * @param {MomentoValidateCacheProps} props
   */
  constructor(props: SimpleCacheClientProps) {
    this.configuration = props.configuration;
    this.credentialProvider = props.credentialProvider;
    this.logger = getLogger(this);
    const grpcConfig = this.configuration
      .getTransportStrategy()
      .getGrpcConfig();

    this.requestTimeoutMs =
      grpcConfig.getDeadlineMillis() || CacheClient.DEFAULT_REQUEST_TIMEOUT_MS;
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
      if (ttl && ttl < 0) {
        throw new InvalidArgumentError('ttl must be a positive integer');
      } else {
        ttl || this.defaultTtlSeconds;
      }
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
    return await new Promise(resolve => {
      this.clientWrapper.getClient().Set(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheSet.Success());
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
    try {
      validateCacheName(cacheName);
      validateSetName(setName);
    } catch (err) {
      return new CacheSetFetch.Error(normalizeSdkError(err as Error));
    }
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
    try {
      validateCacheName(cacheName);
      validateSetName(setName);
    } catch (err) {
      return new CacheSetAddElements.Error(normalizeSdkError(err as Error));
    }
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
        err => {
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
    try {
      validateCacheName(cacheName);
      validateSetName(setName);
    } catch (err) {
      return new CacheSetRemoveElements.Error(normalizeSdkError(err as Error));
    }
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
        err => {
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

  public async listConcatenateBack(
    cacheName: string,
    listName: string,
    values: string[] | Uint8Array[],
    ttl: CollectionTtl = CollectionTtl.fromCacheTtl(),
    truncateFrontToSize?: number
  ): Promise<CacheListConcatenateBack.Response> {
    try {
      validateCacheName(cacheName);
      validateListName(listName);
    } catch (err) {
      return new CacheListConcatenateBack.Error(
        normalizeSdkError(err as Error)
      );
    }

    this.logger.trace(
      `Issuing 'listConcatenateBack' request; listName: ${listName}, values length: ${
        values.length
      }, ${ttl.toString()}, truncateFrontToSize: ${
        truncateFrontToSize?.toString() ?? 'null'
      }`
    );

    const result = await this.sendListConcatenateBack(
      cacheName,
      this.convert(listName),
      this.convertArray(values),
      ttl.ttlMilliseconds() || this.defaultTtlSeconds * 1000,
      ttl.refreshTtl(),
      truncateFrontToSize
    );
    this.logger.trace(
      `'listConcatenateBack' request result: ${result.toString()}`
    );
    return result;
  }

  private async sendListConcatenateBack(
    cacheName: string,
    listName: Uint8Array,
    values: Uint8Array[],
    ttlMilliseconds: number,
    refreshTtl: boolean,
    truncateFrontToSize?: number
  ): Promise<CacheListConcatenateBack.Response> {
    const request = new grpcCache._ListConcatenateBackRequest({
      list_name: listName,
      values: values,
      ttl_milliseconds: ttlMilliseconds,
      refresh_ttl: refreshTtl,
      truncate_front_to_size: truncateFrontToSize,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.getClient().ListConcatenateBack(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheListConcatenateBack.Success(resp.list_length));
          } else {
            resolve(
              new CacheListConcatenateBack.Error(cacheServiceErrorMapper(err))
            );
          }
        }
      );
    });
  }

  public async listConcatenateFront(
    cacheName: string,
    listName: string,
    values: string[] | Uint8Array[],
    ttl: CollectionTtl = CollectionTtl.fromCacheTtl(),
    truncateBackToSize?: number
  ): Promise<CacheListConcatenateFront.Response> {
    try {
      validateCacheName(cacheName);
      validateListName(listName);
    } catch (err) {
      return new CacheListConcatenateFront.Error(
        normalizeSdkError(err as Error)
      );
    }

    this.logger.trace(
      `Issuing 'listConcatenateFront' request; listName: ${listName}, values length: ${
        values.length
      }, ${ttl.toString()}, truncateBackToSize: ${
        truncateBackToSize?.toString() ?? 'null'
      }`
    );

    const result = await this.sendListConcatenateFront(
      cacheName,
      this.convert(listName),
      this.convertArray(values),
      ttl.ttlMilliseconds() || this.defaultTtlSeconds * 1000,
      ttl.refreshTtl(),
      truncateBackToSize
    );
    this.logger.trace(
      `'listConcatenateFront' request result: ${result.toString()}`
    );
    return result;
  }

  private async sendListConcatenateFront(
    cacheName: string,
    listName: Uint8Array,
    values: Uint8Array[],
    ttlMilliseconds: number,
    refreshTtl: boolean,
    truncateBackToSize?: number
  ): Promise<CacheListConcatenateFront.Response> {
    const request = new grpcCache._ListConcatenateFrontRequest({
      list_name: listName,
      values: values,
      ttl_milliseconds: ttlMilliseconds,
      refresh_ttl: refreshTtl,
      truncate_back_to_size: truncateBackToSize,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.getClient().ListConcatenateFront(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheListConcatenateFront.Success(resp.list_length));
          } else {
            resolve(
              new CacheListConcatenateFront.Error(cacheServiceErrorMapper(err))
            );
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

  public async listLength(
    cacheName: string,
    listName: string
  ): Promise<CacheListLength.Response> {
    try {
      validateCacheName(cacheName);
      validateListName(listName);
    } catch (err) {
      return new CacheListLength.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(`Issuing 'listLength' request; listName: ${listName}`);
    const result = await this.sendListLength(cacheName, this.convert(listName));
    this.logger.trace(`'listLength' request result: ${result.toString()}`);
    return result;
  }

  private async sendListLength(
    cacheName: string,
    listName: Uint8Array
  ): Promise<CacheListLength.Response> {
    const request = new grpcCache._ListLengthRequest({
      list_name: listName,
    });
    const metadata = this.createMetadata(cacheName);

    return await new Promise(resolve => {
      this.clientWrapper.getClient().ListLength(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp?.missing) {
            resolve(new CacheListLength.Miss());
          } else if (resp?.found) {
            // Unlike listFetch, listLength will return found if there is no list,
            // but there will be no length.
            if (!resp.found.length) {
              resolve(new CacheListLength.Miss());
            } else {
              resolve(new CacheListLength.Hit(resp.found.length));
            }
          } else {
            resolve(new CacheListLength.Error(cacheServiceErrorMapper(err)));
          }
        }
      );
    });
  }

  public async listPopBack(
    cacheName: string,
    listName: string
  ): Promise<CacheListPopBack.Response> {
    try {
      validateCacheName(cacheName);
      validateListName(listName);
    } catch (err) {
      return new CacheListPopBack.Error(normalizeSdkError(err as Error));
    }

    this.logger.trace("Issuing 'listPopBack' request");
    const result = await this.sendListPopBack(
      cacheName,
      this.convert(listName)
    );
    this.logger.trace(`'listPopBack' request result: ${result.toString()}`);
    return result;
  }

  private async sendListPopBack(
    cacheName: string,
    listName: Uint8Array
  ): Promise<CacheListPopBack.Response> {
    const request = new grpcCache._ListPopBackRequest({
      list_name: listName,
    });
    const metadata = this.createMetadata(cacheName);

    return await new Promise(resolve => {
      this.clientWrapper.getClient().ListPopBack(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp?.missing) {
            resolve(new CacheListPopBack.Miss());
          } else if (resp?.found) {
            resolve(new CacheListPopBack.Hit(resp.found.back));
          } else {
            resolve(new CacheListPopBack.Error(cacheServiceErrorMapper(err)));
          }
        }
      );
    });
  }

  public async listPopFront(
    cacheName: string,
    listName: string
  ): Promise<CacheListPopFront.Response> {
    try {
      validateCacheName(cacheName);
      validateListName(listName);
    } catch (err) {
      return new CacheListPopFront.Error(normalizeSdkError(err as Error));
    }

    this.logger.trace("Issuing 'listPopFront' request");
    const result = await this.sendListPopFront(
      cacheName,
      this.convert(listName)
    );
    this.logger.trace(`'listPopFront' request result: ${result.toString()}`);
    return result;
  }

  private async sendListPopFront(
    cacheName: string,
    listName: Uint8Array
  ): Promise<CacheListPopFront.Response> {
    const request = new grpcCache._ListPopFrontRequest({
      list_name: listName,
    });
    const metadata = this.createMetadata(cacheName);

    return await new Promise(resolve => {
      this.clientWrapper.getClient().ListPopFront(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp?.missing) {
            resolve(new CacheListPopFront.Miss());
          } else if (resp?.found) {
            resolve(new CacheListPopFront.Hit(resp.found.front));
          } else {
            resolve(new CacheListPopFront.Error(cacheServiceErrorMapper(err)));
          }
        }
      );
    });
  }

  public async listPushBack(
    cacheName: string,
    listName: string,
    value: string | Uint8Array,
    ttl: CollectionTtl = CollectionTtl.fromCacheTtl(),
    truncateFrontToSize?: number
  ): Promise<CacheListPushBack.Response> {
    try {
      validateCacheName(cacheName);
      validateListName(listName);
    } catch (err) {
      return new CacheListPushBack.Error(normalizeSdkError(err as Error));
    }

    this.logger.trace(
      `Issuing 'listPushBack' request; listName: ${listName}, value length: ${
        value.length
      }, ${ttl.toString()}, truncateFrontToSize: ${
        truncateFrontToSize?.toString() ?? 'null'
      }`
    );

    const result = await this.sendListPushBack(
      cacheName,
      this.convert(listName),
      this.convert(value),
      ttl.ttlMilliseconds() || this.defaultTtlSeconds * 1000,
      ttl.refreshTtl(),
      truncateFrontToSize
    );
    this.logger.trace(`'listPushBack' request result: ${result.toString()}`);
    return result;
  }

  private async sendListPushBack(
    cacheName: string,
    listName: Uint8Array,
    value: Uint8Array,
    ttlMilliseconds: number,
    refreshTtl: boolean,
    truncateFrontToSize?: number
  ): Promise<CacheListPushBack.Response> {
    const request = new grpcCache._ListPushBackRequest({
      list_name: listName,
      value: value,
      ttl_milliseconds: ttlMilliseconds,
      refresh_ttl: refreshTtl,
      truncate_front_to_size: truncateFrontToSize,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.getClient().ListPushBack(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheListPushBack.Success(resp.list_length));
          } else {
            resolve(new CacheListPushBack.Error(cacheServiceErrorMapper(err)));
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
  ): Promise<CacheListPushFront.Response> {
    try {
      validateCacheName(cacheName);
      validateListName(listName);
    } catch (err) {
      return new CacheListPushFront.Error(normalizeSdkError(err as Error));
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

  public async listRemoveValue(
    cacheName: string,
    listName: string,
    value: string | Uint8Array
  ): Promise<CacheListRemoveValue.Response> {
    try {
      validateCacheName(cacheName);
      validateListName(listName);
    } catch (err) {
      return new CacheListRemoveValue.Error(normalizeSdkError(err as Error));
    }

    this.logger.trace(
      `Issuing 'listRemoveValue' request; listName: ${listName}, value length: ${value.length}`
    );

    const result = await this.sendListRemoveValue(
      cacheName,
      this.convert(listName),
      this.convert(value)
    );
    this.logger.trace(`'listRemoveValue' request result: ${result.toString()}`);
    return result;
  }

  private async sendListRemoveValue(
    cacheName: string,
    listName: Uint8Array,
    value: Uint8Array
  ): Promise<CacheListRemoveValue.Response> {
    const request = new grpcCache._ListRemoveRequest({
      list_name: listName,
      all_elements_with_value: value,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.getClient().ListRemove(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheListRemoveValue.Success());
          } else {
            resolve(
              new CacheListRemoveValue.Error(cacheServiceErrorMapper(err))
            );
          }
        }
      );
    });
  }

  public async dictionaryFetch(
    cacheName: string,
    dictionaryName: string
  ): Promise<CacheDictionaryFetch.Response> {
    try {
      validateCacheName(cacheName);
      validateDictionaryName(dictionaryName);
    } catch (err) {
      return new CacheDictionaryFetch.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(
      `Issuing 'dictionaryFetch' request; dictionaryName: ${dictionaryName}`
    );
    const result = await this.sendDictionaryFetch(
      cacheName,
      this.convert(dictionaryName)
    );
    this.logger.trace(`'dictionaryFetch' request result: ${result.toString()}`);
    return result;
  }

  private async sendDictionaryFetch(
    cacheName: string,
    dictionaryName: Uint8Array
  ): Promise<CacheDictionaryFetch.Response> {
    const request = new grpcCache._DictionaryFetchRequest({
      dictionary_name: dictionaryName,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.getClient().DictionaryFetch(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp?.found) {
            resolve(new CacheDictionaryFetch.Hit(resp.found.items));
          } else if (resp?.missing) {
            resolve(new CacheDictionaryFetch.Miss());
          } else {
            resolve(
              new CacheDictionaryFetch.Error(cacheServiceErrorMapper(err))
            );
          }
        }
      );
    });
  }

  public async dictionarySendField(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array,
    value: string | Uint8Array,
    ttl: CollectionTtl = CollectionTtl.fromCacheTtl()
  ): Promise<CacheDictionarySetField.Response> {
    try {
      validateCacheName(cacheName);
      validateDictionaryName(dictionaryName);
    } catch (err) {
      return new CacheDictionarySetField.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(
      `Issuing 'dictionarySetField' request; field: ${field.toString()}, value length: ${
        value.length
      }, ttl: ${ttl.ttlSeconds.toString() ?? 'null'}`
    );

    const result = await this.sendDictionarySetField(
      cacheName,
      this.convert(dictionaryName),
      this.convert(field),
      this.convert(value),
      ttl.ttlMilliseconds() || this.defaultTtlSeconds * 1000,
      ttl.refreshTtl()
    );
    this.logger.trace(
      `'dictionarySetField' request result: ${result.toString()}`
    );
    return result;
  }

  private async sendDictionarySetField(
    cacheName: string,
    dictionaryName: Uint8Array,
    field: Uint8Array,
    value: Uint8Array,
    ttlMilliseconds: number,
    refreshTtl: boolean
  ): Promise<CacheDictionarySetField.Response> {
    const request = new grpcCache._DictionarySetRequest({
      dictionary_name: dictionaryName,
      items: this.toSingletonFieldValuePair(field, value),
      ttl_milliseconds: ttlMilliseconds,
      refresh_ttl: refreshTtl,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.getClient().DictionarySet(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheDictionarySetField.Success());
          } else {
            resolve(
              new CacheDictionarySetField.Error(cacheServiceErrorMapper(err))
            );
          }
        }
      );
    });
  }

  public async dictionarySendFields(
    cacheName: string,
    dictionaryName: string,
    items: Map<string | Uint8Array, string | Uint8Array>,
    ttl: CollectionTtl = CollectionTtl.fromCacheTtl()
  ): Promise<CacheDictionarySetFields.Response> {
    try {
      validateCacheName(cacheName);
      validateDictionaryName(dictionaryName);
    } catch (err) {
      return new CacheDictionarySetFields.Error(
        normalizeSdkError(err as Error)
      );
    }
    this.logger.trace(
      `Issuing 'dictionarySetFields' request; items: ${items.toString()}, ttl: ${
        ttl.ttlSeconds.toString() ?? 'null'
      }`
    );

    const dictionaryFieldValuePairs = [...items.entries()].map(
      item =>
        new grpcCache._DictionaryFieldValuePair({
          field: this.convert(item[0]),
          value: this.convert(item[1]),
        })
    );
    const result = await this.sendDictionarySetFields(
      cacheName,
      this.convert(dictionaryName),
      dictionaryFieldValuePairs,
      ttl.ttlMilliseconds() || this.defaultTtlSeconds * 1000,
      ttl.refreshTtl()
    );
    this.logger.trace(
      `'dictionarySetFields' request result: ${result.toString()}`
    );
    return result;
  }

  private async sendDictionarySetFields(
    cacheName: string,
    dictionaryName: Uint8Array,
    items: grpcCache._DictionaryFieldValuePair[],
    ttlMilliseconds: number,
    refreshTtl: boolean
  ): Promise<CacheDictionarySetFields.Response> {
    const request = new grpcCache._DictionarySetRequest({
      dictionary_name: dictionaryName,
      items: items,
      ttl_milliseconds: ttlMilliseconds,
      refresh_ttl: refreshTtl,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.getClient().DictionarySet(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheDictionarySetFields.Success());
          } else {
            resolve(
              new CacheDictionarySetFields.Error(cacheServiceErrorMapper(err))
            );
          }
        }
      );
    });
  }

  public async dictionaryGetField(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array
  ): Promise<CacheDictionaryGetField.Response> {
    try {
      validateCacheName(cacheName);
      validateDictionaryName(dictionaryName);
    } catch (err) {
      return new CacheDictionaryGetField.Error(
        normalizeSdkError(err as Error),
        this.convert(field)
      );
    }
    this.logger.trace(
      `Issuing 'dictionaryGetField' request; field: ${field.toString()}`
    );
    const result = await this.sendDictionaryGetField(
      cacheName,
      this.convert(dictionaryName),
      this.convert(field)
    );
    this.logger.trace(
      `'dictionaryGetField' request result: ${result.toString()}`
    );
    return result;
  }

  private async sendDictionaryGetField(
    cacheName: string,
    dictionaryName: Uint8Array,
    field: Uint8Array
  ): Promise<CacheDictionaryGetField.Response> {
    const request = new grpcCache._DictionaryGetRequest({
      dictionary_name: dictionaryName,
      fields: [field],
    });
    const metadata = this.createMetadata(cacheName);

    return await new Promise(resolve => {
      this.clientWrapper.getClient().DictionaryGet(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp?.dictionary === 'missing') {
            resolve(new CacheDictionaryGetField.Miss(field));
          } else if (resp?.dictionary === 'found') {
            if (resp?.found.items.length === 0) {
              resolve(
                new CacheDictionaryGetField.Error(
                  new UnknownError(
                    '_DictionaryGetResponseResponse contained no data but was found'
                  ),
                  field
                )
              );
            } else if (
              resp?.found.items[0].result === grpcCache.ECacheResult.Miss
            ) {
              resolve(new CacheDictionaryGetField.Miss(field));
            } else {
              resolve(
                new CacheDictionaryGetField.Hit(
                  resp?.found.items[0].cache_body,
                  field
                )
              );
            }
          } else {
            resolve(
              new CacheDictionaryGetField.Error(
                cacheServiceErrorMapper(err),
                field
              )
            );
          }
        }
      );
    });
  }

  public async dictionaryGetFields(
    cacheName: string,
    dictionaryName: string,
    fields: string[] | Uint8Array[]
  ): Promise<CacheDictionaryGetFields.Response> {
    try {
      validateCacheName(cacheName);
      validateDictionaryName(dictionaryName);
    } catch (err) {
      return new CacheDictionaryGetFields.Error(
        normalizeSdkError(err as Error)
      );
    }
    this.logger.trace(
      `Issuing 'dictionaryGetFields' request; fields: ${fields.toString()}`
    );
    const result = await this.sendDictionaryGetFields(
      cacheName,
      this.convert(dictionaryName),
      this.convertArray(fields)
    );
    this.logger.trace(
      `'dictionaryGetFields' request result: ${result.toString()}`
    );
    return result;
  }

  private async sendDictionaryGetFields(
    cacheName: string,
    dictionaryName: Uint8Array,
    fields: Uint8Array[]
  ): Promise<CacheDictionaryGetFields.Response> {
    const request = new grpcCache._DictionaryGetRequest({
      dictionary_name: dictionaryName,
      fields: fields,
    });
    const metadata = this.createMetadata(cacheName);

    return await new Promise(resolve => {
      this.clientWrapper.getClient().DictionaryGet(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp?.dictionary === 'found') {
            resolve(new CacheDictionaryGetFields.Hit(resp.found.items, fields));
          } else if (resp?.dictionary === 'missing') {
            resolve(new CacheDictionaryGetFields.Miss());
          } else {
            resolve(
              new CacheDictionaryGetFields.Error(cacheServiceErrorMapper(err))
            );
          }
        }
      );
    });
  }

  public async dictionaryRemoveField(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array
  ): Promise<CacheDictionaryRemoveField.Response> {
    try {
      validateCacheName(cacheName);
      validateDictionaryName(dictionaryName);
    } catch (err) {
      return new CacheDictionaryRemoveField.Error(
        normalizeSdkError(err as Error)
      );
    }
    this.logger.trace(
      `Issuing 'dictionaryRemoveField' request; field: ${field.toString()}`
    );
    const result = await this.sendDictionaryRemoveField(
      cacheName,
      this.convert(dictionaryName),
      this.convert(field)
    );
    this.logger.trace(
      `'dictionaryRemoveField' request result: ${result.toString()}`
    );
    return result;
  }

  private async sendDictionaryRemoveField(
    cacheName: string,
    dictionaryName: Uint8Array,
    field: Uint8Array
  ): Promise<CacheDictionaryRemoveField.Response> {
    const request = new grpcCache._DictionaryDeleteRequest({
      dictionary_name: dictionaryName,
      some: new grpcCache._DictionaryDeleteRequest.Some(),
    });
    request.some.fields.push(field);
    const metadata = this.createMetadata(cacheName);

    return await new Promise(resolve => {
      this.clientWrapper.getClient().DictionaryDelete(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheDictionaryRemoveField.Success());
          } else {
            resolve(
              new CacheDictionaryRemoveField.Error(cacheServiceErrorMapper(err))
            );
          }
        }
      );
    });
  }

  public async dictionaryRemoveFields(
    cacheName: string,
    dictionaryName: string,
    fields: string[] | Uint8Array[]
  ): Promise<CacheDictionaryRemoveFields.Response> {
    try {
      validateCacheName(cacheName);
      validateDictionaryName(dictionaryName);
    } catch (err) {
      return new CacheDictionaryRemoveFields.Error(
        normalizeSdkError(err as Error)
      );
    }
    this.logger.trace(
      `Issuing 'dictionaryRemoveFields' request; fields: ${fields.toString()}`
    );
    const result = await this.sendDictionaryRemoveFields(
      cacheName,
      this.convert(dictionaryName),
      this.convertArray(fields)
    );
    this.logger.trace(
      `'dictionaryRemoveFields' request result: ${result.toString()}`
    );
    return result;
  }

  private async sendDictionaryRemoveFields(
    cacheName: string,
    dictionaryName: Uint8Array,
    fields: Uint8Array[]
  ): Promise<CacheDictionaryRemoveFields.Response> {
    const request = new grpcCache._DictionaryDeleteRequest({
      dictionary_name: dictionaryName,
      some: new grpcCache._DictionaryDeleteRequest.Some(),
    });
    fields.forEach(field => request.some.fields.push(field));
    const metadata = this.createMetadata(cacheName);

    return await new Promise(resolve => {
      this.clientWrapper.getClient().DictionaryDelete(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheDictionaryRemoveFields.Success());
          } else {
            resolve(
              new CacheDictionaryRemoveFields.Error(
                cacheServiceErrorMapper(err)
              )
            );
          }
        }
      );
    });
  }

  public async dictionaryIncrement(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array,
    amount = 1,
    ttl: CollectionTtl = CollectionTtl.fromCacheTtl()
  ): Promise<CacheDictionaryIncrement.Response> {
    try {
      validateCacheName(cacheName);
      validateDictionaryName(dictionaryName);
    } catch (err) {
      return new CacheDictionaryIncrement.Error(
        normalizeSdkError(err as Error)
      );
    }
    this.logger.trace(
      `Issuing 'dictionaryIncrement' request; field: ${field.toString()}, amount : ${amount}, ttl: ${
        ttl.ttlSeconds.toString() ?? 'null'
      }`
    );

    const result = await this.sendDictionaryIncrement(
      cacheName,
      this.convert(dictionaryName),
      this.convert(field),
      amount,
      ttl.ttlMilliseconds() || this.defaultTtlSeconds * 1000,
      ttl.refreshTtl()
    );
    this.logger.trace(
      `'dictionaryIncrement' request result: ${result.toString()}`
    );
    return result;
  }

  private async sendDictionaryIncrement(
    cacheName: string,
    dictionaryName: Uint8Array,
    field: Uint8Array,
    amount: number,
    ttlMilliseconds: number,
    refreshTtl: boolean
  ): Promise<CacheDictionaryIncrement.Response> {
    const request = new grpcCache._DictionaryIncrementRequest({
      dictionary_name: dictionaryName,
      field,
      amount,
      ttl_milliseconds: ttlMilliseconds,
      refresh_ttl: refreshTtl,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.getClient().DictionaryIncrement(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            if (resp.value) {
              resolve(new CacheDictionaryIncrement.Success(resp.value));
            } else {
              resolve(new CacheDictionaryIncrement.Success(0));
            }
          } else {
            resolve(
              new CacheDictionaryIncrement.Error(cacheServiceErrorMapper(err))
            );
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
      ...createRetryInterceptorIfEnabled(this.configuration.getRetryStrategy()),
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

  private toSingletonFieldValuePair(
    field: Uint8Array,
    value: Uint8Array
  ): grpcCache._DictionaryFieldValuePair[] {
    return [
      new grpcCache._DictionaryFieldValuePair({
        field: field,
        value: value,
      }),
    ];
  }
}
