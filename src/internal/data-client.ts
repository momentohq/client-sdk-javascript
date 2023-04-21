import {cache} from '@gomomento/generated-types-webtext';
import {
  CredentialProvider,
  MomentoLogger,
  CacheGet,
  UnknownError,
  CacheSet,
  InvalidArgumentError,
  CacheSetIfNotExists,
  CacheDelete,
  CacheIncrement,
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
  CollectionTtl,
} from '..';
import {version} from '../../package.json';
import {Configuration} from '../config/configuration';
import {Request, UnaryInterceptor, UnaryResponse} from 'grpc-web';
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  _DeleteRequest,
  _GetRequest,
  _IncrementRequest,
  _SetIfNotExistsRequest,
  _SetIfNotExistsResponse,
  _SetRequest,
  _ListConcatenateBackRequest,
  _ListConcatenateFrontRequest,
  _ListFetchRequest,
  _ListRetainRequest,
  _ListLengthRequest,
  _Unbounded,
  _ListPopFrontRequest,
  _ListPopBackRequest,
  _ListPushBackRequest,
  _ListPushFrontRequest,
  _ListRemoveRequest,
  ECacheResult,
} from '@gomomento/generated-types-webtext/dist/cacheclient_pb';
import {IDataClient} from '@gomomento/core/dist/src/internal/clients';
import {
  validateCacheName,
  validateListName,
  validateListSliceStartEnd,
} from '@gomomento/core/dist/src/internal/utils';
import {normalizeSdkError} from '@gomomento/core/dist/src/errors';
import {TextEncoder} from 'util';

export interface DataClientProps {
  configuration: Configuration;
  credentialProvider: CredentialProvider;
  /**
   * the default time to live of object inside of cache, in seconds
   */
  defaultTtlSeconds: number;
}

export class DataClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> implements IDataClient
{
  private readonly clientWrapper: cache.ScsClient;
  private readonly textEncoder: TextEncoder;
  private readonly interceptors: UnaryInterceptor<REQ, RESP>[];
  private readonly logger: MomentoLogger;
  private readonly authHeaders: {authorization: string};
  private readonly defaultTtlSeconds: number;

  /**
   * @param {DataClientProps} props
   */
  constructor(props: DataClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    const headers = [new Header('Agent', `nodejs:${version}`)];
    this.interceptors = [
      new HeaderInterceptorProvider<REQ, RESP>(
        headers
      ).createHeadersInterceptor(),
    ];
    this.logger.debug(
      `Creating data client using endpoint: '${props.credentialProvider.getCacheEndpoint()}`
    );

    this.defaultTtlSeconds = props.defaultTtlSeconds;
    this.authHeaders = {authorization: props.credentialProvider.getAuthToken()};
    this.clientWrapper = new cache.ScsClient(
      `https://${props.credentialProvider.getCacheEndpoint()}`,
      null,
      {
        unaryInterceptors: this.interceptors,
      }
    );
    this.textEncoder = new TextEncoder();
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
    key: string
  ): Promise<CacheGet.Response> {
    const request = new _GetRequest();
    request.setCacheKey(key);
    const metadata = this.createMetadata(cacheName);

    return await new Promise(resolve => {
      this.clientWrapper.get(
        request,
        {
          ...this.authHeaders,
          ...metadata,
        },
        (err, resp) => {
          if (resp) {
            switch (resp.getResult()) {
              case ECacheResult.MISS:
                resolve(new CacheGet.Miss());
                break;
              case ECacheResult.HIT:
                resolve(new CacheGet.Hit(resp.getCacheBody_asU8()));
                break;
              case ECacheResult.INVALID:
              case ECacheResult.OK:
                resolve(
                  new CacheGet.Error(new UnknownError(resp.getMessage()))
                );
                break;
              default:
                resolve(
                  new CacheGet.Error(
                    new UnknownError(
                      'An unknown error occurred: ' + resp.getMessage()
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

  public async set(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    ttl?: number
  ): Promise<CacheSet.Response> {
    try {
      validateCacheName(cacheName);
    } catch (err) {
      return new CacheSet.Error(normalizeSdkError(err as Error));
    }
    if (ttl && ttl < 0) {
      return new CacheSet.Error(
        new InvalidArgumentError('ttl must be a positive integer')
      );
    }
    const ttlToUse = ttl || this.defaultTtlSeconds;
    this.logger.trace(
      `Issuing 'set' request; key: ${key.toString()}, value length: ${
        value.length
      }, ttl: ${ttlToUse.toString()}`
    );

    return await this.sendSet(
      cacheName,
      this.convert(key),
      this.convert(value),
      ttlToUse
    );
  }

  private async sendSet(
    cacheName: string,
    key: string,
    value: string,
    ttlSeconds: number
  ): Promise<CacheSet.Response> {
    const request = new _SetRequest();
    request.setCacheKey(key);
    request.setCacheBody(value);
    request.setTtlMilliseconds(this.convertSecondsToMilliseconds(ttlSeconds));
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.set(
        request,
        {
          ...this.authHeaders,
          ...metadata,
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

  public async setIfNotExists(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    ttl?: number
  ): Promise<CacheSetIfNotExists.Response> {
    try {
      validateCacheName(cacheName);
    } catch (err) {
      return new CacheSetIfNotExists.Error(normalizeSdkError(err as Error));
    }
    if (ttl && ttl < 0) {
      return new CacheSetIfNotExists.Error(
        new InvalidArgumentError('ttl must be a positive integer')
      );
    }
    this.logger.trace(
      `Issuing 'setIfNotExists' request; key: ${key.toString()}, field: ${field.toString()}, ttl: ${
        ttl?.toString() ?? 'null'
      }`
    );

    const result = await this.sendSetIfNotExists(
      cacheName,
      this.convert(key),
      this.convert(field),
      ttl || this.defaultTtlSeconds * 1000
    );
    this.logger.trace(`'setIfNotExists' request result: ${result.toString()}`);
    return result;
  }

  private async sendSetIfNotExists(
    cacheName: string,
    key: string,
    field: string,
    ttlMilliseconds: number
  ): Promise<CacheSetIfNotExists.Response> {
    const request = new _SetIfNotExistsRequest();
    request.setCacheKey(key);
    request.setCacheBody(field);
    request.setTtlMilliseconds(ttlMilliseconds);
    const metadata = this.createMetadata(cacheName);

    return await new Promise(resolve => {
      this.clientWrapper.setIfNotExists(
        request,
        {
          ...this.authHeaders,
          ...metadata,
        },
        (err, resp) => {
          if (resp) {
            switch (resp.getResultCase()) {
              case _SetIfNotExistsResponse.ResultCase.STORED:
                resolve(new CacheSetIfNotExists.Stored());
                break;
              case _SetIfNotExistsResponse.ResultCase.NOT_STORED:
                resolve(new CacheSetIfNotExists.NotStored());
                break;
              default:
                resolve(
                  new CacheGet.Error(
                    new UnknownError(
                      'SetIfNotExists responded with an unknown result'
                    )
                  )
                );
                break;
            }
          } else {
            resolve(
              new CacheSetIfNotExists.Error(cacheServiceErrorMapper(err))
            );
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
    key: string
  ): Promise<CacheDelete.Response> {
    const request = new _DeleteRequest();
    request.setCacheKey(key);
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.delete(
        request,
        {
          ...this.authHeaders,
          ...metadata,
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

  public async increment(
    cacheName: string,
    field: string | Uint8Array,
    amount = 1,
    ttl?: number
  ): Promise<CacheIncrement.Response> {
    try {
      validateCacheName(cacheName);
    } catch (err) {
      return new CacheIncrement.Error(normalizeSdkError(err as Error));
    }
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
  }

  private async sendIncrement(
    cacheName: string,
    field: string,
    amount = 1,
    ttlMilliseconds: number
  ): Promise<CacheIncrement.Response> {
    const request = new _IncrementRequest();
    request.setCacheKey(field);
    request.setAmount(amount);
    request.setTtlMilliseconds(ttlMilliseconds);
    const metadata = this.createMetadata(cacheName);

    return await new Promise(resolve => {
      this.clientWrapper.increment(
        request,
        {
          ...this.authHeaders,
          ...metadata,
        },
        (err, resp) => {
          if (resp) {
            if (resp.getValue()) {
              resolve(new CacheIncrement.Success(resp.getValue()));
            } else {
              resolve(new CacheIncrement.Success(0));
            }
          } else {
            resolve(new CacheIncrement.Error(cacheServiceErrorMapper(err)));
          }
        }
      );
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
      listName,
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
    listName: string,
    values: string[],
    ttlMilliseconds: number,
    refreshTtl: boolean,
    truncateFrontToSize?: number
  ): Promise<CacheListConcatenateBack.Response> {
    const request = new _ListConcatenateBackRequest();
    request.setListName(listName);
    request.setValuesList(values);
    request.setTtlMilliseconds(ttlMilliseconds);
    request.setRefreshTtl(refreshTtl);
    request.setTruncateFrontToSize(truncateFrontToSize || 0);

    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.listConcatenateBack(
        request,
        {
          ...this.authHeaders,
          ...metadata,
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheListConcatenateBack.Success(resp.getListLength()));
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
    truncateBackToSize?: number,
    ttl: CollectionTtl = CollectionTtl.fromCacheTtl()
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
      listName,
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
    listName: string,
    values: string[],
    ttlMilliseconds: number,
    refreshTtl: boolean,
    truncateBackToSize?: number
  ): Promise<CacheListConcatenateFront.Response> {
    const request = new _ListConcatenateFrontRequest();
    request.setListName(listName);
    request.setValuesList(values);
    request.setTtlMilliseconds(ttlMilliseconds);
    request.setRefreshTtl(refreshTtl);
    request.setTruncateBackToSize(truncateBackToSize || 0);

    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.listConcatenateFront(
        request,
        {
          ...this.authHeaders,
          ...metadata,
        },
        (err, resp) => {
          if (resp) {
            resolve(
              new CacheListConcatenateFront.Success(resp.getListLength())
            );
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
    listName: string,
    startIndex?: number,
    endIndex?: number
  ): Promise<CacheListFetch.Response> {
    try {
      validateCacheName(cacheName);
      validateListName(listName);
      validateListSliceStartEnd(startIndex, endIndex);
    } catch (err) {
      return new CacheListFetch.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(
      "Issuing 'listFetch' request; listName: %s, startIndex: %s, endIndex: %s",
      listName,
      startIndex ?? 'null',
      endIndex ?? 'null'
    );
    const result = await this.sendListFetch(
      cacheName,
      listName,
      startIndex,
      endIndex
    );
    this.logger.trace("'listFetch' request result: %s", result.toString());
    return result;
  }

  private async sendListFetch(
    cacheName: string,
    listName: string,
    start?: number,
    end?: number
  ): Promise<CacheListFetch.Response> {
    const request = new _ListFetchRequest();
    request.setListName(listName);
    if (start) {
      request.setInclusiveStart(start);
    } else {
      request.setUnboundedStart(new _Unbounded());
    }
    if (end) {
      request.setExclusiveEnd(end);
    } else {
      request.setUnboundedEnd(new _Unbounded());
    }
    const metadata = this.createMetadata(cacheName);

    return await new Promise(resolve => {
      this.clientWrapper.listFetch(
        request,
        {
          ...this.authHeaders,
          ...metadata,
        },
        (err, resp) => {
          if (resp?.getMissing()) {
            resolve(new CacheListFetch.Miss());
          } else if (resp?.getFound()) {
            const found = resp?.getFound();
            if (found !== undefined) {
              const values = found.getValuesList();
              // TODO: does this work for mixed (str/byte) item lists? May need to
              //   add a convertMixedArray() method.
              resolve(new CacheListFetch.Hit(this.convertArrayToUint8(values)));
            } else {
              resolve(new CacheListFetch.Miss());
            }
          } else {
            resolve(new CacheListFetch.Error(cacheServiceErrorMapper(err)));
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
      return new CacheListRetain.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(
      "Issuing 'listRetain' request; listName: %s, startIndex: %s, endIndex: %s, ttl: %s",
      listName,
      startIndex ?? 'null',
      endIndex ?? 'null',
      ttl.ttlSeconds.toString() ?? 'null'
    );
    const result = await this.sendListRetain(
      cacheName,
      listName,
      // passing ttl info before start/end because it's guaranteed to be defined so doesn't need
      // to be nullable
      ttl.ttlMilliseconds() || this.defaultTtlSeconds * 1000,
      ttl.refreshTtl(),
      startIndex,
      endIndex
    );
    this.logger.trace("'listRetain' request result: %s", result.toString());
    return result;
  }

  private async sendListRetain(
    cacheName: string,
    listName: string,
    ttlMilliseconds: number,
    refreshTtl: boolean,
    start?: number,
    end?: number
  ): Promise<CacheListRetain.Response> {
    const request = new _ListRetainRequest();
    request.setListName(listName);
    request.setTtlMilliseconds(ttlMilliseconds);
    request.setRefreshTtl(refreshTtl);
    if (start) {
      request.setInclusiveStart(start);
    } else {
      request.setUnboundedStart(new _Unbounded());
    }
    if (end) {
      request.setExclusiveEnd(end);
    } else {
      request.setUnboundedEnd(new _Unbounded());
    }
    const metadata = this.createMetadata(cacheName);

    return await new Promise(resolve => {
      this.clientWrapper.listRetain(
        request,
        {
          ...this.authHeaders,
          ...metadata,
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheListRetain.Success());
          } else {
            resolve(new CacheListRetain.Error(cacheServiceErrorMapper(err)));
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
    const result = await this.sendListLength(cacheName, listName);
    this.logger.trace(`'listLength' request result: ${result.toString()}`);
    return result;
  }

  private async sendListLength(
    cacheName: string,
    listName: string
  ): Promise<CacheListLength.Response> {
    const request = new _ListLengthRequest();
    request.setListName(listName);
    const metadata = this.createMetadata(cacheName);

    return await new Promise(resolve => {
      this.clientWrapper.listLength(
        request,
        {
          ...this.authHeaders,
          ...metadata,
        },
        (err, resp) => {
          if (resp?.getMissing()) {
            resolve(new CacheListLength.Miss());
          } else if (resp?.getFound()) {
            // Unlike listFetch, listLength will return found if there is no list,
            // but there will be no length.
            const len = resp.getFound()?.getLength();
            if (!len) {
              resolve(new CacheListLength.Miss());
            } else {
              resolve(new CacheListLength.Hit(len));
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
    const result = await this.sendListPopBack(cacheName, listName);
    this.logger.trace(`'listPopBack' request result: ${result.toString()}`);
    return result;
  }

  private async sendListPopBack(
    cacheName: string,
    listName: string
  ): Promise<CacheListPopBack.Response> {
    const request = new _ListPopBackRequest();
    request.setListName(listName);
    const metadata = this.createMetadata(cacheName);

    return await new Promise(resolve => {
      this.clientWrapper.listPopBack(
        request,
        {
          ...this.authHeaders,
          ...metadata,
        },
        (err, resp) => {
          if (resp?.getMissing()) {
            resolve(new CacheListPopBack.Miss());
          } else if (resp?.getFound()) {
            const val = resp.getFound()?.getBack();
            if (!val) {
              resolve(new CacheListPopBack.Miss());
            } else {
              resolve(new CacheListPopBack.Hit(this.convertToUint8Array(val)));
            }
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
    const result = await this.sendListPopFront(cacheName, listName);
    this.logger.trace(`'listPopFront' request result: ${result.toString()}`);
    return result;
  }

  private async sendListPopFront(
    cacheName: string,
    listName: string
  ): Promise<CacheListPopFront.Response> {
    const request = new _ListPopFrontRequest();
    request.setListName(listName);
    const metadata = this.createMetadata(cacheName);

    return await new Promise(resolve => {
      this.clientWrapper.listPopFront(
        request,
        {
          ...this.authHeaders,
          ...metadata,
        },
        (err, resp) => {
          if (resp?.getMissing()) {
            resolve(new CacheListPopFront.Miss());
          } else if (resp?.getFound()) {
            const val = resp.getFound()?.getFront();
            if (!val) {
              resolve(new CacheListPopFront.Miss());
            } else {
              resolve(new CacheListPopFront.Hit(this.convertToUint8Array(val)));
            }
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
    truncateFrontToSize?: number,
    ttl: CollectionTtl = CollectionTtl.fromCacheTtl()
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
      listName,
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
    listName: string,
    value: string,
    ttlMilliseconds: number,
    refreshTtl: boolean,
    truncateFrontToSize?: number
  ): Promise<CacheListPushBack.Response> {
    const request = new _ListPushBackRequest();
    request.setListName(listName);
    request.setValue(value);
    request.setTtlMilliseconds(ttlMilliseconds);
    request.setRefreshTtl(refreshTtl);
    request.setTruncateFrontToSize(truncateFrontToSize || 0);
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.listPushBack(
        request,
        {
          ...this.authHeaders,
          ...metadata,
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheListPushBack.Success(resp.getListLength()));
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
    truncateBackToSize?: number,
    ttl: CollectionTtl = CollectionTtl.fromCacheTtl()
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
      listName,
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
    listName: string,
    value: string,
    ttlMilliseconds: number,
    refreshTtl: boolean,
    truncateBackToSize?: number
  ): Promise<CacheListPushFront.Response> {
    const request = new _ListPushFrontRequest();
    request.setListName(listName);
    request.setValue(value);
    request.setTtlMilliseconds(ttlMilliseconds);
    request.setRefreshTtl(refreshTtl);
    request.setTruncateBackToSize(truncateBackToSize || 0);
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.listPushFront(
        request,
        {
          ...this.authHeaders,
          ...metadata,
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheListPushFront.Success(resp.getListLength()));
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
      listName,
      this.convert(value)
    );
    this.logger.trace(`'listRemoveValue' request result: ${result.toString()}`);
    return result;
  }

  private async sendListRemoveValue(
    cacheName: string,
    listName: string,
    value: string
  ): Promise<CacheListRemoveValue.Response> {
    const request = new _ListRemoveRequest();
    request.setListName(listName);
    request.setAllElementsWithValue(value);
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.listRemove(
        request,
        {
          ...this.authHeaders,
          ...metadata,
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

  private createMetadata(cacheName: string): {cache: string} {
    return {cache: cacheName};
  }

  private convertSecondsToMilliseconds(ttlSeconds: number): number {
    return ttlSeconds * 1000;
  }

  private convert(v: string | Uint8Array): string {
    if (typeof v === 'string') {
      return btoa(v);
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return btoa(String.fromCharCode.apply(null, v));
  }

  private convertArray(v: string[] | Uint8Array[]): string[] {
    return v.map(i => this.convert(i));
  }

  private convertToUint8Array(v: string | Uint8Array): Uint8Array {
    if (typeof v === 'string') {
      return this.textEncoder.encode(v);
    }
    return v;
  }

  private convertArrayToUint8(v: (string | Uint8Array)[]): Uint8Array[] {
    return v.map(i => this.convertToUint8Array(i));
  }
}
