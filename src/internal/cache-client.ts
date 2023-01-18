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
import * as CacheDictionaryFetch from '../messages/responses/cache-dictionary-fetch';
import * as CacheDictionarySetField from '../messages/responses/cache-dictionary-set-field';
import * as CacheDictionarySetFields from '../messages/responses/cache-dictionary-set-fields';
import * as CacheDictionaryGetField from '../messages/responses/cache-dictionary-get-field';
import * as CacheDictionaryGetFields from '../messages/responses/cache-dictionary-get-fields';
import * as CacheDictionaryRemoveField from '../messages/responses/cache-dictionary-remove-field';
import * as CacheDictionaryRemoveFields from '../messages/responses/cache-dictionary-remove-fields';
import * as CacheDictionaryIncrement from '../messages/responses/cache-dictionary-increment';
import * as CacheListFetch from '../messages/responses/cache-list-fetch';
import * as CacheListPushFront from '../messages/responses/cache-list-push-front';
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
    items: {field: string | Uint8Array; value: string | Uint8Array}[],
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

    const dictionaryFieldValuePairs = items.map(
      item =>
        new grpcCache._DictionaryFieldValuePair({
          field: this.convert(item.field),
          value: this.convert(item.value),
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
    const encodedFields = fields.map(field => this.convert(field));
    const result = await this.sendDictionaryGetFields(
      cacheName,
      this.convert(dictionaryName),
      encodedFields
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
    const encodedFields = fields.map(field => this.convert(field));
    const result = await this.sendDictionaryRemoveFields(
      cacheName,
      this.convert(dictionaryName),
      encodedFields
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
      ...createRetryInterceptorIfEnabled(),
    ];
  }

  private convert(v: string | Uint8Array): Uint8Array {
    if (typeof v === 'string') {
      return this.textEncoder.encode(v);
    }
    return v;
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
