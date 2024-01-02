import {version} from '../../package.json';
import {IVectorIndexDataClient} from '@gomomento/sdk-core/dist/src/internal/clients/vector/IVectorIndexDataClient';
import {
  CredentialProvider,
  InvalidArgumentError,
  MomentoLogger,
  MomentoLoggerFactory,
  SearchOptions,
  VectorDeleteItemBatch,
  VectorSearch,
  VectorSearchAndFetchVectors,
  VectorIndexMetadata,
  VectorIndexItem,
  VectorUpsertItemBatch,
  VectorIndexStoredItem,
  VectorGetItemBatch,
  VectorGetItemMetadataBatch,
} from '@gomomento/sdk-core';
import {VectorIndexClientProps} from '../vector-index-client-props';
import {VectorIndexConfiguration} from '../config/vector-index-configuration';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {vectorindex} from '@gomomento/generated-types/dist/vectorindex';
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  validateIndexName,
  validateTopK,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {
  UnknownError,
  normalizeSdkError,
} from '@gomomento/sdk-core/dist/src/errors';
import {ALL_VECTOR_METADATA} from '@gomomento/sdk-core/dist/src/clients/IVectorIndexClient';

export class VectorIndexDataClient implements IVectorIndexDataClient {
  private readonly configuration: VectorIndexConfiguration;
  private readonly credentialProvider: CredentialProvider;
  private readonly logger: MomentoLogger;
  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;
  private readonly requestTimeoutMs: number;
  private readonly client: vectorindex.VectorIndexClient;
  private readonly interceptors: Interceptor[];

  constructor(props: VectorIndexClientProps) {
    this.configuration = props.configuration;
    this.credentialProvider = props.credentialProvider;
    this.logger = this.configuration.getLoggerFactory().getLogger(this);
    this.cacheServiceErrorMapper = new CacheServiceErrorMapper(
      props.configuration.getThrowOnErrors()
    );
    const grpcConfig = this.configuration
      .getTransportStrategy()
      .getGrpcConfig();

    this.requestTimeoutMs = grpcConfig.getDeadlineMillis();
    this.validateRequestTimeout(this.requestTimeoutMs);
    this.logger.debug(
      `Creating vector index client using endpoint: '${this.credentialProvider.getVectorEndpoint()}'`
    );

    this.client = new vectorindex.VectorIndexClient(
      this.credentialProvider.getVectorEndpoint(),
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
        // The following settings are based on https://github.com/grpc/grpc/blob/e35db43c07f27cc13ec061520da1ed185f36abd4/doc/keepalive.md ,
        // and guidance provided on various github issues for grpc-node. They will enable keepalive pings when a
        // client connection is idle.
        'grpc.keepalive_permit_without_calls': 1,
        'grpc.keepalive_timeout_ms': 1000,
        'grpc.keepalive_time_ms': 5000,
      }
    );

    this.interceptors = this.initializeInterceptors(
      this.configuration.getLoggerFactory()
    );
  }

  public async upsertItemBatch(
    indexName: string,
    items: Array<VectorIndexItem>
  ): Promise<VectorUpsertItemBatch.Response> {
    let request: vectorindex._UpsertItemBatchRequest;
    try {
      validateIndexName(indexName);

      // Create the request here to catch any metadata validation errors.
      request = VectorIndexDataClient.buildUpsertItemBatchRequest(
        indexName,
        items
      );
    } catch (err) {
      return new VectorUpsertItemBatch.Error(normalizeSdkError(err as Error));
    }
    return await this.sendUpsertItemBatch(indexName, request);
  }

  private static buildUpsertItemBatchRequest(
    indexName: string,
    items: Array<VectorIndexItem>
  ): vectorindex._UpsertItemBatchRequest {
    return new vectorindex._UpsertItemBatchRequest({
      index_name: indexName,
      items: items.map(item => {
        return new vectorindex._Item({
          id: item.id,
          vector: new vectorindex._Vector({elements: item.vector}),
          metadata:
            VectorIndexDataClient.convertItemMetadataToProtobufMetadata(item),
        });
      }),
    });
  }

  private static convertItemMetadataToProtobufMetadata(
    item: VectorIndexItem
  ): vectorindex._Metadata[] {
    if (item.metadata === undefined) {
      return [];
    }
    return Object.entries(item.metadata).map(([key, value]) => {
      if (typeof value === 'string') {
        return new vectorindex._Metadata({
          field: key,
          string_value: value,
        });
      } else if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          return new vectorindex._Metadata({
            field: key,
            integer_value: value,
          });
        } else {
          return new vectorindex._Metadata({
            field: key,
            double_value: value,
          });
        }
      } else if (typeof value === 'boolean') {
        return new vectorindex._Metadata({
          field: key,
          boolean_value: value,
        });
      } else if (
        Array.isArray(value) &&
        value.every(item => typeof item === 'string')
      ) {
        return new vectorindex._Metadata({
          field: key,
          list_of_strings_value: new vectorindex._Metadata._ListOfStrings({
            values: value,
          }),
        });
      } else {
        throw new InvalidArgumentError(
          `Metadata value for field '${key}' is not a valid type. Value is of type '${typeof value} and is not a string, number, boolean, or array of strings.'`
        );
      }
    });
  }

  private async sendUpsertItemBatch(
    indexName: string,
    request: vectorindex._UpsertItemBatchRequest
  ): Promise<VectorUpsertItemBatch.Response> {
    return await new Promise((resolve, reject) => {
      this.client.UpsertItemBatch(
        request,
        {interceptors: this.interceptors},
        (err, resp) => {
          if (resp) {
            resolve(new VectorUpsertItemBatch.Success());
          } else {
            this.cacheServiceErrorMapper.handleError(
              err,
              e => new VectorUpsertItemBatch.Error(e),
              resolve,
              reject
            );
          }
        }
      );
    });
  }

  public async deleteItemBatch(
    indexName: string,
    ids: Array<string>
  ): Promise<VectorDeleteItemBatch.Response> {
    try {
      validateIndexName(indexName);
    } catch (err) {
      return new VectorDeleteItemBatch.Error(normalizeSdkError(err as Error));
    }
    return await this.sendDeleteItemBatch(indexName, ids);
  }

  private async sendDeleteItemBatch(
    indexName: string,
    ids: Array<string>
  ): Promise<VectorDeleteItemBatch.Response> {
    const request = new vectorindex._DeleteItemBatchRequest({
      index_name: indexName,
      ids: ids,
    });
    return await new Promise((resolve, reject) => {
      this.client.DeleteItemBatch(
        request,
        {interceptors: this.interceptors},
        (err, resp) => {
          if (resp) {
            resolve(new VectorDeleteItemBatch.Success());
          } else {
            this.cacheServiceErrorMapper.handleError(
              err,
              e => new VectorDeleteItemBatch.Error(e),
              resolve,
              reject
            );
          }
        }
      );
    });
  }

  public async search(
    indexName: string,
    queryVector: Array<number>,
    options?: SearchOptions
  ): Promise<VectorSearch.Response> {
    try {
      validateIndexName(indexName);
      if (options?.topK !== undefined) {
        validateTopK(options.topK);
      }
    } catch (err) {
      return new VectorSearch.Error(normalizeSdkError(err as Error));
    }
    return await this.sendSearch(indexName, queryVector, options);
  }

  private static prepareMetadataRequest(
    options?: SearchOptions
  ): vectorindex._MetadataRequest {
    const metadataRequest = new vectorindex._MetadataRequest();
    if (options?.metadataFields === ALL_VECTOR_METADATA) {
      metadataRequest.all = new vectorindex._MetadataRequest.All();
    } else {
      metadataRequest.some = new vectorindex._MetadataRequest.Some({
        fields:
          options?.metadataFields === undefined ? [] : options.metadataFields,
      });
    }
    return metadataRequest;
  }

  private static applyScoreThreshold(
    request:
      | vectorindex._SearchRequest
      | vectorindex._SearchAndFetchVectorsRequest,
    options?: SearchOptions
  ): void {
    if (options?.scoreThreshold !== undefined) {
      request.score_threshold = options.scoreThreshold;
    } else {
      request.no_score_threshold = new vectorindex._NoScoreThreshold();
    }
  }

  private static deserializeMetadata(
    metadata: vectorindex._Metadata[],
    errorCallback: () => void
  ): VectorIndexMetadata {
    return metadata.reduce((acc, metadata) => {
      const field = metadata.field;
      switch (metadata.value) {
        case 'string_value':
          acc[field] = metadata.string_value;
          break;
        case 'integer_value':
          acc[field] = metadata.integer_value;
          break;
        case 'double_value':
          acc[field] = metadata.double_value;
          break;
        case 'boolean_value':
          acc[field] = metadata.boolean_value;
          break;
        case 'list_of_strings_value':
          acc[field] = metadata.list_of_strings_value.values;
          break;
        default:
          errorCallback();
          break;
      }
      return acc;
    }, {} as VectorIndexMetadata);
  }

  private async sendSearch(
    indexName: string,
    queryVector: Array<number>,
    options?: SearchOptions
  ): Promise<VectorSearch.Response> {
    const request = new vectorindex._SearchRequest({
      index_name: indexName,
      query_vector: new vectorindex._Vector({elements: queryVector}),
      top_k: options?.topK,
      metadata_fields: VectorIndexDataClient.prepareMetadataRequest(options),
    });
    VectorIndexDataClient.applyScoreThreshold(request, options);

    return await new Promise((resolve, reject) => {
      this.client.Search(
        request,
        {interceptors: this.interceptors},
        (err, resp) => {
          if (resp) {
            resolve(
              new VectorSearch.Success(
                resp.hits.map(hit => ({
                  id: hit.id,
                  score: hit.score,
                  metadata: VectorIndexDataClient.deserializeMetadata(
                    hit.metadata,
                    () =>
                      resolve(
                        new VectorSearch.Error(
                          new UnknownError(
                            'Search responded with an unknown result'
                          )
                        )
                      )
                  ),
                }))
              )
            );
          } else {
            this.cacheServiceErrorMapper.handleError(
              err,
              e => new VectorSearch.Error(e),
              resolve,
              reject
            );
          }
        }
      );
    });
  }

  public async searchAndFetchVectors(
    indexName: string,
    queryVector: Array<number>,
    options?: SearchOptions
  ): Promise<VectorSearchAndFetchVectors.Response> {
    try {
      validateIndexName(indexName);
      if (options?.topK !== undefined) {
        validateTopK(options.topK);
      }
    } catch (err) {
      return new VectorSearchAndFetchVectors.Error(
        normalizeSdkError(err as Error)
      );
    }
    return await this.sendSearchAndFetchVectors(
      indexName,
      queryVector,
      options
    );
  }

  private async sendSearchAndFetchVectors(
    indexName: string,
    queryVector: Array<number>,
    options?: SearchOptions
  ): Promise<VectorSearchAndFetchVectors.Response> {
    const request = new vectorindex._SearchAndFetchVectorsRequest({
      index_name: indexName,
      query_vector: new vectorindex._Vector({elements: queryVector}),
      top_k: options?.topK,
      metadata_fields: VectorIndexDataClient.prepareMetadataRequest(options),
    });
    VectorIndexDataClient.applyScoreThreshold(request, options);

    return await new Promise((resolve, reject) => {
      this.client.SearchAndFetchVectors(
        request,
        {interceptors: this.interceptors},
        (err, resp) => {
          if (resp) {
            resolve(
              new VectorSearchAndFetchVectors.Success(
                resp.hits.map(hit => ({
                  id: hit.id,
                  score: hit.score,
                  vector: hit.vector.elements,
                  metadata: VectorIndexDataClient.deserializeMetadata(
                    hit.metadata,
                    () =>
                      resolve(
                        new VectorSearchAndFetchVectors.Error(
                          new UnknownError(
                            'SearchAndFetchVectors responded with an unknown result'
                          )
                        )
                      )
                  ),
                }))
              )
            );
          } else {
            this.cacheServiceErrorMapper.handleError(
              err,
              e => new VectorSearchAndFetchVectors.Error(e),
              resolve,
              reject
            );
          }
        }
      );
    });
  }

  public async getItemBatch(
    indexName: string,
    ids: string[]
  ): Promise<VectorGetItemBatch.Response> {
    try {
      validateIndexName(indexName);
    } catch (err) {
      return new VectorGetItemBatch.Error(normalizeSdkError(err as Error));
    }
    return await this.sendGetItemBatch(indexName, ids);
  }

  private async sendGetItemBatch(
    indexName: string,
    ids: string[]
  ): Promise<VectorGetItemBatch.Response> {
    const request = new vectorindex._GetItemBatchRequest({
      index_name: indexName,
      ids: ids,
      metadata_fields: VectorIndexDataClient.prepareMetadataRequest({
        metadataFields: ALL_VECTOR_METADATA,
      }),
    });
    return await new Promise((resolve, reject) => {
      this.client.GetItemBatch(
        request,
        {interceptors: this.interceptors},
        (err, resp) => {
          if (resp) {
            resolve(
              new VectorGetItemBatch.Success(
                resp.item_response.reduce((acc, itemResponse) => {
                  switch (itemResponse.response) {
                    case 'hit':
                      acc[itemResponse.hit.id] = {
                        id: itemResponse.hit.id,
                        vector: itemResponse.hit.vector.elements,
                        metadata: VectorIndexDataClient.deserializeMetadata(
                          itemResponse.hit.metadata,
                          () =>
                            resolve(
                              new VectorGetItemBatch.Error(
                                new UnknownError(
                                  'GetItemBatch responded with an unknown result'
                                )
                              )
                            )
                        ),
                      };
                      break;
                    case 'miss':
                      break;
                    default:
                      resolve(
                        new VectorGetItemBatch.Error(
                          new UnknownError(
                            'GetItemBatch responded with an unknown result'
                          )
                        )
                      );
                      break;
                  }
                  return acc;
                }, {} as Record<string, VectorIndexStoredItem>)
              )
            );
          } else {
            this.cacheServiceErrorMapper.handleError(
              err,
              e => new VectorGetItemBatch.Error(e),
              resolve,
              reject
            );
          }
        }
      );
    });
  }

  public async getItemMetadataBatch(
    indexName: string,
    ids: string[]
  ): Promise<VectorGetItemMetadataBatch.Response> {
    try {
      validateIndexName(indexName);
    } catch (err) {
      return new VectorGetItemMetadataBatch.Error(
        normalizeSdkError(err as Error)
      );
    }
    return await this.sendGetItemMetadataBatch(indexName, ids);
  }

  private async sendGetItemMetadataBatch(
    indexName: string,
    ids: string[]
  ): Promise<VectorGetItemMetadataBatch.Response> {
    const request = new vectorindex._GetItemMetadataBatchRequest({
      index_name: indexName,
      ids: ids,
      metadata_fields: VectorIndexDataClient.prepareMetadataRequest({
        metadataFields: ALL_VECTOR_METADATA,
      }),
    });
    return await new Promise((resolve, reject) => {
      this.client.GetItemMetadataBatch(
        request,
        {interceptors: this.interceptors},
        (err, resp) => {
          if (resp) {
            resolve(
              new VectorGetItemMetadataBatch.Success(
                resp.item_metadata_response.reduce((acc, itemResponse) => {
                  switch (itemResponse.response) {
                    case 'hit':
                      acc[itemResponse.hit.id] =
                        VectorIndexDataClient.deserializeMetadata(
                          itemResponse.hit.metadata,
                          () =>
                            resolve(
                              new VectorGetItemMetadataBatch.Error(
                                new UnknownError(
                                  'GetItemMetadataBatch responded with an unknown result'
                                )
                              )
                            )
                        );
                      break;
                    case 'miss':
                      break;
                    default:
                      resolve(
                        new VectorGetItemMetadataBatch.Error(
                          new UnknownError(
                            'GetItemMetadataBatch responded with an unknown result'
                          )
                        )
                      );
                      break;
                  }
                  return acc;
                }, {} as Record<string, VectorIndexMetadata>)
              )
            );
          } else {
            this.cacheServiceErrorMapper.handleError(
              err,
              e => new VectorGetItemMetadataBatch.Error(e),
              resolve,
              reject
            );
          }
        }
      );
    });
  }

  private validateRequestTimeout(timeout?: number) {
    this.logger.debug(`Request timeout ms: ${String(timeout)}`);
    if (timeout !== undefined && timeout <= 0) {
      throw new InvalidArgumentError(
        'request timeout must be greater than zero.'
      );
    }
  }

  private initializeInterceptors(
    _loggerFactory: MomentoLoggerFactory
  ): Interceptor[] {
    const headers = [
      new Header('Authorization', this.credentialProvider.getAuthToken()),
      new Header('Agent', `nodejs:${version}`),
    ];
    return [
      new HeaderInterceptorProvider(headers).createHeadersInterceptor(),
      ClientTimeoutInterceptor(this.requestTimeoutMs),
    ];
  }
}
