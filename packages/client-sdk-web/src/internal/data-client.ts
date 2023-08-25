import {cache} from '@gomomento/generated-types-webtext';
import {
  CacheDelete,
  CacheDictionaryFetch,
  CacheDictionaryGetField,
  CacheDictionaryGetFields,
  CacheDictionaryIncrement,
  CacheDictionaryRemoveField,
  CacheDictionaryRemoveFields,
  CacheDictionarySetField,
  CacheDictionarySetFields,
  CacheGet,
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
  CacheSet,
  CacheSetAddElements,
  CacheSetFetch,
  CacheSetIfNotExists,
  CacheSetRemoveElements,
  CacheSortedSetFetch,
  CacheSortedSetGetRank,
  CacheSortedSetGetScore,
  CacheSortedSetGetScores,
  CacheSortedSetIncrementScore,
  CacheSortedSetPutElement,
  CacheSortedSetPutElements,
  CacheSortedSetRemoveElement,
  CacheSortedSetRemoveElements,
  CacheSortedSetLength,
  CacheSortedSetLengthByScore,
  CacheItemGetType,
  CacheItemGetTtl,
  CacheKeyExists,
  CacheKeysExist,
  CacheUpdateTtl,
  CacheIncreaseTtl,
  CacheDecreaseTtl,
  CollectionTtl,
  ItemType,
  CredentialProvider,
  InvalidArgumentError,
  MomentoLogger,
  SortedSetOrder,
  UnknownError,
  CacheDictionaryLength,
} from '..';
import {Configuration} from '../config/configuration';
import {Request, UnaryResponse} from 'grpc-web';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  _DictionaryFieldValuePair,
  _DictionaryGetResponsePart,
  _ECacheResult,
  _SortedSetElement,
  _SortedSetGetScoreResponsePart,
} from '@gomomento/sdk-core/dist/src/messages/responses/grpc-response-types';
import {
  _DeleteRequest,
  _DictionaryDeleteRequest,
  _DictionaryFetchRequest,
  _DictionaryFieldValuePair as _DictionaryFieldValuePairGrpc,
  _DictionaryGetRequest,
  _DictionaryIncrementRequest,
  _DictionarySetRequest,
  _GetRequest,
  _IncrementRequest,
  _ItemGetTtlRequest,
  _ItemGetTypeRequest,
  _ItemGetTypeResponse,
  _ListConcatenateBackRequest,
  _ListConcatenateFrontRequest,
  _ListFetchRequest,
  _ListLengthRequest,
  _ListPopBackRequest,
  _ListPopFrontRequest,
  _ListPushBackRequest,
  _ListPushFrontRequest,
  _ListRemoveRequest,
  _ListRetainRequest,
  _SetDifferenceRequest,
  _SetFetchRequest,
  _SetIfNotExistsRequest,
  _SetIfNotExistsResponse,
  _SetRequest,
  _SetUnionRequest,
  _SortedSetElement as _SortedSetElementGrpc,
  _SortedSetFetchRequest,
  _SortedSetGetRankRequest,
  _SortedSetGetScoreRequest,
  _SortedSetIncrementRequest,
  _SortedSetPutRequest,
  _SortedSetRemoveRequest,
  _SortedSetLengthRequest,
  _SortedSetLengthByScoreRequest,
  _KeysExistRequest,
  _Unbounded,
  ECacheResult,
  _UpdateTtlRequest,
  _DictionaryLengthRequest,
} from '@gomomento/generated-types-webtext/dist/cacheclient_pb';
import {IDataClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {
  truncateString,
  validateCacheName,
  validateDictionaryName,
  validateListName,
  validateListSliceStartEnd,
  validateSetName,
  validateSortedSetCount,
  validateSortedSetName,
  validateSortedSetOffset,
  validateSortedSetRanks,
  validateSortedSetScores,
  validateValidForSeconds,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {normalizeSdkError} from '@gomomento/sdk-core/dist/src/errors';
import {
  convertToB64String,
  createCallMetadata,
  getWebCacheEndpoint,
} from '../utils/web-client-utils';
import {ClientMetadataProvider} from './client-metadata-provider';

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
  private readonly logger: MomentoLogger;
  private readonly clientMetadataProvider: ClientMetadataProvider;
  private readonly defaultTtlSeconds: number;
  private readonly deadlineMillis: number;

  /**
   * @param {DataClientProps} props
   */
  constructor(props: DataClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.logger.debug(
      `Creating data client using endpoint: '${getWebCacheEndpoint(
        props.credentialProvider
      )}`
    );

    this.deadlineMillis = props.configuration
      .getTransportStrategy()
      .getGrpcConfig()
      .getDeadlineMillis();
    this.defaultTtlSeconds = props.defaultTtlSeconds;
    this.clientMetadataProvider = new ClientMetadataProvider({
      authToken: props.credentialProvider.getAuthToken(),
    });
    this.clientWrapper = new cache.ScsClient(
      // Note: all web SDK requests are routed to a `web.` subdomain to allow us flexibility on the server
      getWebCacheEndpoint(props.credentialProvider),
      null,
      {}
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
    const result = await this.sendGet(cacheName, convertToB64String(key));
    this.logger.trace(`'get' request result: ${result.toString()}`);
    return result;
  }

  private async sendGet(
    cacheName: string,
    key: string
  ): Promise<CacheGet.Response> {
    const request = new _GetRequest();
    request.setCacheKey(key);

    return await new Promise(resolve => {
      this.clientWrapper.get(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
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
      convertToB64String(key),
      convertToB64String(value),
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

    return await new Promise(resolve => {
      this.clientWrapper.set(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
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
      convertToB64String(key),
      convertToB64String(field),
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

    return await new Promise(resolve => {
      this.clientWrapper.setIfNotExists(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
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
    return await this.sendDelete(cacheName, convertToB64String(key));
  }

  private async sendDelete(
    cacheName: string,
    key: string
  ): Promise<CacheDelete.Response> {
    const request = new _DeleteRequest();
    request.setCacheKey(key);

    return await new Promise(resolve => {
      this.clientWrapper.delete(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
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
      convertToB64String(field),
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

    return await new Promise(resolve => {
      this.clientWrapper.increment(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
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
    return await this.sendSetFetch(cacheName, convertToB64String(setName));
  }

  private async sendSetFetch(
    cacheName: string,
    setName: string
  ): Promise<CacheSetFetch.Response> {
    const request = new _SetFetchRequest();
    request.setSetName(setName);

    return await new Promise(resolve => {
      this.clientWrapper.setFetch(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          const theSet = resp?.getFound();
          if (theSet && theSet.getElementsList()) {
            const found = theSet.getElementsList();
            resolve(new CacheSetFetch.Hit(this.convertArrayToUint8(found)));
          } else if (resp?.getMissing()) {
            resolve(new CacheSetFetch.Miss());
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
      convertToB64String(setName),
      this.convertArrayToB64Strings(elements),
      ttl.ttlMilliseconds() || this.defaultTtlSeconds * 1000,
      ttl.refreshTtl()
    );
  }

  private async sendSetAddElements(
    cacheName: string,
    setName: string,
    elements: string[],
    ttlMilliseconds: number,
    refreshTtl: boolean
  ): Promise<CacheSetAddElements.Response> {
    const request = new _SetUnionRequest();
    request.setSetName(setName);
    request.setElementsList(elements);
    request.setTtlMilliseconds(ttlMilliseconds);
    request.setRefreshTtl(refreshTtl);

    return await new Promise(resolve => {
      this.clientWrapper.setUnion(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
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
      convertToB64String(setName),
      this.convertArrayToB64Strings(elements)
    );
  }

  private async sendSetRemoveElements(
    cacheName: string,
    setName: string,
    elements: string[]
  ): Promise<CacheSetRemoveElements.Response> {
    const subtrahend = new _SetDifferenceRequest._Subtrahend();
    const set = new _SetDifferenceRequest._Subtrahend._Set();
    set.setElementsList(elements);
    subtrahend.setSet(set);
    const request = new _SetDifferenceRequest();
    request.setSetName(setName);
    request.setSubtrahend(subtrahend);

    return await new Promise(resolve => {
      this.clientWrapper.setDifference(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
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
      convertToB64String(listName),
      this.convertArrayToB64Strings(values),
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

    return await new Promise(resolve => {
      this.clientWrapper.listConcatenateBack(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
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
      convertToB64String(listName),
      this.convertArrayToB64Strings(values),
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

    return await new Promise(resolve => {
      this.clientWrapper.listConcatenateFront(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
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
      convertToB64String(listName),
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

    return await new Promise(resolve => {
      this.clientWrapper.listFetch(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
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
      convertToB64String(listName),
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

    return await new Promise(resolve => {
      this.clientWrapper.listRetain(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
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
    const result = await this.sendListLength(
      cacheName,
      convertToB64String(listName)
    );
    this.logger.trace(`'listLength' request result: ${result.toString()}`);
    return result;
  }

  private async sendListLength(
    cacheName: string,
    listName: string
  ): Promise<CacheListLength.Response> {
    const request = new _ListLengthRequest();
    request.setListName(listName);

    return await new Promise(resolve => {
      this.clientWrapper.listLength(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
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
    const result = await this.sendListPopBack(
      cacheName,
      convertToB64String(listName)
    );
    this.logger.trace(`'listPopBack' request result: ${result.toString()}`);
    return result;
  }

  private async sendListPopBack(
    cacheName: string,
    listName: string
  ): Promise<CacheListPopBack.Response> {
    const request = new _ListPopBackRequest();
    request.setListName(listName);

    return await new Promise(resolve => {
      this.clientWrapper.listPopBack(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
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
    const result = await this.sendListPopFront(
      cacheName,
      convertToB64String(listName)
    );
    this.logger.trace(`'listPopFront' request result: ${result.toString()}`);
    return result;
  }

  private async sendListPopFront(
    cacheName: string,
    listName: string
  ): Promise<CacheListPopFront.Response> {
    const request = new _ListPopFrontRequest();
    request.setListName(listName);

    return await new Promise(resolve => {
      this.clientWrapper.listPopFront(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
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
      convertToB64String(listName),
      convertToB64String(value),
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

    return await new Promise(resolve => {
      this.clientWrapper.listPushBack(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
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
      convertToB64String(listName),
      convertToB64String(value),
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

    return await new Promise(resolve => {
      this.clientWrapper.listPushFront(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
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
      convertToB64String(listName),
      convertToB64String(value)
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

    return await new Promise(resolve => {
      this.clientWrapper.listRemove(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
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

  public async dictionarySetField(
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
      convertToB64String(dictionaryName),
      convertToB64String(field),
      convertToB64String(value),
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
    dictionaryName: string,
    field: string,
    value: string,
    ttlMilliseconds: number,
    refreshTtl: boolean
  ): Promise<CacheDictionarySetField.Response> {
    const request = new _DictionarySetRequest();
    request.setDictionaryName(dictionaryName);
    const item = new _DictionaryFieldValuePairGrpc();
    item.setField(field);
    item.setValue(value);
    request.setItemsList([item]);
    request.setTtlMilliseconds(ttlMilliseconds);
    request.setRefreshTtl(refreshTtl);

    return await new Promise(resolve => {
      this.clientWrapper.dictionarySet(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
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

  public async dictionarySetFields(
    cacheName: string,
    dictionaryName: string,
    elements:
      | Map<string | Uint8Array, string | Uint8Array>
      | Record<string, string | Uint8Array>,
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
      `Issuing 'dictionarySetFields' request; elements: ${elements.toString()}, ttl: ${
        ttl.ttlSeconds.toString() ?? 'null'
      }`
    );

    const dictionaryFieldValuePairs = this.convertMapOrRecord(elements);

    const result = await this.sendDictionarySetFields(
      cacheName,
      convertToB64String(dictionaryName),
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
    dictionaryName: string,
    elements: _DictionaryFieldValuePairGrpc[],
    ttlMilliseconds: number,
    refreshTtl: boolean
  ): Promise<CacheDictionarySetFields.Response> {
    const request = new _DictionarySetRequest();
    request.setDictionaryName(dictionaryName);
    request.setItemsList(elements);
    request.setTtlMilliseconds(ttlMilliseconds);
    request.setRefreshTtl(refreshTtl);

    return await new Promise(resolve => {
      this.clientWrapper.dictionarySet(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
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
        this.convertToUint8Array(field)
      );
    }
    this.logger.trace(
      `Issuing 'dictionaryGetField' request; field: ${field.toString()}`
    );
    const result = await this.sendDictionaryGetField(
      cacheName,
      convertToB64String(dictionaryName),
      convertToB64String(field)
    );
    this.logger.trace(
      `'dictionaryGetField' request result: ${result.toString()}`
    );
    return result;
  }

  private async sendDictionaryGetField(
    cacheName: string,
    dictionaryName: string,
    field: string
  ): Promise<CacheDictionaryGetField.Response> {
    const request = new _DictionaryGetRequest();
    request.setDictionaryName(dictionaryName);
    request.setFieldsList([field]);

    return await new Promise(resolve => {
      this.clientWrapper.dictionaryGet(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp?.getMissing()) {
            resolve(
              new CacheDictionaryGetField.Miss(this.convertToUint8Array(field))
            );
          } else if (resp?.getFound()) {
            const theList = resp.getFound();
            if (theList && theList.getItemsList().length === 0) {
              resolve(
                new CacheDictionaryGetField.Error(
                  new UnknownError(
                    '_DictionaryGetResponseResponse contained no data but was found'
                  ),
                  this.convertToUint8Array(field)
                )
              );
            } else if (
              theList &&
              theList.getItemsList()[0].getResult() === ECacheResult.MISS
            ) {
              resolve(
                new CacheDictionaryGetField.Miss(
                  this.convertToUint8Array(field)
                )
              );
            } else if (theList) {
              resolve(
                new CacheDictionaryGetField.Hit(
                  theList.getItemsList()[0].getCacheBody_asU8(),
                  this.convertToUint8Array(field)
                )
              );
            }
          } else {
            resolve(
              new CacheDictionaryGetField.Error(
                cacheServiceErrorMapper(err),
                this.convertToUint8Array(field)
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
      convertToB64String(dictionaryName),
      fields
    );
    this.logger.trace(
      `'dictionaryGetFields' request result: ${result.toString()}`
    );
    return result;
  }

  private async sendDictionaryGetFields(
    cacheName: string,
    dictionaryName: string,
    fields: string[] | Uint8Array[]
  ): Promise<CacheDictionaryGetFields.Response> {
    const request = new _DictionaryGetRequest();
    request.setDictionaryName(dictionaryName);
    request.setFieldsList(this.convertArrayToB64Strings(fields));

    return await new Promise(resolve => {
      this.clientWrapper.dictionaryGet(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          const found = resp?.getFound();
          if (found) {
            const items = found.getItemsList().map(item => {
              const result = this.convertECacheResult(item.getResult());
              return new _DictionaryGetResponsePart(
                result,
                item.getCacheBody_asU8()
              );
            });
            resolve(
              new CacheDictionaryGetFields.Hit(
                items,
                this.convertArrayToUint8(fields)
              )
            );
          } else if (resp?.getMissing()) {
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
      convertToB64String(dictionaryName)
    );
    this.logger.trace(`'dictionaryFetch' request result: ${result.toString()}`);
    return result;
  }

  private async sendDictionaryFetch(
    cacheName: string,
    dictionaryName: string
  ): Promise<CacheDictionaryFetch.Response> {
    const request = new _DictionaryFetchRequest();
    request.setDictionaryName(dictionaryName);

    return await new Promise(resolve => {
      this.clientWrapper.dictionaryFetch(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          const theDict = resp?.getFound();
          if (theDict && theDict.getItemsList()) {
            const retDict: _DictionaryFieldValuePair[] = [];
            const items = theDict.getItemsList();
            items.forEach(val => {
              const fvp = new _DictionaryFieldValuePair({
                field: val.getField_asU8(),
                value: this.convertToUint8Array(val.getValue()),
              });
              retDict.push(fvp);
            });
            resolve(new CacheDictionaryFetch.Hit(retDict));
          } else if (resp?.getMissing()) {
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
      convertToB64String(dictionaryName),
      convertToB64String(field),
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
    dictionaryName: string,
    field: string,
    amount: number,
    ttlMilliseconds: number,
    refreshTtl: boolean
  ): Promise<CacheDictionaryIncrement.Response> {
    const request = new _DictionaryIncrementRequest();
    request.setDictionaryName(dictionaryName);
    request.setField(field);
    request.setAmount(amount);
    request.setTtlMilliseconds(ttlMilliseconds);
    request.setRefreshTtl(refreshTtl);

    return await new Promise(resolve => {
      this.clientWrapper.dictionaryIncrement(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp) {
            if (resp.getValue()) {
              resolve(new CacheDictionaryIncrement.Success(resp.getValue()));
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
      convertToB64String(dictionaryName),
      convertToB64String(field)
    );
    this.logger.trace(
      `'dictionaryRemoveField' request result: ${result.toString()}`
    );
    return result;
  }

  private async sendDictionaryRemoveField(
    cacheName: string,
    dictionaryName: string,
    field: string
  ): Promise<CacheDictionaryRemoveField.Response> {
    const request = new _DictionaryDeleteRequest();
    request.setDictionaryName(dictionaryName);
    request.setSome(new _DictionaryDeleteRequest.Some().addFields(field));

    return await new Promise(resolve => {
      this.clientWrapper.dictionaryDelete(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
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
      convertToB64String(dictionaryName),
      this.convertArrayToB64Strings(fields)
    );
    this.logger.trace(
      `'dictionaryRemoveFields' request result: ${result.toString()}`
    );
    return result;
  }

  private async sendDictionaryRemoveFields(
    cacheName: string,
    dictionaryName: string,
    fields: string[]
  ): Promise<CacheDictionaryRemoveFields.Response> {
    const request = new _DictionaryDeleteRequest();
    request.setDictionaryName(dictionaryName);
    request.setSome(new _DictionaryDeleteRequest.Some().setFieldsList(fields));

    return await new Promise(resolve => {
      this.clientWrapper.dictionaryDelete(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
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

  public async dictionaryLength(
    cacheName: string,
    dictionaryName: string
  ): Promise<CacheDictionaryLength.Response> {
    try {
      validateCacheName(cacheName);
      validateDictionaryName(dictionaryName);
    } catch (err) {
      return new CacheDictionaryLength.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(
      `Issuing 'dictionaryLength' request; dictionaryName: ${dictionaryName}`
    );
    const result = await this.sendDictionaryLength(
      cacheName,
      convertToB64String(dictionaryName)
    );
    this.logger.trace(
      `'dictionaryLength' request result: ${result.toString()}`
    );
    return result;
  }

  private async sendDictionaryLength(
    cacheName: string,
    dictionaryName: string
  ): Promise<CacheDictionaryLength.Response> {
    const request = new _DictionaryLengthRequest();
    request.setDictionaryName(dictionaryName);

    return await new Promise(resolve => {
      this.clientWrapper.dictionaryLength(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp?.getMissing()) {
            resolve(new CacheDictionaryLength.Miss());
          } else if (resp?.getFound()) {
            const len = resp.getFound()?.getLength();
            if (!len) {
              resolve(new CacheDictionaryLength.Miss());
            } else {
              resolve(new CacheDictionaryLength.Hit(len));
            }
          } else {
            resolve(
              new CacheDictionaryLength.Error(cacheServiceErrorMapper(err))
            );
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
      return new CacheSortedSetFetch.Error(normalizeSdkError(err as Error));
    }

    this.logger.trace(
      "Issuing 'sortedSetFetchByRank' request; startRank: %s, endRank : %s, order: %s",
      startRank.toString() ?? 'null',
      endRank?.toString() ?? 'null',
      order.toString()
    );

    const result = await this.sendSortedSetFetchByRank(
      cacheName,
      convertToB64String(sortedSetName),
      order,
      startRank,
      endRank
    );
    this.logger.trace(
      "'sortedSetFetchByRank' request result: %s",
      result.toString()
    );
    return result;
  }

  private async sendSortedSetFetchByRank(
    cacheName: string,
    sortedSetName: string,
    order: SortedSetOrder,
    startRank: number,
    endRank?: number
  ): Promise<CacheSortedSetFetch.Response> {
    const by_index = new _SortedSetFetchRequest._ByIndex();
    if (startRank) {
      by_index.setInclusiveStartIndex(startRank);
    } else {
      by_index.setUnboundedStart(new _Unbounded());
    }
    if (endRank) {
      by_index.setExclusiveEndIndex(endRank);
    } else {
      by_index.setUnboundedEnd(new _Unbounded());
    }

    const protoBufOrder =
      order === SortedSetOrder.Descending
        ? _SortedSetFetchRequest.Order.DESCENDING
        : _SortedSetFetchRequest.Order.ASCENDING;

    const request = new _SortedSetFetchRequest();
    request.setSetName(sortedSetName);
    request.setOrder(protoBufOrder);
    request.setWithScores(true);
    request.setByIndex(by_index);

    return await new Promise(resolve => {
      this.clientWrapper.sortedSetFetch(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp && resp.getFound()) {
            const elems = resp
              .getFound()
              ?.getValuesWithScores()
              ?.getElementsList();
            if (elems) {
              const convertedElems = elems.map(elem => {
                return new _SortedSetElement(
                  this.convertToUint8Array(elem.getValue()),
                  elem.getScore()
                );
              });
              resolve(new CacheSortedSetFetch.Hit(convertedElems));
            } else {
              resolve(
                new CacheSortedSetFetch.Error(
                  new UnknownError('Unknown sorted set fetch hit response type')
                )
              );
            }
          } else if (resp?.getMissing()) {
            resolve(new CacheSortedSetFetch.Miss());
          } else {
            resolve(
              new CacheSortedSetFetch.Error(cacheServiceErrorMapper(err))
            );
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
      return new CacheSortedSetFetch.Error(normalizeSdkError(err as Error));
    }

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
      convertToB64String(sortedSetName),
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
  }

  private async sendSortedSetFetchByScore(
    cacheName: string,
    sortedSetName: string,
    order: SortedSetOrder,
    minScore?: number,
    maxScore?: number,
    offset?: number,
    count?: number
  ): Promise<CacheSortedSetFetch.Response> {
    const by_score = new _SortedSetFetchRequest._ByScore();
    if (minScore !== undefined) {
      by_score.setMinScore(
        new _SortedSetFetchRequest._ByScore._Score()
          .setScore(minScore)
          .setExclusive(false)
      );
    } else {
      by_score.setUnboundedMin(new _Unbounded());
    }
    if (maxScore !== undefined) {
      by_score.setMaxScore(
        new _SortedSetFetchRequest._ByScore._Score()
          .setScore(maxScore)
          .setExclusive(false)
      );
    } else {
      by_score.setUnboundedMax(new _Unbounded());
    }
    by_score.setOffset(offset ?? 0);
    // Note: the service reserves negative counts to mean all elements in the
    // result set.
    by_score.setCount(count ?? -1);

    const protoBufOrder =
      order === SortedSetOrder.Descending
        ? _SortedSetFetchRequest.Order.DESCENDING
        : _SortedSetFetchRequest.Order.ASCENDING;

    const request = new _SortedSetFetchRequest();
    request.setSetName(sortedSetName);
    request.setOrder(protoBufOrder);
    request.setWithScores(true);
    request.setByScore(by_score);

    return await new Promise(resolve => {
      this.clientWrapper.sortedSetFetch(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp) {
            if (resp?.getFound()?.getValuesWithScores()) {
              const elems = resp
                .getFound()
                ?.getValuesWithScores()
                ?.getElementsList();
              if (elems) {
                const convertedElems = elems.map(elem => {
                  return new _SortedSetElement(
                    this.convertToUint8Array(elem.getValue()),
                    elem.getScore()
                  );
                });
                resolve(new CacheSortedSetFetch.Hit(convertedElems));
              } else {
                resolve(
                  new CacheSortedSetFetch.Error(
                    new UnknownError(
                      'Unknown sorted set fetch hit response type'
                    )
                  )
                );
              }
            } else if (resp?.getMissing()) {
              resolve(new CacheSortedSetFetch.Miss());
            } else {
              resolve(
                new CacheSortedSetFetch.Error(
                  new UnknownError('Unknown sorted set fetch response type')
                )
              );
            }
          } else {
            resolve(
              new CacheSortedSetFetch.Error(cacheServiceErrorMapper(err))
            );
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
      return new CacheSortedSetPutElement.Error(
        normalizeSdkError(err as Error)
      );
    }
    this.logger.trace(
      "Issuing 'sortedSetPutElement' request; value: %s, score : %s, ttl: %s",
      truncateString(value.toString()),
      score,
      ttl.ttlSeconds.toString() ?? 'null'
    );

    const result = await this.sendSortedSetPutElement(
      cacheName,
      convertToB64String(sortedSetName),
      convertToB64String(value),
      score,
      ttl.ttlMilliseconds() || this.defaultTtlSeconds * 1000,
      ttl.refreshTtl()
    );
    this.logger.trace(
      "'sortedSetPutElement' request result: %s",
      result.toString()
    );
    return result;
  }

  private async sendSortedSetPutElement(
    cacheName: string,
    sortedSetName: string,
    value: string,
    score: number,
    ttlMilliseconds: number,
    refreshTtl: boolean
  ): Promise<CacheSortedSetPutElement.Response> {
    const request = new _SortedSetPutRequest();
    const elem = new _SortedSetElementGrpc();
    elem.setValue(value);
    elem.setScore(score);
    request.setSetName(sortedSetName);
    request.setElementsList([elem]);
    request.setTtlMilliseconds(ttlMilliseconds);
    request.setRefreshTtl(refreshTtl);

    return await new Promise(resolve => {
      this.clientWrapper.sortedSetPut(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheSortedSetPutElement.Success());
          } else {
            resolve(
              new CacheSortedSetPutElement.Error(cacheServiceErrorMapper(err))
            );
          }
        }
      );
    });
  }

  public async sortedSetPutElements(
    cacheName: string,
    sortedSetName: string,
    elements: Map<string | Uint8Array, number> | Record<string, number>,
    ttl: CollectionTtl = CollectionTtl.fromCacheTtl()
  ): Promise<CacheSortedSetPutElements.Response> {
    try {
      validateCacheName(cacheName);
      validateSortedSetName(sortedSetName);
    } catch (err) {
      return new CacheSortedSetPutElements.Error(
        normalizeSdkError(err as Error)
      );
    }
    this.logger.trace(
      "Issuing 'sortedSetPutElements' request; value: %s, score : %s, ttl: %s",
      elements.toString(),
      ttl.ttlSeconds.toString() ?? 'null'
    );

    const sortedSetValueScorePairs = this.convertSortedSetMapOrRecord(elements);

    const result = await this.sendSortedSetPutElements(
      cacheName,
      convertToB64String(sortedSetName),
      sortedSetValueScorePairs,
      ttl.ttlMilliseconds() || this.defaultTtlSeconds * 1000,
      ttl.refreshTtl()
    );
    this.logger.trace(
      "'sortedSetPutElements' request result: %s",
      result.toString()
    );
    return result;
  }

  private async sendSortedSetPutElements(
    cacheName: string,
    sortedSetName: string,
    elements: _SortedSetElementGrpc[],
    ttlMilliseconds: number,
    refreshTtl: boolean
  ): Promise<CacheSortedSetPutElements.Response> {
    const request = new _SortedSetPutRequest();
    request.setSetName(sortedSetName);
    request.setElementsList(elements);
    request.setTtlMilliseconds(ttlMilliseconds);
    request.setRefreshTtl(refreshTtl);

    return await new Promise(resolve => {
      this.clientWrapper.sortedSetPut(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheSortedSetPutElements.Success());
          } else {
            resolve(
              new CacheSortedSetPutElements.Error(cacheServiceErrorMapper(err))
            );
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
      return new CacheSortedSetGetScore.Miss(this.convertToUint8Array(value));
    } else if (responses instanceof CacheSortedSetGetScores.Error) {
      return new CacheSortedSetGetScore.Error(
        responses.innerException(),
        this.convertToUint8Array(value)
      );
    }

    return new CacheSortedSetGetScore.Error(
      new UnknownError('Unknown response type'),
      this.convertToUint8Array(value)
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
      return new CacheSortedSetGetScores.Error(normalizeSdkError(err as Error));
    }

    this.logger.trace(
      "Issuing 'sortedSetGetScores' request; values: %s",
      truncateString(values.toString())
    );

    const result = await this.sendSortedSetGetScores(
      cacheName,
      convertToB64String(sortedSetName),
      values.map(value => convertToB64String(value))
    );

    this.logger.trace(
      "'sortedSetGetScores' request result: %s",
      truncateString(result.toString())
    );
    return result;
  }

  private async sendSortedSetGetScores(
    cacheName: string,
    sortedSetName: string,
    values: string[]
  ): Promise<CacheSortedSetGetScores.Response> {
    const request = new _SortedSetGetScoreRequest();
    request.setSetName(sortedSetName);
    request.setValuesList(values);

    return await new Promise(resolve => {
      this.clientWrapper.sortedSetGetScore(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp?.getMissing()) {
            resolve(new CacheSortedSetGetScores.Miss());
          } else if (resp?.getFound()) {
            const elements = resp
              .getFound()
              ?.getElementsList()
              .map(ele => {
                const result = this.convertECacheResult(ele.getResult());
                return new _SortedSetGetScoreResponsePart(
                  result,
                  ele.getScore()
                );
              });
            if (elements) {
              resolve(
                new CacheSortedSetGetScores.Hit(
                  elements,
                  this.convertArrayToUint8(values.map(val => atob(val)))
                )
              );
            } else {
              resolve(
                new CacheSortedSetGetScores.Error(
                  new UnknownError('Unknown sorted set fetch hit response type')
                )
              );
            }
          } else {
            resolve(
              new CacheSortedSetGetScores.Error(cacheServiceErrorMapper(err))
            );
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
      return new CacheSortedSetGetRank.Error(normalizeSdkError(err as Error));
    }

    this.logger.trace(
      "Issuing 'sortedSetGetRank' request; value: %s",
      truncateString(value.toString())
    );

    const result = await this.sendSortedSetGetRank(
      cacheName,
      convertToB64String(sortedSetName),
      convertToB64String(value)
    );

    this.logger.trace(
      "'sortedSetGetRank' request result: %s",
      truncateString(result.toString())
    );
    return result;
  }

  private async sendSortedSetGetRank(
    cacheName: string,
    sortedSetName: string,
    value: string
  ): Promise<CacheSortedSetGetRank.Response> {
    const request = new _SortedSetGetRankRequest();
    request.setSetName(sortedSetName);
    request.setValue(value);

    return await new Promise(resolve => {
      this.clientWrapper.sortedSetGetRank(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (
            resp?.getMissing() ||
            resp?.getElementRank()?.getResult() === ECacheResult.MISS
          ) {
            resolve(new CacheSortedSetGetRank.Miss());
          } else if (resp?.getElementRank()?.getResult() === ECacheResult.HIT) {
            const rank = resp?.getElementRank()?.getRank();
            if (rank !== undefined) {
              resolve(new CacheSortedSetGetRank.Hit(rank));
            } else {
              resolve(new CacheSortedSetGetRank.Miss());
            }
          } else {
            resolve(
              new CacheSortedSetGetRank.Error(cacheServiceErrorMapper(err))
            );
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
      return new CacheSortedSetIncrementScore.Error(
        normalizeSdkError(err as Error)
      );
    }

    this.logger.trace(
      "Issuing 'sortedSetIncrementScore' request; value: %s",
      truncateString(value.toString())
    );

    const result = await this.sendSortedSetIncrementScore(
      cacheName,
      convertToB64String(sortedSetName),
      convertToB64String(value),
      amount,
      ttl.ttlMilliseconds() || this.defaultTtlSeconds * 1000,
      ttl.refreshTtl()
    );

    this.logger.trace(
      "'sortedSetIncrementScore' request result: %s",
      truncateString(result.toString())
    );
    return result;
  }

  private async sendSortedSetIncrementScore(
    cacheName: string,
    sortedSetName: string,
    value: string,
    amount: number,
    ttlMilliseconds: number,
    refreshTtl: boolean
  ): Promise<CacheSortedSetIncrementScore.Response> {
    const request = new _SortedSetIncrementRequest();
    request.setSetName(sortedSetName);
    request.setValue(value);
    request.setAmount(amount);
    request.setTtlMilliseconds(ttlMilliseconds);
    request.setRefreshTtl(refreshTtl);

    return await new Promise(resolve => {
      this.clientWrapper.sortedSetIncrement(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp) {
            if (resp.getScore()) {
              resolve(
                new CacheSortedSetIncrementScore.Success(resp.getScore())
              );
            } else {
              resolve(new CacheSortedSetIncrementScore.Success(0));
            }
          } else {
            resolve(
              new CacheSortedSetIncrementScore.Error(
                cacheServiceErrorMapper(err)
              )
            );
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
      return new CacheSortedSetFetch.Error(normalizeSdkError(err as Error));
    }

    this.logger.trace("Issuing 'sortedSetRemoveElement' request");

    const result = await this.sendSortedSetRemoveElement(
      cacheName,
      convertToB64String(sortedSetName),
      convertToB64String(value)
    );

    this.logger.trace(
      "'sortedSetRemoveElement' request result: %s",
      truncateString(result.toString())
    );
    return result;
  }

  private async sendSortedSetRemoveElement(
    cacheName: string,
    sortedSetName: string,
    value: string
  ): Promise<CacheSortedSetRemoveElement.Response> {
    const request = new _SortedSetRemoveRequest();
    request.setSetName(sortedSetName);
    request.setSome(new _SortedSetRemoveRequest._Some().setValuesList([value]));

    return await new Promise(resolve => {
      this.clientWrapper.sortedSetRemove(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        err => {
          if (err) {
            resolve(
              new CacheSortedSetRemoveElement.Error(
                cacheServiceErrorMapper(err)
              )
            );
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
      return new CacheSortedSetFetch.Error(normalizeSdkError(err as Error));
    }

    this.logger.trace("Issuing 'sortedSetRemoveElements' request");

    const result = await this.sendSortedSetRemoveElements(
      cacheName,
      convertToB64String(sortedSetName),
      this.convertArrayToB64Strings(values)
    );

    this.logger.trace(
      "'sortedSetRemoveElements' request result: %s",
      truncateString(result.toString())
    );
    return result;
  }

  private async sendSortedSetRemoveElements(
    cacheName: string,
    sortedSetName: string,
    values: string[]
  ): Promise<CacheSortedSetRemoveElements.Response> {
    const request = new _SortedSetRemoveRequest();
    request.setSetName(sortedSetName);
    request.setSome(new _SortedSetRemoveRequest._Some().setValuesList(values));

    return await new Promise(resolve => {
      this.clientWrapper.sortedSetRemove(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        err => {
          if (err) {
            resolve(
              new CacheSortedSetRemoveElements.Error(
                cacheServiceErrorMapper(err)
              )
            );
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
      return new CacheSortedSetFetch.Error(normalizeSdkError(err as Error));
    }

    this.logger.trace("Issuing 'sortedSetLength' request");

    const result = await this.sendSortedSetLength(
      cacheName,
      convertToB64String(sortedSetName)
    );

    this.logger.trace(
      "'sortedSetLength' request result: %s",
      truncateString(result.toString())
    );
    return result;
  }

  private async sendSortedSetLength(
    cacheName: string,
    sortedSetName: string
  ): Promise<CacheSortedSetLength.Response> {
    const request = new _SortedSetLengthRequest();
    request.setSetName(sortedSetName);

    return await new Promise(resolve => {
      this.clientWrapper.sortedSetLength(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp?.getMissing()) {
            resolve(new CacheSortedSetLength.Miss());
          } else if (resp?.getFound()) {
            const len = resp.getFound()?.getLength();
            if (!len) {
              resolve(new CacheSortedSetLength.Miss());
            } else {
              resolve(new CacheSortedSetLength.Hit(len));
            }
          } else {
            resolve(
              new CacheSortedSetLength.Error(cacheServiceErrorMapper(err))
            );
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
      return new CacheSortedSetFetch.Error(normalizeSdkError(err as Error));
    }

    this.logger.trace(
      "Issuing 'sortedSetLengthByScore' request; minScore: %s, maxScore: %s",
      minScore?.toString() ?? 'null',
      maxScore?.toString() ?? 'null'
    );

    const result = await this.sendSortedSetLengthByScore(
      cacheName,
      convertToB64String(sortedSetName),
      minScore,
      maxScore
    );

    this.logger.trace(
      "'sortedSetLengthByScore' request result: %s",
      truncateString(result.toString())
    );
    return result;
  }

  private async sendSortedSetLengthByScore(
    cacheName: string,
    sortedSetName: string,
    minScore?: number,
    maxScore?: number
  ): Promise<CacheSortedSetLengthByScore.Response> {
    const request = new _SortedSetLengthByScoreRequest();
    request.setSetName(sortedSetName);

    if (minScore === undefined) {
      request.setUnboundedMin(new _Unbounded());
    } else {
      request.setInclusiveMin(minScore);
    }

    if (maxScore === undefined) {
      request.setUnboundedMax(new _Unbounded());
    } else {
      request.setInclusiveMax(maxScore);
    }

    return await new Promise(resolve => {
      this.clientWrapper.sortedSetLengthByScore(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp?.getMissing()) {
            resolve(new CacheSortedSetLengthByScore.Miss());
          } else if (resp?.getFound()) {
            const len = resp.getFound()?.getLength();
            if (!len) {
              resolve(new CacheSortedSetLengthByScore.Miss());
            } else {
              resolve(new CacheSortedSetLengthByScore.Hit(len));
            }
          } else {
            resolve(
              new CacheSortedSetLengthByScore.Error(
                cacheServiceErrorMapper(err)
              )
            );
          }
        }
      );
    });
  }

  public async itemGetType(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<CacheItemGetType.Response> {
    try {
      validateCacheName(cacheName);
    } catch (err) {
      return new CacheItemGetType.Error(normalizeSdkError(err as Error));
    }
    return await this.sendItemGetType(cacheName, convertToB64String(key));
  }

  private async sendItemGetType(
    cacheName: string,
    key: string
  ): Promise<CacheItemGetType.Response> {
    const request = new _ItemGetTypeRequest();
    request.setCacheKey(key);

    return await new Promise(resolve => {
      this.clientWrapper.itemGetType(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          const theType = resp.getFound();
          if (theType) {
            const found = theType.getItemType();
            resolve(
              new CacheItemGetType.Hit(this.convertItemTypeResult(found))
            );
          } else if (resp?.getMissing()) {
            resolve(new CacheItemGetType.Miss());
          } else {
            resolve(new CacheItemGetType.Error(cacheServiceErrorMapper(err)));
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
      return new CacheItemGetTtl.Error(normalizeSdkError(err as Error));
    }
    return await this.sendItemGetTtl(cacheName, convertToB64String(key));
  }

  private async sendItemGetTtl(
    cacheName: string,
    key: string
  ): Promise<CacheItemGetTtl.Response> {
    const request = new _ItemGetTtlRequest();
    request.setCacheKey(key);

    return await new Promise(resolve => {
      this.clientWrapper.itemGetTtl(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          const rsp = resp.getFound();
          if (rsp) {
            resolve(new CacheItemGetTtl.Hit(rsp.getRemainingTtlMillis()));
          } else if (resp?.getMissing()) {
            resolve(new CacheItemGetTtl.Miss());
          } else {
            resolve(new CacheItemGetTtl.Error(cacheServiceErrorMapper(err)));
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
      return new CacheKeyExists.Error(normalizeSdkError(err as Error));
    }

    this.logger.trace("Issuing 'keyExists' request");

    const result = await this.sendKeyExists(cacheName, convertToB64String(key));

    this.logger.trace(
      "'keyExists' request result: %s",
      truncateString(result.toString())
    );
    return result;
  }

  private async sendKeyExists(
    cacheName: string,
    key: string
  ): Promise<CacheKeyExists.Response> {
    const request = new _KeysExistRequest();
    request.setCacheKeysList([key]);

    return await new Promise(resolve => {
      this.clientWrapper.keysExist(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheKeyExists.Success(resp.getExistsList()));
          } else {
            resolve(new CacheKeyExists.Error(cacheServiceErrorMapper(err)));
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
      return new CacheKeysExist.Error(normalizeSdkError(err as Error));
    }

    this.logger.trace("Issuing 'keysExist' request");

    const result = await this.sendKeysExist(
      cacheName,
      this.convertArrayToB64Strings(keys)
    );

    this.logger.trace(
      "'keysExist' request result: %s",
      truncateString(result.toString())
    );
    return result;
  }

  private async sendKeysExist(
    cacheName: string,
    keys: string[]
  ): Promise<CacheKeysExist.Response> {
    const request = new _KeysExistRequest();
    request.setCacheKeysList(keys);

    return await new Promise(resolve => {
      this.clientWrapper.keysExist(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheKeysExist.Success(resp.getExistsList()));
          } else {
            resolve(new CacheKeysExist.Error(cacheServiceErrorMapper(err)));
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
      return new CacheUpdateTtl.Error(normalizeSdkError(err as Error));
    }

    this.logger.trace(
      "Issuing 'updateTtl' request; ttlMilliseconds: %s",
      ttlMilliseconds?.toString() ?? 'null'
    );

    const result = await this.sendUpdateTtl(
      cacheName,
      convertToB64String(key),
      ttlMilliseconds
    );

    this.logger.trace(
      "'updateTtl' request result: %s",
      truncateString(result.toString())
    );
    return result;
  }

  private async sendUpdateTtl(
    cacheName: string,
    key: string | Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheUpdateTtl.Response> {
    const request = new _UpdateTtlRequest();
    request.setCacheKey(key);
    request.setOverwriteToMilliseconds(ttlMilliseconds);

    return await new Promise(resolve => {
      this.clientWrapper.updateTtl(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp?.getMissing()) {
            resolve(new CacheUpdateTtl.Miss());
          } else if (resp?.getSet()) {
            resolve(new CacheUpdateTtl.Set());
          } else {
            resolve(new CacheUpdateTtl.Error(cacheServiceErrorMapper(err)));
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
      return new CacheIncreaseTtl.Error(normalizeSdkError(err as Error));
    }

    this.logger.trace(
      "Issuing 'increaseTtl' request; ttlMilliseconds: %s",
      ttlMilliseconds?.toString() ?? 'null'
    );

    const result = await this.sendIncreaseTtl(
      cacheName,
      convertToB64String(key),
      ttlMilliseconds
    );

    this.logger.trace(
      "'increaseTtl' request result: %s",
      truncateString(result.toString())
    );
    return result;
  }

  private async sendIncreaseTtl(
    cacheName: string,
    key: string | Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheIncreaseTtl.Response> {
    const request = new _UpdateTtlRequest();
    request.setCacheKey(key);
    request.setIncreaseToMilliseconds(ttlMilliseconds);

    return await new Promise(resolve => {
      this.clientWrapper.updateTtl(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp?.getMissing()) {
            resolve(new CacheIncreaseTtl.Miss());
          } else if (resp?.getSet()) {
            resolve(new CacheIncreaseTtl.Set());
          } else {
            resolve(new CacheIncreaseTtl.Error(cacheServiceErrorMapper(err)));
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
      return new CacheDecreaseTtl.Error(normalizeSdkError(err as Error));
    }

    this.logger.trace(
      "Issuing 'decreaseTtl' request; ttlMilliseconds: %s",
      ttlMilliseconds?.toString() ?? 'null'
    );

    const result = await this.sendDecreaseTtl(
      cacheName,
      convertToB64String(key),
      ttlMilliseconds
    );

    this.logger.trace(
      "'decreaseTtl' request result: %s",
      truncateString(result.toString())
    );
    return result;
  }

  private async sendDecreaseTtl(
    cacheName: string,
    key: string | Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheDecreaseTtl.Response> {
    const request = new _UpdateTtlRequest();
    request.setCacheKey(key);
    request.setDecreaseToMilliseconds(ttlMilliseconds);

    return await new Promise(resolve => {
      this.clientWrapper.updateTtl(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp?.getMissing()) {
            resolve(new CacheDecreaseTtl.Miss());
          } else if (resp?.getSet()) {
            resolve(new CacheDecreaseTtl.Set());
          } else {
            resolve(new CacheDecreaseTtl.Error(cacheServiceErrorMapper(err)));
          }
        }
      );
    });
  }

  private convertSecondsToMilliseconds(ttlSeconds: number): number {
    return ttlSeconds * 1000;
  }

  private convertArrayToB64Strings(v: string[] | Uint8Array[]): string[] {
    return v.map(i => convertToB64String(i));
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

  private convertMapOrRecord(
    elements:
      | Map<string | Uint8Array, string | Uint8Array>
      | Record<string, string | Uint8Array>
  ): _DictionaryFieldValuePairGrpc[] {
    if (elements instanceof Map) {
      return [...elements.entries()].map(element =>
        new _DictionaryFieldValuePairGrpc()
          .setField(convertToB64String(element[0]))
          .setValue(convertToB64String(element[1]))
      );
    } else {
      return Object.entries(elements).map(element =>
        new _DictionaryFieldValuePairGrpc()
          .setField(convertToB64String(element[0]))
          .setValue(convertToB64String(element[1]))
      );
    }
  }

  private convertSortedSetMapOrRecord(
    elements: Map<string | Uint8Array, number> | Record<string, number>
  ): _SortedSetElementGrpc[] {
    if (elements instanceof Map) {
      return [...elements.entries()].map(element =>
        new _SortedSetElementGrpc()
          .setValue(convertToB64String(element[0]))
          .setScore(element[1])
      );
    } else {
      return Object.entries(elements).map(element =>
        new _SortedSetElementGrpc()
          .setValue(convertToB64String(element[0]))
          .setScore(element[1])
      );
    }
  }

  private convertECacheResult(result: ECacheResult): _ECacheResult {
    switch (result) {
      case ECacheResult.HIT:
        return _ECacheResult.Hit;
      case ECacheResult.INVALID:
        return _ECacheResult.Invalid;
      case ECacheResult.MISS:
        return _ECacheResult.Miss;
      case ECacheResult.OK:
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
}
