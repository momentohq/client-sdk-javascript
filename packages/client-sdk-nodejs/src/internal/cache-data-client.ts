import {cache} from '@gomomento/generated-types';
// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {TextEncoder} from 'util';
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {createRetryInterceptorIfEnabled} from './grpc/retry-interceptor';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  ChannelCredentials,
  Interceptor,
  Metadata,
  ServiceError,
} from '@grpc/grpc-js';
import {
  CacheDecreaseTtl,
  CacheDelete,
  CacheDictionaryFetch,
  CacheDictionaryGetField,
  CacheDictionaryGetFields,
  CacheDictionaryIncrement,
  CacheDictionaryLength,
  CacheDictionaryRemoveField,
  CacheDictionaryRemoveFields,
  CacheDictionarySetField,
  CacheDictionarySetFields,
  CacheGet,
  CacheIncreaseTtl,
  CacheIncrement,
  CacheItemGetTtl,
  CacheItemGetType,
  CacheKeyExists,
  CacheKeysExist,
  CacheListConcatenateBack,
  CacheListConcatenateFront,
  CacheListFetch,
  CacheListLength,
  CacheListPopBack,
  CacheListPopFront,
  CacheListPushBack,
  CacheListPushFront,
  CacheListRemoveValue,
  CacheListRetain,
  CacheSet,
  CacheSetAddElements,
  CacheSetFetch,
  CacheSetIfAbsent,
  CacheSetIfAbsentOrEqual,
  CacheSetIfEqual,
  CacheSetIfNotEqual,
  CacheSetIfNotExists,
  CacheSetIfPresent,
  CacheSetIfPresentAndNotEqual,
  CacheSetRemoveElements,
  CacheSetSample,
  CacheSortedSetFetch,
  CacheSortedSetGetRank,
  CacheSortedSetGetScore,
  CacheSortedSetGetScores,
  CacheSortedSetIncrementScore,
  CacheSortedSetLength,
  CacheSortedSetLengthByScore,
  CacheSortedSetPutElement,
  CacheSortedSetPutElements,
  CacheSortedSetRemoveElement,
  CacheSortedSetRemoveElements,
  CacheUpdateTtl,
  CollectionTtl,
  CompressionLevel,
  CredentialProvider,
  GetBatch,
  ICompression,
  InvalidArgumentError,
  ItemType,
  MomentoLogger,
  MomentoLoggerFactory,
  SetBatch,
  SortedSetOrder,
  UnknownError,
} from '..';
import {version} from '../../package.json';
import {IdleGrpcClientWrapper} from './grpc/idle-grpc-client-wrapper';
import {GrpcClientWrapper} from './grpc/grpc-client-wrapper';
import {
  Middleware,
  MiddlewareRequestHandlerContext,
} from '../config/middleware/middleware';
import {middlewaresInterceptor} from './grpc/middlewares-interceptor';
import {cache_client} from '@gomomento/generated-types/dist/cacheclient';
import {Configuration} from '../config/configuration';
import {
  Semaphore,
  truncateString,
  validateCacheName,
  validateDictionaryName,
  validateListName,
  validateListSliceStartEnd,
  validateSetName,
  validateSetSampleLimit,
  validateSortedSetCount,
  validateSortedSetName,
  validateSortedSetOffset,
  validateSortedSetRanks,
  validateSortedSetScores,
  validateTtlSeconds,
  validateValidForSeconds,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {
  _DictionaryGetResponsePart,
  _ECacheResult,
  _SortedSetGetScoreResponsePart,
} from '@gomomento/sdk-core/dist/src/messages/responses/grpc-response-types';
import {IDataClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {ConnectivityState} from '@grpc/grpc-js/build/src/connectivity-state';
import {CacheClientPropsWithConfig} from './cache-client-props-with-config';
import {grpcChannelOptionsFromGrpcConfig} from './grpc/grpc-channel-options';
import {ConnectionError} from '@gomomento/sdk-core/dist/src/errors';
import {common} from '@gomomento/generated-types/dist/common';
import {
  DictionarySetFieldCallOptions,
  DictionarySetFieldsCallOptions,
  GetCallOptions,
  SetCallOptions,
  ttlOrFromCacheTtl,
} from '@gomomento/sdk-core/dist/src/utils';
import grpcCache = cache.cache_client;
import ECacheResult = cache_client.ECacheResult;
import _ItemGetTypeResponse = cache_client._ItemGetTypeResponse;
import _Unbounded = common._Unbounded;
import Absent = common.Absent;
import Present = common.Present;
import Equal = common.Equal;
import NotEqual = common.NotEqual;
import PresentAndNotEqual = common.PresentAndNotEqual;
import AbsentOrEqual = common.AbsentOrEqual;

export const CONNECTION_ID_KEY = Symbol('connectionID');

export class CacheDataClient implements IDataClient {
  private readonly clientWrapper: GrpcClientWrapper<grpcCache.ScsClient>;
  private readonly textEncoder: TextEncoder;
  private readonly configuration: Configuration;
  private readonly credentialProvider: CredentialProvider;
  private readonly defaultTtlSeconds: number;
  private readonly requestTimeoutMs: number;
  private static readonly DEFAULT_REQUEST_TIMEOUT_MS: number = 5 * 1000;
  private readonly logger: MomentoLogger;
  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;
  private readonly interceptors: Interceptor[];
  private readonly streamingInterceptors: Interceptor[];
  private readonly valueCompressor?: ICompression;
  private requestConcurrencySemaphore: Semaphore;

  /**
   * @param {CacheClientProps} props
   * @param dataClientID
   */
  constructor(
    props: CacheClientPropsWithConfig,
    dataClientID: string,
    semaphore: Semaphore
  ) {
    this.configuration = props.configuration;
    this.credentialProvider = props.credentialProvider;
    this.logger = this.configuration.getLoggerFactory().getLogger(this);
    this.cacheServiceErrorMapper = new CacheServiceErrorMapper(
      props.configuration.getThrowOnErrors()
    );
    const compression = this.configuration.getCompressionStrategy();
    if (compression !== undefined) {
      this.valueCompressor = compression.compressorFactory;
    } else {
      this.valueCompressor = undefined;
    }
    this.requestConcurrencySemaphore = semaphore;

    const grpcConfig = this.configuration
      .getTransportStrategy()
      .getGrpcConfig();

    this.requestTimeoutMs =
      grpcConfig.getDeadlineMillis() ||
      CacheDataClient.DEFAULT_REQUEST_TIMEOUT_MS;
    this.validateRequestTimeout(this.requestTimeoutMs);
    this.logger.debug(
      `Creating cache client using endpoint: '${this.credentialProvider.getCacheEndpoint()}'`
    );

    const channelOptions = grpcChannelOptionsFromGrpcConfig(grpcConfig);

    this.clientWrapper = new IdleGrpcClientWrapper({
      clientFactoryFn: () => {
        this.logger.debug(`Constructing channel for clientID ${dataClientID}`);
        return new grpcCache.ScsClient(
          this.credentialProvider.getCacheEndpoint(),
          ChannelCredentials.createSsl(),
          channelOptions
        );
      },
      loggerFactory: this.configuration.getLoggerFactory(),
      maxIdleMillis: this.configuration
        .getTransportStrategy()
        .getMaxIdleMillis(),
      maxClientAgeMillis: this.configuration
        .getTransportStrategy()
        .getMaxClientAgeMillis(),
    });

    this.textEncoder = new TextEncoder();
    this.defaultTtlSeconds = props.defaultTtlSeconds;

    // this context object is currently internal only but can be extended in the Configuration object is we wants clients
    // to be able to set it.
    const context: MiddlewareRequestHandlerContext = {};
    context[CONNECTION_ID_KEY] = dataClientID;

    const headers = [
      new Header('Authorization', this.credentialProvider.getAuthToken()),
      new Header('Agent', `nodejs:${version}`),
      new Header('read-concern', this.configuration.getReadConcern()),
    ];

    this.interceptors = this.initializeInterceptors(
      headers,
      this.configuration.getLoggerFactory(),
      this.configuration.getMiddlewares(),
      context
    );
    this.streamingInterceptors = this.initializeStreamingInterceptors(headers);
  }
  close() {
    this.logger.debug('Closing cache data client');
    this.clientWrapper.getClient().close();
  }

  public connect(timeoutSeconds = 10): Promise<void> {
    this.logger.debug('Attempting to eagerly connect to channel');
    const deadline = new Date();
    deadline.setSeconds(deadline.getSeconds() + timeoutSeconds);

    return this.connectWithinDeadline(deadline);
  }

  private connectWithinDeadline(deadline: Date): Promise<void> {
    return new Promise((resolve, reject) => {
      // Get the current state and initiate a connection
      const currentState = this.clientWrapper
        .getClient()
        .getChannel()
        .getConnectivityState(true);

      this.logger.debug(`Client connectivity state: ${currentState}`);

      if (currentState === ConnectivityState.READY) {
        resolve();
        return;
      }

      const now = new Date();

      if (now >= deadline) {
        const errorMessage = 'Unable to connect to Momento: deadline exceeded.';
        this.logger.error(errorMessage);
        reject(new ConnectionError(errorMessage));
        return;
      }

      this.clientWrapper
        .getClient()
        .getChannel()
        .watchConnectivityState(currentState, deadline, (error?: Error) => {
          if (error) {
            const errorMessage = `Unable to eagerly connect to Momento. Please contact Momento if this persists. currentState: ${currentState}, errorName: ${
              error.name
            } : errorMessage: ${error.message}, errorStack: ${
              error.stack ? error.stack : 'Stack trace undefined'
            }`;
            this.logger.error(errorMessage);
            reject(new ConnectionError(errorMessage));
            return;
          }

          const newState = this.clientWrapper
            .getClient()
            .getChannel()
            .getConnectivityState(false);

          if (newState === ConnectivityState.READY) {
            this.logger.debug(`Connected! Current state: ${newState}`);
            resolve();
          } else if (newState === ConnectivityState.CONNECTING) {
            // The connection goes through the CONNECTING state before becoming READY,
            // so we must watch it twice.
            this.logger.debug(`Connecting! Current state: ${newState}`);
            this.connectWithinDeadline(deadline).then(resolve).catch(reject);
          } else {
            const errorMessage = `Unable to connect to Momento: Unexpected connection state: ${newState}., oldState: ${currentState}
              Please contact Momento if this persists.`;
            this.logger.error(errorMessage);
            reject(new ConnectionError(errorMessage));
            return;
          }
        });
    });
  }

  public getEndpoint(): string {
    const endpoint = this.credentialProvider.getCacheEndpoint();
    this.logger.debug(`Using cache endpoint: ${endpoint}`);
    return endpoint;
  }

  private validateRequestTimeout(timeout?: number) {
    this.logger.debug(`Request timeout ms: ${String(timeout)}`);
    if (timeout !== undefined && timeout <= 0) {
      throw new InvalidArgumentError(
        'request timeout must be greater than zero.'
      );
    }
  }

  private convertECacheResult(result: grpcCache.ECacheResult): _ECacheResult {
    switch (result) {
      case grpcCache.ECacheResult.Hit:
        return _ECacheResult.Hit;
      case grpcCache.ECacheResult.Invalid:
        return _ECacheResult.Invalid;
      case grpcCache.ECacheResult.Miss:
        return _ECacheResult.Miss;
      case grpcCache.ECacheResult.Ok:
        return _ECacheResult.Ok;
    }
  }

  private convertItemTypeResult(
    result: _ItemGetTypeResponse.ItemType
  ): ItemType {
    switch (result) {
      case _ItemGetTypeResponse.ItemType.SCALAR:
        return ItemType.SCALAR;
      case _ItemGetTypeResponse.ItemType.LIST:
        return ItemType.LIST;
      case _ItemGetTypeResponse.ItemType.DICTIONARY:
        return ItemType.DICTIONARY;
      case _ItemGetTypeResponse.ItemType.SET:
        return ItemType.SET;
      case _ItemGetTypeResponse.ItemType.SORTED_SET:
        return ItemType.SORTED_SET;
    }
  }

  public async set(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    options?: SetCallOptions
  ): Promise<CacheSet.Response> {
    try {
      validateCacheName(cacheName);
      if (options?.ttl !== undefined) {
        validateTtlSeconds(options.ttl);
      }
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheSet.Error(err)
      );
    }

    const ttlToUse = options?.ttl || this.defaultTtlSeconds;
    const encodedKey = this.convert(key);
    let encodedValue = this.convert(value);
    if (options?.compress) {
      this.logger.trace(
        'CacheClient.set; compression enabled, calling value compressor'
      );
      if (this.valueCompressor === undefined) {
        return this.cacheServiceErrorMapper.returnOrThrowError(
          new InvalidArgumentError(
            'Compressor is not set, but `CacheClient.set` was called with the `compress` option; please install @gomomento/sdk-nodejs-compression and call `Configuration.withCompressionStrategy` to enable compression.'
          ),
          err => new CacheSet.Error(err)
        );
      }
      encodedValue = await this.valueCompressor.compress(
        this.configuration.getCompressionStrategy()?.compressionLevel ??
          CompressionLevel.Balanced,
        encodedValue
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        `Issuing 'set' request; key: ${key.toString()}, value length: ${
          value.length
        }, ttl: ${ttlToUse.toString()}`
      );
      return await this.sendSet(cacheName, encodedKey, encodedValue, ttlToUse);
    } finally {
      this.requestConcurrencySemaphore.release();
    }
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
    return await new Promise((resolve, reject) => {
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheSet.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheSetFetch.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      return await this.sendSetFetch(cacheName, this.convert(setName));
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendSetFetch(
    cacheName: string,
    setName: Uint8Array
  ): Promise<CacheSetFetch.Response> {
    const request = new grpcCache._SetFetchRequest({
      set_name: setName,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheSetFetch.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheSetAddElements.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      return await this.sendSetAddElements(
        cacheName,
        this.convert(setName),
        this.convertArray(elements),
        ttl.ttlMilliseconds() || this.defaultTtlSeconds * 1000,
        ttl.refreshTtl()
      );
    } finally {
      this.requestConcurrencySemaphore.release();
    }
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
    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().SetUnion(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        err => {
          if (err) {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheSetAddElements.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheSetRemoveElements.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      return await this.sendSetRemoveElements(
        cacheName,
        this.convert(setName),
        this.convertArray(elements)
      );
    } finally {
      this.requestConcurrencySemaphore.release();
    }
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
    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().SetDifference(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        err => {
          if (err) {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheSetRemoveElements.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          } else {
            resolve(new CacheSetRemoveElements.Success());
          }
        }
      );
    });
  }

  public async setSample(
    cacheName: string,
    setName: string,
    limit: number
  ): Promise<CacheSetSample.Response> {
    try {
      validateCacheName(cacheName);
      validateSetName(setName);
      validateSetSampleLimit(limit);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheSetSample.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      return await this.sendSetSample(cacheName, this.convert(setName), limit);
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendSetSample(
    cacheName: string,
    setName: Uint8Array,
    limit: number
  ): Promise<CacheSetFetch.Response> {
    const request = new grpcCache._SetSampleRequest({
      set_name: setName,
      limit: limit,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().SetSample(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp?.missing) {
            resolve(new CacheSetSample.Miss());
          } else if (resp?.found) {
            resolve(new CacheSetSample.Hit(resp.found.elements));
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheSetSample.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  // setIfNotExists is deprecated on the service. Here we call the new `SetIf` method with the absent field set
  // and return `CacheSetIfNotExists` responses.
  public async setIfNotExists(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    ttl?: number
  ): Promise<CacheSetIfNotExists.Response> {
    try {
      validateCacheName(cacheName);
      if (ttl !== undefined) {
        validateTtlSeconds(ttl);
      }
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheSetIfNotExists.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        `Issuing 'setIfNotExists' request; key: ${key.toString()}, field: ${value.toString()}, ttlSeconds: ${
          ttl?.toString() ?? 'null'
        }`
      );
      const result = await this.sendSetIfNotExists(
        cacheName,
        this.convert(key),
        this.convert(value),
        ttl ? ttl * 1000 : this.defaultTtlSeconds * 1000
      );
      this.logger.trace(
        `'setIfNotExists' request result: ${result.toString()}`
      );
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendSetIfNotExists(
    cacheName: string,
    key: Uint8Array,
    value: Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheSetIfNotExists.Response> {
    const request = new grpcCache._SetIfRequest({
      cache_key: key,
      cache_body: value,
      ttl_milliseconds: ttlMilliseconds,
      absent: new Absent(),
    });
    const metadata = this.createMetadata(cacheName);

    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().SetIf(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            switch (resp.result) {
              case 'stored':
                resolve(new CacheSetIfNotExists.Stored());
                break;
              case 'not_stored':
                resolve(new CacheSetIfNotExists.NotStored());
                break;
              default:
                resolve(
                  new CacheSetIfNotExists.Error(
                    new UnknownError(
                      'SetIfNotExists responded with an unknown result'
                    )
                  )
                );
                break;
            }
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheSetIfNotExists.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async setIfAbsent(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    ttl?: number
  ): Promise<CacheSetIfAbsent.Response> {
    try {
      validateCacheName(cacheName);
      if (ttl !== undefined) {
        validateTtlSeconds(ttl);
      }
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheSetIfAbsent.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        `Issuing 'setIfAbsent' request; key: ${key.toString()}, field: ${value.toString()}, ttlSeconds: ${
          ttl?.toString() ?? 'null'
        }`
      );
      const result = await this.sendSetIfAbsent(
        cacheName,
        this.convert(key),
        this.convert(value),
        ttl ? ttl * 1000 : this.defaultTtlSeconds * 1000
      );
      this.logger.trace(`'setIfAbsent' request result: ${result.toString()}`);
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendSetIfAbsent(
    cacheName: string,
    key: Uint8Array,
    value: Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheSetIfAbsent.Response> {
    const request = new grpcCache._SetIfRequest({
      cache_key: key,
      cache_body: value,
      ttl_milliseconds: ttlMilliseconds,
      absent: new Absent(),
    });
    const metadata = this.createMetadata(cacheName);

    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().SetIf(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            switch (resp.result) {
              case 'stored':
                resolve(new CacheSetIfAbsent.Stored());
                break;
              case 'not_stored':
                resolve(new CacheSetIfAbsent.NotStored());
                break;
              default:
                resolve(
                  new CacheSetIfAbsent.Error(
                    new UnknownError(
                      'SetIfAbsent responded with an unknown result'
                    )
                  )
                );
                break;
            }
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheSetIfAbsent.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async setIfPresent(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    ttl?: number
  ): Promise<CacheSetIfPresent.Response> {
    try {
      validateCacheName(cacheName);
      if (ttl !== undefined) {
        validateTtlSeconds(ttl);
      }
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheSetIfPresent.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        `Issuing 'setIfPresent' request; key: ${key.toString()}, field: ${value.toString()}, ttlSeconds: ${
          ttl?.toString() ?? 'null'
        }`
      );
      const result = await this.sendSetIfPresent(
        cacheName,
        this.convert(key),
        this.convert(value),
        ttl ? ttl * 1000 : this.defaultTtlSeconds * 1000
      );
      this.logger.trace(`'setIfPresent' request result: ${result.toString()}`);
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendSetIfPresent(
    cacheName: string,
    key: Uint8Array,
    value: Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheSetIfPresent.Response> {
    const request = new grpcCache._SetIfRequest({
      cache_key: key,
      cache_body: value,
      ttl_milliseconds: ttlMilliseconds,
      present: new Present(),
    });
    const metadata = this.createMetadata(cacheName);

    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().SetIf(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            switch (resp.result) {
              case 'stored':
                resolve(new CacheSetIfPresent.Stored());
                break;
              case 'not_stored':
                resolve(new CacheSetIfPresent.NotStored());
                break;
              default:
                resolve(
                  new CacheSetIfPresent.Error(
                    new UnknownError(
                      'SetIfPresent responded with an unknown result'
                    )
                  )
                );
                break;
            }
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheSetIfPresent.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async setIfEqual(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    equal: string | Uint8Array,
    ttl?: number
  ): Promise<CacheSetIfEqual.Response> {
    try {
      validateCacheName(cacheName);
      if (ttl !== undefined) {
        validateTtlSeconds(ttl);
      }
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheSetIfEqual.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        `Issuing 'setIfEqual' request; key: ${key.toString()}, field: ${value.toString()}, ttlSeconds: ${
          ttl?.toString() ?? 'null'
        }`
      );
      const result = await this.sendSetIfEqual(
        cacheName,
        this.convert(key),
        this.convert(value),
        this.convert(equal),
        ttl ? ttl * 1000 : this.defaultTtlSeconds * 1000
      );
      this.logger.trace(`'setIfEqual' request result: ${result.toString()}`);
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendSetIfEqual(
    cacheName: string,
    key: Uint8Array,
    value: Uint8Array,
    equal: Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheSetIfEqual.Response> {
    const request = new grpcCache._SetIfRequest({
      cache_key: key,
      cache_body: value,
      ttl_milliseconds: ttlMilliseconds,
      equal: new Equal({value_to_check: equal}),
    });
    const metadata = this.createMetadata(cacheName);

    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().SetIf(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            switch (resp.result) {
              case 'stored':
                resolve(new CacheSetIfEqual.Stored());
                break;
              case 'not_stored':
                resolve(new CacheSetIfEqual.NotStored());
                break;
              default:
                resolve(
                  new CacheSetIfEqual.Error(
                    new UnknownError(
                      'SetIfEqual responded with an unknown result'
                    )
                  )
                );
                break;
            }
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheSetIfEqual.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async setIfNotEqual(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    notEqual: string | Uint8Array,
    ttl?: number
  ): Promise<CacheSetIfNotEqual.Response> {
    try {
      validateCacheName(cacheName);
      if (ttl !== undefined) {
        validateTtlSeconds(ttl);
      }
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheSetIfNotEqual.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        `Issuing 'setIfNotEqual' request; key: ${key.toString()}, field: ${value.toString()}, ttlSeconds: ${
          ttl?.toString() ?? 'null'
        }`
      );
      const result = await this.sendSetIfNotEqual(
        cacheName,
        this.convert(key),
        this.convert(value),
        this.convert(notEqual),
        ttl ? ttl * 1000 : this.defaultTtlSeconds * 1000
      );
      this.logger.trace(`'setIfNotEqual' request result: ${result.toString()}`);
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendSetIfNotEqual(
    cacheName: string,
    key: Uint8Array,
    value: Uint8Array,
    notEqual: Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheSetIfNotEqual.Response> {
    const request = new grpcCache._SetIfRequest({
      cache_key: key,
      cache_body: value,
      ttl_milliseconds: ttlMilliseconds,
      not_equal: new NotEqual({value_to_check: notEqual}),
    });
    const metadata = this.createMetadata(cacheName);

    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().SetIf(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            switch (resp.result) {
              case 'stored':
                resolve(new CacheSetIfNotEqual.Stored());
                break;
              case 'not_stored':
                resolve(new CacheSetIfNotEqual.NotStored());
                break;
              default:
                resolve(
                  new CacheSetIfNotEqual.Error(
                    new UnknownError(
                      'SetIfNotEqual responded with an unknown result'
                    )
                  )
                );
                break;
            }
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheSetIfNotEqual.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async setIfPresentAndNotEqual(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    notEqual: string | Uint8Array,
    ttl?: number
  ): Promise<CacheSetIfPresentAndNotEqual.Response> {
    try {
      validateCacheName(cacheName);
      if (ttl !== undefined) {
        validateTtlSeconds(ttl);
      }
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheSetIfPresentAndNotEqual.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        `Issuing 'setIfPresentAndNotEqual' request; key: ${key.toString()}, field: ${value.toString()}, ttlSeconds: ${
          ttl?.toString() ?? 'null'
        }`
      );
      const result = await this.sendSetIfPresentAndNotEqual(
        cacheName,
        this.convert(key),
        this.convert(value),
        this.convert(notEqual),
        ttl ? ttl * 1000 : this.defaultTtlSeconds * 1000
      );
      this.logger.trace(
        `'setIfPresentAndNotEqual' request result: ${result.toString()}`
      );
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendSetIfPresentAndNotEqual(
    cacheName: string,
    key: Uint8Array,
    value: Uint8Array,
    notEqual: Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheSetIfPresentAndNotEqual.Response> {
    const request = new grpcCache._SetIfRequest({
      cache_key: key,
      cache_body: value,
      ttl_milliseconds: ttlMilliseconds,
      present_and_not_equal: new PresentAndNotEqual({value_to_check: notEqual}),
    });
    const metadata = this.createMetadata(cacheName);

    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().SetIf(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            switch (resp.result) {
              case 'stored':
                resolve(new CacheSetIfPresentAndNotEqual.Stored());
                break;
              case 'not_stored':
                resolve(new CacheSetIfPresentAndNotEqual.NotStored());
                break;
              default:
                resolve(
                  new CacheSetIfPresentAndNotEqual.Error(
                    new UnknownError(
                      'SetIfPresentAndNotEqual responded with an unknown result'
                    )
                  )
                );
                break;
            }
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e =>
                new CacheSetIfPresentAndNotEqual.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async setIfAbsentOrEqual(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    equal: string | Uint8Array,
    ttl?: number
  ): Promise<CacheSetIfAbsentOrEqual.Response> {
    try {
      validateCacheName(cacheName);
      if (ttl !== undefined) {
        validateTtlSeconds(ttl);
      }
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheSetIfAbsentOrEqual.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        `Issuing 'setIfAbsentOrEqual' request; key: ${key.toString()}, field: ${value.toString()}, ttlSeconds: ${
          ttl?.toString() ?? 'null'
        }`
      );
      const result = await this.sendSetIfAbsentOrEqual(
        cacheName,
        this.convert(key),
        this.convert(value),
        this.convert(equal),
        ttl ? ttl * 1000 : this.defaultTtlSeconds * 1000
      );
      this.logger.trace(
        `'setIfAbsentOrEqual' request result: ${result.toString()}`
      );
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendSetIfAbsentOrEqual(
    cacheName: string,
    key: Uint8Array,
    value: Uint8Array,
    equal: Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheSetIfAbsentOrEqual.Response> {
    const request = new grpcCache._SetIfRequest({
      cache_key: key,
      cache_body: value,
      ttl_milliseconds: ttlMilliseconds,
      absent_or_equal: new AbsentOrEqual({value_to_check: equal}),
    });
    const metadata = this.createMetadata(cacheName);

    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().SetIf(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            switch (resp.result) {
              case 'stored':
                resolve(new CacheSetIfAbsentOrEqual.Stored());
                break;
              case 'not_stored':
                resolve(new CacheSetIfAbsentOrEqual.NotStored());
                break;
              default:
                resolve(
                  new CacheSetIfAbsentOrEqual.Error(
                    new UnknownError(
                      'SetIfAbsentOrEqual responded with an unknown result'
                    )
                  )
                );
                break;
            }
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheSetIfAbsentOrEqual.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheDelete.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(`Issuing 'delete' request; key: ${key.toString()}`);
      return await this.sendDelete(cacheName, this.convert(key));
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendDelete(
    cacheName: string,
    key: Uint8Array
  ): Promise<CacheDelete.Response> {
    const request = new grpcCache._DeleteRequest({
      cache_key: key,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheDelete.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async get(
    cacheName: string,
    key: string | Uint8Array,
    options?: GetCallOptions
  ): Promise<CacheGet.Response> {
    try {
      validateCacheName(cacheName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheGet.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(`Issuing 'get' request; key: ${key.toString()}`);
      const result = await this.sendGet(cacheName, this.convert(key), options);
      this.logger.trace(`'get' request result: ${result.toString()}`);
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendGet(
    cacheName: string,
    key: Uint8Array,
    options?: GetCallOptions
  ): Promise<CacheGet.Response> {
    const request = new grpcCache._GetRequest({
      cache_key: key,
    });
    const metadata = this.createMetadata(cacheName);

    return await new Promise((resolve, reject) => {
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
              case grpcCache.ECacheResult.Hit: {
                if (!options?.decompress) {
                  resolve(new CacheGet.Hit(resp.cache_body));
                } else {
                  if (this.valueCompressor === undefined) {
                    resolve(
                      new CacheGet.Error(
                        new InvalidArgumentError(
                          'Compressor is not set, but decompress was configured; please install @gomomento/sdk-nodejs-compression and call `Configuration.withCompressionStrategy` to enable compression.'
                        )
                      )
                    );
                  } else {
                    this.valueCompressor
                      .decompressIfCompressed(resp.cache_body)
                      .then(v => resolve(new CacheGet.Hit(v)))
                      .catch(e =>
                        resolve(
                          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                          new CacheGet.Error(new InvalidArgumentError(`${e}`))
                        )
                      );
                  }
                }
                break;
              }
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheGet.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async getBatch(
    cacheName: string,
    keys: Array<string | Uint8Array>
  ): Promise<GetBatch.Response> {
    try {
      validateCacheName(cacheName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new GetBatch.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(`Issuing 'getBatch' request; keys: ${keys.toString()}`);
      const result = await this.sendGetBatch(
        cacheName,
        keys.map(key => this.convert(key))
      );
      this.logger.trace(`'getBatch' request result: ${result.toString()}`);
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendGetBatch(
    cacheName: string,
    keys: Uint8Array[]
  ): Promise<GetBatch.Response> {
    const getRequests = [];
    for (const k of keys) {
      const getRequest = new grpcCache._GetRequest({
        cache_key: k,
      });
      getRequests.push(getRequest);
    }
    const request = new grpcCache._GetBatchRequest({
      items: getRequests,
    });
    const metadata = this.createMetadata(cacheName);

    const call = this.clientWrapper.getClient().GetBatch(request, metadata, {
      interceptors: this.streamingInterceptors,
    });

    return await new Promise((resolve, reject) => {
      const results: CacheGet.Response[] = [];
      call.on('data', (getResponse: grpcCache._GetResponse) => {
        const result = getResponse.result;
        switch (result) {
          case grpcCache.ECacheResult.Hit:
            results.push(new CacheGet.Hit(getResponse.cache_body));
            break;
          case grpcCache.ECacheResult.Miss:
            results.push(new CacheGet.Miss());
            break;
          default:
            results.push(
              new CacheGet.Error(new UnknownError(getResponse.message))
            );
        }
      });

      call.on('end', () => {
        resolve(new GetBatch.Success(results, keys));
      });

      call.on('error', (err: ServiceError | null) => {
        this.cacheServiceErrorMapper.resolveOrRejectError({
          err: err,
          errorResponseFactoryFn: e => new GetBatch.Error(e),
          resolveFn: resolve,
          rejectFn: reject,
        });
      });
    });
  }

  public async setBatch(
    cacheName: string,
    items:
      | Record<string, string | Uint8Array>
      | Map<string | Uint8Array, string | Uint8Array>,
    ttl?: number
  ): Promise<SetBatch.Response> {
    try {
      validateCacheName(cacheName);
      if (ttl !== undefined) {
        validateTtlSeconds(ttl);
      }
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new SetBatch.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      const itemsToUse = this.convertSetBatchElements(items);
      const ttlToUse = ttl || this.defaultTtlSeconds;
      this.logger.trace(
        `Issuing 'setBatch' request; items length: ${
          itemsToUse.length
        }, ttl: ${ttlToUse.toString()}`
      );
      return await this.sendSetBatch(cacheName, itemsToUse, ttlToUse);
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendSetBatch(
    cacheName: string,
    items: Record<string, Uint8Array>[],
    ttlSeconds: number
  ): Promise<SetBatch.Response> {
    const setRequests = [];
    for (const item of items) {
      const setRequest = new grpcCache._SetRequest({
        cache_key: item.key,
        cache_body: item.value,
        ttl_milliseconds: ttlSeconds * 1000,
      });
      setRequests.push(setRequest);
    }
    const request = new grpcCache._SetBatchRequest({
      items: setRequests,
    });

    const metadata = this.createMetadata(cacheName);

    const call = this.clientWrapper.getClient().SetBatch(request, metadata, {
      interceptors: this.streamingInterceptors,
    });

    return await new Promise((resolve, reject) => {
      const results: CacheSet.Response[] = [];
      call.on('data', (setResponse: grpcCache._SetResponse) => {
        const result = setResponse.result;
        switch (result) {
          case grpcCache.ECacheResult.Ok:
            results.push(new CacheSet.Success());
            break;
          default:
            results.push(
              new CacheSet.Error(new UnknownError(setResponse.message))
            );
        }
      });

      call.on('end', () => {
        resolve(new SetBatch.Success(results));
      });

      call.on('error', (err: ServiceError | null) => {
        this.cacheServiceErrorMapper.resolveOrRejectError({
          err: err,
          errorResponseFactoryFn: e => new SetBatch.Error(e),
          resolveFn: resolve,
          rejectFn: reject,
        });
      });
    });
  }

  public async listConcatenateBack(
    cacheName: string,
    listName: string,
    values: string[] | Uint8Array[],
    truncateFrontToSize?: number,
    ttl: CollectionTtl = CollectionTtl.fromCacheTtl()
  ): Promise<CacheListConcatenateBack.Response> {
    try {
      validateCacheName(cacheName);
      validateListName(listName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheListConcatenateBack.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
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
    } finally {
      this.requestConcurrencySemaphore.release();
    }
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
    return await new Promise((resolve, reject) => {
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e =>
                new CacheListConcatenateBack.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async listConcatenateFront(
    cacheName: string,
    listName: string,
    values: string[] | Uint8Array[],
    truncateBackToSize?: number,
    ttl: CollectionTtl = CollectionTtl.fromCacheTtl()
  ): Promise<CacheListConcatenateFront.Response> {
    try {
      validateCacheName(cacheName);
      validateListName(listName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheListConcatenateFront.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
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
    } finally {
      this.requestConcurrencySemaphore.release();
    }
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
    return await new Promise((resolve, reject) => {
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e =>
                new CacheListConcatenateFront.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async listFetch(
    cacheName: string,
    listName: string,
    startIndex?: number,
    endIndex?: number
  ): Promise<CacheListFetch.Response> {
    try {
      validateCacheName(cacheName);
      validateListName(listName);
      validateListSliceStartEnd(startIndex, endIndex);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheListFetch.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        "Issuing 'listFetch' request; listName: %s, startIndex: %s, endIndex: %s",
        listName,
        startIndex ?? 'null',
        endIndex ?? 'null'
      );
      const result = await this.sendListFetch(
        cacheName,
        this.convert(listName),
        startIndex,
        endIndex
      );
      this.logger.trace("'listFetch' request result: %s", result.toString());
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendListFetch(
    cacheName: string,
    listName: Uint8Array,
    start?: number,
    end?: number
  ): Promise<CacheListFetch.Response> {
    const request = new grpcCache._ListFetchRequest({
      list_name: listName,
    });
    if (start) {
      request.inclusive_start = start;
    } else {
      request.unbounded_start = new _Unbounded();
    }
    if (end) {
      request.exclusive_end = end;
    } else {
      request.unbounded_end = new _Unbounded();
    }
    const metadata = this.createMetadata(cacheName);

    return await new Promise((resolve, reject) => {
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheListFetch.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async listRetain(
    cacheName: string,
    listName: string,
    startIndex?: number,
    endIndex?: number,
    ttl: CollectionTtl = CollectionTtl.fromCacheTtl()
  ): Promise<CacheListRetain.Response> {
    try {
      validateCacheName(cacheName);
      validateListName(listName);
      validateListSliceStartEnd(startIndex, endIndex);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheListRetain.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        "Issuing 'listRetain' request; listName: %s, startIndex: %s, endIndex: %s, ttl: %s",
        listName,
        startIndex ?? 'null',
        endIndex ?? 'null',
        ttl.ttlSeconds.toString() ?? 'null'
      );
      const result = await this.sendListRetain(
        cacheName,
        this.convert(listName),
        startIndex,
        endIndex,
        ttl.ttlMilliseconds() || this.defaultTtlSeconds * 1000,
        ttl.refreshTtl()
      );
      this.logger.trace("'listRetain' request result: %s", result.toString());
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendListRetain(
    cacheName: string,
    listName: Uint8Array,
    start?: number,
    end?: number,
    ttlMilliseconds?: number,
    refreshTtl?: boolean
  ): Promise<CacheListRetain.Response> {
    const request = new grpcCache._ListRetainRequest({
      list_name: listName,
      ttl_milliseconds: ttlMilliseconds,
      refresh_ttl: refreshTtl,
    });
    if (start) {
      request.inclusive_start = start;
    } else {
      request.unbounded_start = new _Unbounded();
    }
    if (end) {
      request.exclusive_end = end;
    } else {
      request.unbounded_end = new _Unbounded();
    }
    const metadata = this.createMetadata(cacheName);

    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().ListRetain(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheListRetain.Success());
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheListRetain.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheListLength.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(`Issuing 'listLength' request; listName: ${listName}`);
      const result = await this.sendListLength(
        cacheName,
        this.convert(listName)
      );
      this.logger.trace(`'listLength' request result: ${result.toString()}`);
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendListLength(
    cacheName: string,
    listName: Uint8Array
  ): Promise<CacheListLength.Response> {
    const request = new grpcCache._ListLengthRequest({
      list_name: listName,
    });
    const metadata = this.createMetadata(cacheName);

    return await new Promise((resolve, reject) => {
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
            resolve(new CacheListLength.Hit(resp.found.length));
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheListLength.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheListPopBack.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace("Issuing 'listPopBack' request");
      const result = await this.sendListPopBack(
        cacheName,
        this.convert(listName)
      );
      this.logger.trace(`'listPopBack' request result: ${result.toString()}`);
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendListPopBack(
    cacheName: string,
    listName: Uint8Array
  ): Promise<CacheListPopBack.Response> {
    const request = new grpcCache._ListPopBackRequest({
      list_name: listName,
    });
    const metadata = this.createMetadata(cacheName);

    return await new Promise((resolve, reject) => {
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheListPopBack.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheListPopFront.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace("Issuing 'listPopFront' request");
      const result = await this.sendListPopFront(
        cacheName,
        this.convert(listName)
      );
      this.logger.trace(`'listPopFront' request result: ${result.toString()}`);
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendListPopFront(
    cacheName: string,
    listName: Uint8Array
  ): Promise<CacheListPopFront.Response> {
    const request = new grpcCache._ListPopFrontRequest({
      list_name: listName,
    });
    const metadata = this.createMetadata(cacheName);

    return await new Promise((resolve, reject) => {
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheListPopFront.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async listPushBack(
    cacheName: string,
    listName: string,
    value: string | Uint8Array,
    truncateFrontToSize?: number,
    ttl: CollectionTtl = CollectionTtl.fromCacheTtl()
  ): Promise<CacheListPushBack.Response> {
    try {
      validateCacheName(cacheName);
      validateListName(listName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheListPushBack.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
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
    } finally {
      this.requestConcurrencySemaphore.release();
    }
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
    return await new Promise((resolve, reject) => {
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheListPushBack.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async listPushFront(
    cacheName: string,
    listName: string,
    value: string | Uint8Array,
    truncateBackToSize?: number,
    ttl: CollectionTtl = CollectionTtl.fromCacheTtl()
  ): Promise<CacheListPushFront.Response> {
    try {
      validateCacheName(cacheName);
      validateListName(listName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheListPushFront.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
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
    } finally {
      this.requestConcurrencySemaphore.release();
    }
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
    return await new Promise((resolve, reject) => {
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheListPushFront.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheListRemoveValue.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        `Issuing 'listRemoveValue' request; listName: ${listName}, value length: ${value.length}`
      );

      const result = await this.sendListRemoveValue(
        cacheName,
        this.convert(listName),
        this.convert(value)
      );
      this.logger.trace(
        `'listRemoveValue' request result: ${result.toString()}`
      );
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
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
    return await new Promise((resolve, reject) => {
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheListRemoveValue.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheDictionaryFetch.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        `Issuing 'dictionaryFetch' request; dictionaryName: ${dictionaryName}`
      );
      const result = await this.sendDictionaryFetch(
        cacheName,
        this.convert(dictionaryName)
      );
      this.logger.trace(
        `'dictionaryFetch' request result: ${result.toString()}`
      );
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendDictionaryFetch(
    cacheName: string,
    dictionaryName: Uint8Array
  ): Promise<CacheDictionaryFetch.Response> {
    const request = new grpcCache._DictionaryFetchRequest({
      dictionary_name: dictionaryName,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheDictionaryFetch.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async dictionarySetField(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array,
    value: string | Uint8Array,
    options?: DictionarySetFieldCallOptions
  ): Promise<CacheDictionarySetField.Response> {
    try {
      validateCacheName(cacheName);
      validateDictionaryName(dictionaryName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheDictionarySetField.Error(err)
      );
    }

    const ttl = ttlOrFromCacheTtl(options);

    let encodedValue = this.convert(value);
    if (options?.compress) {
      this.logger.trace(
        'CacheClient.dictionarySetField; compression enabled, calling value compressor'
      );
      if (this.valueCompressor === undefined) {
        return this.cacheServiceErrorMapper.returnOrThrowError(
          new InvalidArgumentError(
            'Compressor is not set, but `CacheClient.dictionarySetField` was called with the `compress` option; please install @gomomento/sdk-nodejs-compression and call `Configuration.withCompressionStrategy` to enable compression.'
          ),
          err => new CacheDictionarySetField.Error(err)
        );
      }
      encodedValue = await this.valueCompressor.compress(
        this.configuration.getCompressionStrategy()?.compressionLevel ??
          CompressionLevel.Balanced,
        encodedValue
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        `Issuing 'dictionarySetField' request; field: ${field.toString()}, value length: ${
          value.length
        }, ttl: ${ttl.ttlSeconds.toString() ?? 'null'}`
      );

      const result = await this.sendDictionarySetField(
        cacheName,
        this.convert(dictionaryName),
        this.convert(field),
        encodedValue,
        ttl.ttlMilliseconds() || this.defaultTtlSeconds * 1000,
        ttl.refreshTtl()
      );
      this.logger.trace(
        `'dictionarySetField' request result: ${result.toString()}`
      );
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
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
    return await new Promise((resolve, reject) => {
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheDictionarySetField.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async dictionarySetFields(
    cacheName: string,
    dictionaryName: string,
    elements:
      | Map<string | Uint8Array, string | Uint8Array>
      | Record<string, string | Uint8Array>
      | Array<[string, string | Uint8Array]>,
    options?: DictionarySetFieldsCallOptions
  ): Promise<CacheDictionarySetFields.Response> {
    try {
      validateCacheName(cacheName);
      validateDictionaryName(dictionaryName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheDictionarySetFields.Error(err)
      );
    }

    const ttl = ttlOrFromCacheTtl(options);

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        `Issuing 'dictionarySetFields' request; elements: ${elements.toString()}, ttl: ${
          ttl.ttlSeconds.toString() ?? 'null'
        }`
      );

      const dictionaryFieldValuePairs = this.convertElements(elements);
      if (options?.compress) {
        this.logger.trace(
          'CacheClient.dictionarySetFields; compression enabled, calling value compressor'
        );
        if (this.valueCompressor === undefined) {
          return this.cacheServiceErrorMapper.returnOrThrowError(
            new InvalidArgumentError(
              'Compressor is not set, but `CacheClient.dictionarySetFields` was called with the `compress` option; please install @gomomento/sdk-nodejs-compression and call `Configuration.withCompressionStrategy` to enable compression.'
            ),
            err => new CacheDictionarySetFields.Error(err)
          );
        }
        for (const pair of dictionaryFieldValuePairs) {
          pair.value = await this.valueCompressor.compress(
            this.configuration.getCompressionStrategy()?.compressionLevel ??
              CompressionLevel.Balanced,
            pair.value
          );
        }
      }

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
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendDictionarySetFields(
    cacheName: string,
    dictionaryName: Uint8Array,
    elements: grpcCache._DictionaryFieldValuePair[],
    ttlMilliseconds: number,
    refreshTtl: boolean
  ): Promise<CacheDictionarySetFields.Response> {
    const request = new grpcCache._DictionarySetRequest({
      dictionary_name: dictionaryName,
      items: elements,
      ttl_milliseconds: ttlMilliseconds,
      refresh_ttl: refreshTtl,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e =>
                new CacheDictionarySetFields.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheDictionaryGetField.Error(err, this.convert(field))
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
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
    } finally {
      this.requestConcurrencySemaphore.release();
    }
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

    return await new Promise((resolve, reject) => {
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e =>
                new CacheDictionaryGetField.Error(e, field),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheDictionaryGetFields.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
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
    } finally {
      this.requestConcurrencySemaphore.release();
    }
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

    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().DictionaryGet(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp?.dictionary === 'found') {
            const items = resp.found.items.map(item => {
              const result = this.convertECacheResult(item.result);
              return new _DictionaryGetResponsePart(result, item.cache_body);
            });
            resolve(new CacheDictionaryGetFields.Hit(items, fields));
          } else if (resp?.dictionary === 'missing') {
            resolve(new CacheDictionaryGetFields.Miss());
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e =>
                new CacheDictionaryGetFields.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheDictionaryRemoveField.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
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
    } finally {
      this.requestConcurrencySemaphore.release();
    }
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

    return await new Promise((resolve, reject) => {
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e =>
                new CacheDictionaryRemoveField.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheDictionaryRemoveFields.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
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
    } finally {
      this.requestConcurrencySemaphore.release();
    }
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

    return await new Promise((resolve, reject) => {
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e =>
                new CacheDictionaryRemoveFields.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async dictionaryLength(
    cacheName: string,
    dictionaryName: string
  ): Promise<CacheDictionaryLength.Response> {
    try {
      validateCacheName(cacheName);
      validateDictionaryName(dictionaryName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheDictionaryLength.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        `Issuing 'dictionaryLength' request; dictionaryName: ${dictionaryName}`
      );
      const result = await this.sendDictionaryLength(
        cacheName,
        this.convert(dictionaryName)
      );
      this.logger.trace(
        `'dictionaryLength' request result: ${result.toString()}`
      );
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendDictionaryLength(
    cacheName: string,
    dictionaryName: Uint8Array
  ): Promise<CacheDictionaryLength.Response> {
    const request = new grpcCache._DictionaryLengthRequest({
      dictionary_name: dictionaryName,
    });
    const metadata = this.createMetadata(cacheName);

    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().DictionaryLength(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp?.missing) {
            resolve(new CacheDictionaryLength.Miss());
          } else if (resp?.found) {
            resolve(new CacheDictionaryLength.Hit(resp.found.length));
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheDictionaryLength.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async increment(
    cacheName: string,
    field: string | Uint8Array,
    amount = 1,
    ttl?: number
  ): Promise<CacheIncrement.Response> {
    try {
      validateCacheName(cacheName);
      if (ttl !== undefined) {
        validateTtlSeconds(ttl);
      }
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheIncrement.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        `Issuing 'increment' request; field: ${field.toString()}, amount : ${amount}, ttl: ${
          ttl?.toString() ?? 'null'
        }`
      );

      const result = await this.sendIncrement(
        cacheName,
        this.convert(field),
        amount,
        ttl || this.defaultTtlSeconds * 1000
      );
      this.logger.trace(`'increment' request result: ${result.toString()}`);
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendIncrement(
    cacheName: string,
    field: Uint8Array,
    amount = 1,
    ttlMilliseconds: number
  ): Promise<CacheIncrement.Response> {
    const request = new grpcCache._IncrementRequest({
      cache_key: field,
      amount,
      ttl_milliseconds: ttlMilliseconds,
    });
    const metadata = this.createMetadata(cacheName);

    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().Increment(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            if (resp.value) {
              resolve(new CacheIncrement.Success(resp.value));
            } else {
              resolve(new CacheIncrement.Success(0));
            }
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheIncrement.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheDictionaryIncrement.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
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
    } finally {
      this.requestConcurrencySemaphore.release();
    }
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
    return await new Promise((resolve, reject) => {
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e =>
                new CacheDictionaryIncrement.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async sortedSetPutElement(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array,
    score: number,
    ttl: CollectionTtl = CollectionTtl.fromCacheTtl()
  ): Promise<CacheSortedSetPutElement.Response> {
    try {
      validateCacheName(cacheName);
      validateSortedSetName(sortedSetName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheSortedSetPutElement.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        "Issuing 'sortedSetPutElement' request; value: %s, score : %s, ttl: %s",
        truncateString(value.toString()),
        score,
        ttl.ttlSeconds.toString() ?? 'null'
      );

      const result = await this.sendSortedSetPutElement(
        cacheName,
        this.convert(sortedSetName),
        this.convert(value),
        score,
        ttl.ttlMilliseconds() || this.defaultTtlSeconds * 1000,
        ttl.refreshTtl()
      );
      this.logger.trace(
        "'sortedSetPutElement' request result: %s",
        result.toString()
      );
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendSortedSetPutElement(
    cacheName: string,
    sortedSetName: Uint8Array,
    value: Uint8Array,
    score: number,
    ttlMilliseconds: number,
    refreshTtl: boolean
  ): Promise<CacheSortedSetPutElement.Response> {
    const request = new grpcCache._SortedSetPutRequest({
      set_name: sortedSetName,
      elements: [new grpcCache._SortedSetElement({value, score})],
      ttl_milliseconds: ttlMilliseconds,
      refresh_ttl: refreshTtl,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().SortedSetPut(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheSortedSetPutElement.Success());
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e =>
                new CacheSortedSetPutElement.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async sortedSetPutElements(
    cacheName: string,
    sortedSetName: string,
    elements:
      | Map<string | Uint8Array, number>
      | Record<string, number>
      | Array<[string, number]>,
    ttl: CollectionTtl = CollectionTtl.fromCacheTtl()
  ): Promise<CacheSortedSetPutElements.Response> {
    try {
      validateCacheName(cacheName);
      validateSortedSetName(sortedSetName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheSortedSetPutElements.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        "Issuing 'sortedSetPutElements' request; elements : %s, ttl: %s",
        elements.toString(),
        ttl.ttlSeconds.toString() ?? 'null'
      );

      const sortedSetValueScorePairs =
        this.convertSortedSetMapOrRecord(elements);

      const result = await this.sendSortedSetPutElements(
        cacheName,
        this.convert(sortedSetName),
        sortedSetValueScorePairs,
        ttl.ttlMilliseconds() || this.defaultTtlSeconds * 1000,
        ttl.refreshTtl()
      );
      this.logger.trace(
        "'sortedSetPutElements' request result: %s",
        result.toString()
      );
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendSortedSetPutElements(
    cacheName: string,
    sortedSetName: Uint8Array,
    elements: grpcCache._SortedSetElement[],
    ttlMilliseconds: number,
    refreshTtl: boolean
  ): Promise<CacheSortedSetPutElements.Response> {
    const request = new grpcCache._SortedSetPutRequest({
      set_name: sortedSetName,
      elements: elements,
      ttl_milliseconds: ttlMilliseconds,
      refresh_ttl: refreshTtl,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().SortedSetPut(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheSortedSetPutElements.Success());
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e =>
                new CacheSortedSetPutElements.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async sortedSetFetchByRank(
    cacheName: string,
    sortedSetName: string,
    order: SortedSetOrder,
    startRank: number,
    endRank?: number
  ): Promise<CacheSortedSetFetch.Response> {
    try {
      validateCacheName(cacheName);
      validateSortedSetName(sortedSetName);
      validateSortedSetRanks(startRank, endRank);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheSortedSetFetch.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        "Issuing 'sortedSetFetchByRank' request; startRank: %s, endRank : %s, order: %s",
        startRank.toString() ?? 'null',
        endRank?.toString() ?? 'null',
        order.toString()
      );

      const result = await this.sendSortedSetFetchByRank(
        cacheName,
        this.convert(sortedSetName),
        order,
        startRank,
        endRank
      );
      this.logger.trace(
        "'sortedSetFetchByRank' request result: %s",
        result.toString()
      );
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendSortedSetFetchByRank(
    cacheName: string,
    sortedSetName: Uint8Array,
    order: SortedSetOrder,
    startRank: number,
    endRank?: number
  ): Promise<CacheSortedSetFetch.Response> {
    const by_index = new grpcCache._SortedSetFetchRequest._ByIndex();
    if (startRank) {
      by_index.inclusive_start_index = startRank;
    } else {
      by_index.unbounded_start = new _Unbounded();
    }
    if (endRank) {
      by_index.exclusive_end_index = endRank;
    } else {
      by_index.unbounded_end = new _Unbounded();
    }

    const protoBufOrder =
      order === SortedSetOrder.Descending
        ? grpcCache._SortedSetFetchRequest.Order.DESCENDING
        : grpcCache._SortedSetFetchRequest.Order.ASCENDING;

    const request = new grpcCache._SortedSetFetchRequest({
      set_name: sortedSetName,
      order: protoBufOrder,
      with_scores: true,
      by_index: by_index,
    });

    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().SortedSetFetch(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            if (resp?.found) {
              if (resp?.found?.values_with_scores) {
                resolve(
                  new CacheSortedSetFetch.Hit(
                    resp.found.values_with_scores.elements
                  )
                );
              } else {
                resolve(
                  new CacheSortedSetFetch.Error(
                    new UnknownError(
                      'Unknown sorted set fetch hit response type'
                    )
                  )
                );
              }
            } else if (resp?.missing) {
              resolve(new CacheSortedSetFetch.Miss());
            } else {
              resolve(
                new CacheSortedSetFetch.Error(
                  new UnknownError('Unknown sorted set fetch response type')
                )
              );
            }
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheSortedSetFetch.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async sortedSetFetchByScore(
    cacheName: string,
    sortedSetName: string,
    order: SortedSetOrder,
    minScore?: number,
    maxScore?: number,
    offset?: number,
    count?: number
  ): Promise<CacheSortedSetFetch.Response> {
    try {
      validateCacheName(cacheName);
      validateSortedSetName(sortedSetName);
      validateSortedSetScores(minScore, maxScore);
      if (offset !== undefined) {
        validateSortedSetOffset(offset);
      }
      if (count !== undefined) {
        validateSortedSetCount(count);
      }
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheSortedSetFetch.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        "Issuing 'sortedSetFetchByScore' request; minScore: %s, maxScore : %s, order: %s, offset: %s, count: %s",
        minScore?.toString() ?? 'null',
        maxScore?.toString() ?? 'null',
        order.toString(),
        offset?.toString() ?? 'null',
        count?.toString() ?? 'null'
      );

      const result = await this.sendSortedSetFetchByScore(
        cacheName,
        this.convert(sortedSetName),
        order,
        minScore,
        maxScore,
        offset,
        count
      );

      this.logger.trace(
        "'sortedSetFetchByScore' request result: %s",
        result.toString()
      );
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendSortedSetFetchByScore(
    cacheName: string,
    sortedSetName: Uint8Array,
    order: SortedSetOrder,
    minScore?: number,
    maxScore?: number,
    offset?: number,
    count?: number
  ): Promise<CacheSortedSetFetch.Response> {
    const by_score = new grpcCache._SortedSetFetchRequest._ByScore();
    if (minScore !== undefined) {
      by_score.min_score = new grpcCache._SortedSetFetchRequest._ByScore._Score(
        {
          score: minScore,
          exclusive: false,
        }
      );
    } else {
      by_score.unbounded_min = new _Unbounded();
    }
    if (maxScore !== undefined) {
      by_score.max_score = new grpcCache._SortedSetFetchRequest._ByScore._Score(
        {
          score: maxScore,
          exclusive: false,
        }
      );
    } else {
      by_score.unbounded_max = new _Unbounded();
    }
    by_score.offset = offset ?? 0;
    // Note: the service reserves negative counts to mean all elements in the
    // result set.
    by_score.count = count ?? -1;

    const protoBufOrder =
      order === SortedSetOrder.Descending
        ? grpcCache._SortedSetFetchRequest.Order.DESCENDING
        : grpcCache._SortedSetFetchRequest.Order.ASCENDING;

    const request = new grpcCache._SortedSetFetchRequest({
      set_name: sortedSetName,
      order: protoBufOrder,
      with_scores: true,
      by_score: by_score,
    });

    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().SortedSetFetch(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            if (resp?.found) {
              if (resp?.found?.values_with_scores) {
                resolve(
                  new CacheSortedSetFetch.Hit(
                    resp.found.values_with_scores.elements
                  )
                );
              } else {
                resolve(
                  new CacheSortedSetFetch.Error(
                    new UnknownError(
                      'Unknown sorted set fetch hit response type'
                    )
                  )
                );
              }
            } else if (resp?.missing) {
              resolve(new CacheSortedSetFetch.Miss());
            } else {
              resolve(
                new CacheSortedSetFetch.Error(
                  new UnknownError('Unknown sorted set fetch response type')
                )
              );
            }
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheSortedSetFetch.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async sortedSetGetRank(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array
  ): Promise<CacheSortedSetGetRank.Response> {
    try {
      validateCacheName(cacheName);
      validateSortedSetName(sortedSetName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheSortedSetGetRank.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        "Issuing 'sortedSetGetRank' request; value: %s",
        truncateString(value.toString())
      );

      const result = await this.sendSortedSetGetRank(
        cacheName,
        this.convert(sortedSetName),
        this.convert(value)
      );

      this.logger.trace(
        "'sortedSetGetRank' request result: %s",
        truncateString(result.toString())
      );
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendSortedSetGetRank(
    cacheName: string,
    sortedSetName: Uint8Array,
    value: Uint8Array
  ): Promise<CacheSortedSetGetRank.Response> {
    const request = new grpcCache._SortedSetGetRankRequest({
      set_name: sortedSetName,
      value: value,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper
        .getClient()
        .SortedSetGetRank(
          request,
          metadata,
          {interceptors: this.interceptors},
          (err, resp) => {
            if (
              resp?.missing ||
              resp?.element_rank?.result === ECacheResult.Miss
            ) {
              resolve(new CacheSortedSetGetRank.Miss());
            } else if (resp?.element_rank?.result === ECacheResult.Hit) {
              if (resp?.element_rank.rank === undefined) {
                resolve(new CacheSortedSetGetRank.Miss());
              } else {
                resolve(new CacheSortedSetGetRank.Hit(resp.element_rank.rank));
              }
            } else {
              this.cacheServiceErrorMapper.resolveOrRejectError({
                err: err,
                errorResponseFactoryFn: e => new CacheSortedSetGetRank.Error(e),
                resolveFn: resolve,
                rejectFn: reject,
              });
            }
          }
        );
    });
  }

  public async sortedSetGetScore(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array
  ): Promise<CacheSortedSetGetScore.Response> {
    const responses = await this.sortedSetGetScores(cacheName, sortedSetName, [
      value,
    ] as string[] | Uint8Array[]);
    if (responses instanceof CacheSortedSetGetScores.Hit) {
      return responses.responses()[0];
    } else if (responses instanceof CacheSortedSetGetScores.Miss) {
      return new CacheSortedSetGetScore.Miss(this.convert(value));
    } else if (responses instanceof CacheSortedSetGetScores.Error) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        responses.innerException(),
        err => new CacheSortedSetGetScore.Error(err, this.convert(value))
      );
    }

    return this.cacheServiceErrorMapper.returnOrThrowError(
      new UnknownError('Unknown response type'),
      err => new CacheSortedSetGetScore.Error(err, this.convert(value))
    );
  }

  public async sortedSetGetScores(
    cacheName: string,
    sortedSetName: string,
    values: string[] | Uint8Array[]
  ): Promise<CacheSortedSetGetScores.Response> {
    try {
      validateCacheName(cacheName);
      validateSortedSetName(sortedSetName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheSortedSetGetScores.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        "Issuing 'sortedSetGetScores' request; values: %s",
        truncateString(values.toString())
      );

      const result = await this.sendSortedSetGetScores(
        cacheName,
        this.convert(sortedSetName),
        values.map(value => this.convert(value))
      );

      this.logger.trace(
        "'sortedSetGetScores' request result: %s",
        truncateString(result.toString())
      );
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendSortedSetGetScores(
    cacheName: string,
    sortedSetName: Uint8Array,
    values: Uint8Array[]
  ): Promise<CacheSortedSetGetScores.Response> {
    const request = new grpcCache._SortedSetGetScoreRequest({
      set_name: sortedSetName,
      values: values,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper
        .getClient()
        .SortedSetGetScore(
          request,
          metadata,
          {interceptors: this.interceptors},
          (err, resp) => {
            if (resp?.missing) {
              resolve(new CacheSortedSetGetScores.Miss());
            } else if (resp?.found) {
              const elements = resp.found.elements.map(ele => {
                const result = this.convertECacheResult(ele.result);
                return new _SortedSetGetScoreResponsePart(result, ele.score);
              });
              resolve(new CacheSortedSetGetScores.Hit(elements, values));
            } else {
              this.cacheServiceErrorMapper.resolveOrRejectError({
                err: err,
                errorResponseFactoryFn: e =>
                  new CacheSortedSetGetScores.Error(e),
                resolveFn: resolve,
                rejectFn: reject,
              });
            }
          }
        );
    });
  }

  public async sortedSetIncrementScore(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array,
    amount = 1,
    ttl: CollectionTtl = CollectionTtl.fromCacheTtl()
  ): Promise<CacheSortedSetIncrementScore.Response> {
    try {
      validateCacheName(cacheName);
      validateSortedSetName(sortedSetName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheSortedSetIncrementScore.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        "Issuing 'sortedSetIncrementScore' request; value: %s",
        truncateString(value.toString())
      );

      const result = await this.sendSortedSetIncrementScore(
        cacheName,
        this.convert(sortedSetName),
        this.convert(value),
        amount,
        ttl.ttlMilliseconds() || this.defaultTtlSeconds * 1000,
        ttl.refreshTtl()
      );

      this.logger.trace(
        "'sortedSetIncrementScore' request result: %s",
        truncateString(result.toString())
      );
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendSortedSetIncrementScore(
    cacheName: string,
    sortedSetName: Uint8Array,
    value: Uint8Array,
    amount: number,
    ttlMilliseconds: number,
    refreshTtl: boolean
  ): Promise<CacheSortedSetIncrementScore.Response> {
    const request = new grpcCache._SortedSetIncrementRequest({
      set_name: sortedSetName,
      value: value,
      amount: amount,
      ttl_milliseconds: ttlMilliseconds,
      refresh_ttl: refreshTtl,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper
        .getClient()
        .SortedSetIncrement(
          request,
          metadata,
          {interceptors: this.interceptors},
          (err, resp) => {
            if (resp) {
              if (resp.score) {
                resolve(new CacheSortedSetIncrementScore.Success(resp.score));
              } else {
                resolve(new CacheSortedSetIncrementScore.Success(0));
              }
            } else {
              this.cacheServiceErrorMapper.resolveOrRejectError({
                err: err,
                errorResponseFactoryFn: e =>
                  new CacheSortedSetIncrementScore.Error(e),
                resolveFn: resolve,
                rejectFn: reject,
              });
            }
          }
        );
    });
  }

  public async sortedSetRemoveElement(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array
  ): Promise<CacheSortedSetRemoveElement.Response> {
    try {
      validateCacheName(cacheName);
      validateSortedSetName(sortedSetName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheSortedSetFetch.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace("Issuing 'sortedSetRemoveElement' request");

      const result = await this.sendSortedSetRemoveElement(
        cacheName,
        this.convert(sortedSetName),
        this.convert(value)
      );

      this.logger.trace(
        "'sortedSetRemoveElement' request result: %s",
        truncateString(result.toString())
      );
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendSortedSetRemoveElement(
    cacheName: string,
    sortedSetName: Uint8Array,
    value: Uint8Array
  ): Promise<CacheSortedSetRemoveElement.Response> {
    const request = new grpcCache._SortedSetRemoveRequest({
      set_name: sortedSetName,
      some: new grpcCache._SortedSetRemoveRequest._Some({
        values: [value],
      }),
    });

    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().SortedSetRemove(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        err => {
          if (err) {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e =>
                new CacheSortedSetRemoveElement.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          } else {
            resolve(new CacheSortedSetRemoveElement.Success());
          }
        }
      );
    });
  }

  public async sortedSetRemoveElements(
    cacheName: string,
    sortedSetName: string,
    values: string[] | Uint8Array[]
  ): Promise<CacheSortedSetRemoveElements.Response> {
    try {
      validateCacheName(cacheName);
      validateSortedSetName(sortedSetName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheSortedSetFetch.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace("Issuing 'sortedSetRemoveElements' request");

      const result = await this.sendSortedSetRemoveElements(
        cacheName,
        this.convert(sortedSetName),
        this.convertArray(values)
      );

      this.logger.trace(
        "'sortedSetRemoveElements' request result: %s",
        truncateString(result.toString())
      );
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendSortedSetRemoveElements(
    cacheName: string,
    sortedSetName: Uint8Array,
    values: Uint8Array[]
  ): Promise<CacheSortedSetRemoveElements.Response> {
    const request = new grpcCache._SortedSetRemoveRequest({
      set_name: sortedSetName,
      some: new grpcCache._SortedSetRemoveRequest._Some({
        values: values,
      }),
    });

    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().SortedSetRemove(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        err => {
          if (err) {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e =>
                new CacheSortedSetRemoveElements.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          } else {
            resolve(new CacheSortedSetRemoveElements.Success());
          }
        }
      );
    });
  }

  public async sortedSetLength(
    cacheName: string,
    sortedSetName: string
  ): Promise<CacheSortedSetLength.Response> {
    try {
      validateCacheName(cacheName);
      validateSortedSetName(sortedSetName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheSortedSetFetch.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace("Issuing 'sortedSetLength' request");

      const result = await this.sendSortedSetLength(
        cacheName,
        this.convert(sortedSetName)
      );

      this.logger.trace(
        "'sortedSetLength' request result: %s",
        truncateString(result.toString())
      );
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendSortedSetLength(
    cacheName: string,
    sortedSetName: Uint8Array
  ): Promise<CacheSortedSetLength.Response> {
    const request = new grpcCache._SortedSetLengthRequest({
      set_name: sortedSetName,
    });

    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().SortedSetLength(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp?.missing) {
            resolve(new CacheSortedSetLength.Miss());
          } else if (resp?.found) {
            if (!resp.found.length) {
              resolve(new CacheSortedSetLength.Miss());
            } else {
              resolve(new CacheSortedSetLength.Hit(resp.found.length));
            }
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheSortedSetLength.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async sortedSetLengthByScore(
    cacheName: string,
    sortedSetName: string,
    minScore?: number,
    maxScore?: number
  ): Promise<CacheSortedSetLengthByScore.Response> {
    try {
      validateCacheName(cacheName);
      validateSortedSetName(sortedSetName);
      validateSortedSetScores(minScore, maxScore);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheSortedSetFetch.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        "Issuing 'sortedSetLengthByScore' request; minScore: %s, maxScore: %s",
        minScore?.toString() ?? 'null',
        maxScore?.toString() ?? 'null'
      );

      const result = await this.sendSortedSetLengthByScore(
        cacheName,
        this.convert(sortedSetName),
        minScore,
        maxScore
      );

      this.logger.trace(
        "'sortedSetLengthByScore' request result: %s",
        truncateString(result.toString())
      );
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendSortedSetLengthByScore(
    cacheName: string,
    sortedSetName: Uint8Array,
    minScore?: number,
    maxScore?: number
  ): Promise<CacheSortedSetLengthByScore.Response> {
    const request = new grpcCache._SortedSetLengthByScoreRequest({
      set_name: sortedSetName,
    });

    if (minScore === undefined) {
      request.unbounded_min = new _Unbounded();
    } else {
      request.inclusive_min = minScore;
    }

    if (maxScore === undefined) {
      request.unbounded_max = new _Unbounded();
    } else {
      request.inclusive_max = maxScore;
    }

    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().SortedSetLengthByScore(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp?.missing) {
            resolve(new CacheSortedSetLengthByScore.Miss());
          } else if (resp?.found) {
            if (!resp.found.length) {
              resolve(new CacheSortedSetLengthByScore.Miss());
            } else {
              resolve(new CacheSortedSetLengthByScore.Hit(resp.found.length));
            }
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e =>
                new CacheSortedSetLengthByScore.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  private initializeInterceptors(
    headers: Header[],
    loggerFactory: MomentoLoggerFactory,
    middlewares: Middleware[],
    middlewareRequestContext: MiddlewareRequestHandlerContext
  ): Interceptor[] {
    return [
      middlewaresInterceptor(
        loggerFactory,
        middlewares,
        middlewareRequestContext,
        this.clientWrapper.getClient()
      ),
      new HeaderInterceptorProvider(headers).createHeadersInterceptor(),
      ClientTimeoutInterceptor(this.requestTimeoutMs),
      ...createRetryInterceptorIfEnabled(
        this.configuration.getLoggerFactory(),
        this.configuration.getRetryStrategy()
      ),
    ];
  }

  // TODO https://github.com/momentohq/client-sdk-nodejs/issues/349
  // decide on streaming interceptors and middlewares
  private initializeStreamingInterceptors(headers: Header[]): Interceptor[] {
    return [new HeaderInterceptorProvider(headers).createHeadersInterceptor()];
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

  private convertElements(
    elements:
      | Map<string | Uint8Array, string | Uint8Array>
      | Record<string, string | Uint8Array>
      | Array<[string, string | Uint8Array]>
  ): grpcCache._DictionaryFieldValuePair[] {
    if (elements instanceof Array) {
      return this.convertElements(new Map(elements));
    } else if (elements instanceof Map) {
      return [...elements.entries()].map(
        element =>
          new grpcCache._DictionaryFieldValuePair({
            field: this.convert(element[0]),
            value: this.convert(element[1]),
          })
      );
    } else {
      return Object.entries(elements).map(
        element =>
          new grpcCache._DictionaryFieldValuePair({
            field: this.convert(element[0]),
            value: this.convert(element[1]),
          })
      );
    }
  }

  private convertSortedSetMapOrRecord(
    elements:
      | Map<string | Uint8Array, number>
      | Record<string, number>
      | Array<[string, number]>
  ): grpcCache._SortedSetElement[] {
    if (elements instanceof Array) {
      return this.convertSortedSetMapOrRecord(new Map(elements));
    } else if (elements instanceof Map) {
      return [...elements.entries()].map(
        element =>
          new grpcCache._SortedSetElement({
            value: this.convert(element[0]),
            score: element[1],
          })
      );
    } else {
      return Object.entries(elements).map(
        element =>
          new grpcCache._SortedSetElement({
            value: this.convert(element[0]),
            score: element[1],
          })
      );
    }
  }

  private convertSetBatchElements(
    elements:
      | Map<string | Uint8Array, string | Uint8Array>
      | Record<string, string | Uint8Array>
  ): Record<string, Uint8Array>[] {
    if (elements instanceof Map) {
      return [...elements.entries()].map(element => {
        return {
          key: this.convert(element[0]),
          value: this.convert(element[1]),
        };
      });
    } else {
      return Object.entries(elements).map(element => {
        return {
          key: this.convert(element[0]),
          value: this.convert(element[1]),
        };
      });
    }
  }

  public async itemGetType(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<CacheItemGetType.Response> {
    try {
      validateCacheName(cacheName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheItemGetType.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      return await this.sendItemGetType(cacheName, this.convert(key));
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendItemGetType(
    cacheName: string,
    key: Uint8Array
  ): Promise<CacheItemGetType.Response> {
    const request = new grpcCache._ItemGetTypeRequest({
      cache_key: key,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().ItemGetType(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp?.missing) {
            resolve(new CacheItemGetType.Miss());
          } else if (resp?.found) {
            resolve(
              new CacheItemGetType.Hit(
                this.convertItemTypeResult(resp.found.item_type)
              )
            );
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheItemGetType.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }
  public async itemGetTtl(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<CacheItemGetTtl.Response> {
    try {
      validateCacheName(cacheName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheItemGetTtl.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      return await this.sendItemGetTtl(cacheName, this.convert(key));
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendItemGetTtl(
    cacheName: string,
    key: Uint8Array
  ): Promise<CacheItemGetTtl.Response> {
    const request = new grpcCache._ItemGetTtlRequest({
      cache_key: key,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().ItemGetTtl(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp?.missing) {
            resolve(new CacheItemGetTtl.Miss());
          } else if (resp?.found) {
            resolve(new CacheItemGetTtl.Hit(resp.found.remaining_ttl_millis));
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheItemGetTtl.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async keyExists(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<CacheKeyExists.Response> {
    try {
      validateCacheName(cacheName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheKeyExists.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace("Issuing 'keyExists' request");

      const result = await this.sendKeyExists(cacheName, this.convert(key));

      this.logger.trace(
        "'keyExists' request result: %s",
        truncateString(result.toString())
      );
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendKeyExists(
    cacheName: string,
    key: Uint8Array
  ): Promise<CacheKeyExists.Response> {
    const request = new grpcCache._KeysExistRequest({
      cache_keys: [key],
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().KeysExist(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheKeyExists.Success(resp.exists));
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheKeyExists.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async updateTtl(
    cacheName: string,
    key: string | Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheUpdateTtl.Response> {
    try {
      validateCacheName(cacheName);
      validateValidForSeconds(ttlMilliseconds);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheUpdateTtl.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        "Issuing 'updateTtl' request; ttlMilliseconds: %s",
        ttlMilliseconds?.toString() ?? 'null'
      );

      const result = await this.sendUpdateTtl(
        cacheName,
        this.convert(key),
        ttlMilliseconds
      );

      this.logger.trace(
        "'updateTtl' request result: %s",
        truncateString(result.toString())
      );
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendUpdateTtl(
    cacheName: string,
    key: Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheUpdateTtl.Response> {
    const request = new grpcCache._UpdateTtlRequest({
      cache_key: key,
      overwrite_to_milliseconds: ttlMilliseconds,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().UpdateTtl(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp?.missing) {
            resolve(new CacheUpdateTtl.Miss());
          } else if (resp?.set) {
            resolve(new CacheUpdateTtl.Set());
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheUpdateTtl.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async keysExist(
    cacheName: string,
    keys: string[] | Uint8Array[]
  ): Promise<CacheKeysExist.Response> {
    try {
      validateCacheName(cacheName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheKeysExist.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace("Issuing 'keysExist' request");

      const result = await this.sendKeysExist(
        cacheName,
        this.convertArray(keys)
      );

      this.logger.trace(
        "'keysExist' request result: %s",
        truncateString(result.toString())
      );
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendKeysExist(
    cacheName: string,
    keys: Uint8Array[]
  ): Promise<CacheKeysExist.Response> {
    const request = new grpcCache._KeysExistRequest({
      cache_keys: keys,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().KeysExist(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheKeysExist.Success(resp.exists));
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheKeysExist.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async increaseTtl(
    cacheName: string,
    key: string | Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheIncreaseTtl.Response> {
    try {
      validateCacheName(cacheName);
      validateValidForSeconds(ttlMilliseconds);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheIncreaseTtl.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        "Issuing 'increaseTtl' request; ttlMilliseconds: %s",
        ttlMilliseconds?.toString() ?? 'null'
      );

      const result = await this.sendIncreaseTtl(
        cacheName,
        this.convert(key),
        ttlMilliseconds
      );

      this.logger.trace(
        "'increaseTtl' request result: %s",
        truncateString(result.toString())
      );
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendIncreaseTtl(
    cacheName: string,
    key: Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheIncreaseTtl.Response> {
    const request = new grpcCache._UpdateTtlRequest({
      cache_key: key,
      increase_to_milliseconds: ttlMilliseconds,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().UpdateTtl(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp?.missing) {
            resolve(new CacheIncreaseTtl.Miss());
          } else if (resp?.set) {
            resolve(new CacheIncreaseTtl.Set());
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheIncreaseTtl.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async decreaseTtl(
    cacheName: string,
    key: string | Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheDecreaseTtl.Response> {
    try {
      validateCacheName(cacheName);
      validateValidForSeconds(ttlMilliseconds);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheDecreaseTtl.Error(err)
      );
    }

    try {
      await this.requestConcurrencySemaphore.acquire();
      this.logger.trace(
        "Issuing 'decreaseTtl' request; ttlMilliseconds: %s",
        ttlMilliseconds?.toString() ?? 'null'
      );

      const result = await this.sendDecreaseTtl(
        cacheName,
        this.convert(key),
        ttlMilliseconds
      );

      this.logger.trace(
        "'decreaseTtl' request result: %s",
        truncateString(result.toString())
      );
      return result;
    } finally {
      this.requestConcurrencySemaphore.release();
    }
  }

  private async sendDecreaseTtl(
    cacheName: string,
    key: Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheDecreaseTtl.Response> {
    const request = new grpcCache._UpdateTtlRequest({
      cache_key: key,
      decrease_to_milliseconds: ttlMilliseconds,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().UpdateTtl(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err, resp) => {
          if (resp?.missing) {
            resolve(new CacheDecreaseTtl.Miss());
          } else if (resp?.set) {
            resolve(new CacheDecreaseTtl.Set());
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheDecreaseTtl.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
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
