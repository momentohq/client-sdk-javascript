import {version} from '../../package.json';
import {IVectorIndexDataClient} from '@gomomento/sdk-core/dist/src/internal/clients/vector/IVectorIndexDataClient';
import {
  ALL_VECTOR_METADATA,
  CredentialProvider,
  InvalidArgumentError,
  MomentoLogger,
  MomentoLoggerFactory,
  SearchOptions,
  VECTOR_DEFAULT_TOPK,
  VectorCountItems,
  VectorDeleteItemBatch,
  vectorFilters as F,
  VectorGetItemBatch,
  VectorGetItemMetadataBatch,
  VectorIndexItem,
  VectorIndexMetadata,
  VectorIndexStoredItem,
  VectorSearch,
  VectorSearchAndFetchVectors,
  VectorUpsertItemBatch,
} from '@gomomento/sdk-core';
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
import {UnknownError} from '@gomomento/sdk-core/dist/src/errors';
import {VectorIndexClientPropsWithConfig} from './vector-index-client-props-with-config';
import {grpcChannelOptionsFromGrpcConfig} from './grpc/grpc-channel-options';

export class VectorIndexDataClient implements IVectorIndexDataClient {
  private readonly configuration: VectorIndexConfiguration;
  private readonly credentialProvider: CredentialProvider;
  private readonly logger: MomentoLogger;
  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;
  private readonly requestTimeoutMs: number;
  private readonly client: vectorindex.VectorIndexClient;
  private readonly interceptors: Interceptor[];

  constructor(props: VectorIndexClientPropsWithConfig) {
    this.configuration = props.configuration;
    this.credentialProvider = props.credentialProvider;
    this.logger = this.configuration.getLoggerFactory().getLogger(this);
    this.cacheServiceErrorMapper = new CacheServiceErrorMapper(
      this.configuration.getThrowOnErrors()
    );
    const grpcConfig = this.configuration
      .getTransportStrategy()
      .getGrpcConfig();

    this.requestTimeoutMs = grpcConfig.getDeadlineMillis();
    this.validateRequestTimeout(this.requestTimeoutMs);
    this.logger.debug(
      `Creating vector index client using endpoint: '${this.credentialProvider.getVectorEndpoint()}'`
    );

    const channelOptions = grpcChannelOptionsFromGrpcConfig(grpcConfig);

    this.client = new vectorindex.VectorIndexClient(
      this.credentialProvider.getVectorEndpoint(),
      ChannelCredentials.createSsl(),
      channelOptions
    );

    this.interceptors = this.initializeInterceptors(
      this.configuration.getLoggerFactory()
    );
  }

  public async countItems(
    indexName: string
  ): Promise<VectorCountItems.Response> {
    try {
      validateIndexName(indexName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new VectorCountItems.Error(err)
      );
    }
    return await this.sendCountItems(indexName);
  }

  private async sendCountItems(
    indexName: string
  ): Promise<VectorCountItems.Response> {
    const request = new vectorindex._CountItemsRequest({
      index_name: indexName,
      all: new vectorindex._CountItemsRequest.All(),
    });
    return await new Promise((resolve, reject) => {
      this.client.CountItems(
        request,
        {interceptors: this.interceptors},
        (err, resp) => {
          if (resp) {
            resolve(new VectorCountItems.Success(resp.item_count));
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new VectorCountItems.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
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
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new VectorUpsertItemBatch.Error(err)
      );
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new VectorUpsertItemBatch.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async deleteItemBatch(
    indexName: string,
    filter: Array<string>
  ): Promise<VectorDeleteItemBatch.Response> {
    try {
      validateIndexName(indexName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new VectorDeleteItemBatch.Error(err)
      );
    }
    return await this.sendDeleteItemBatch(indexName, filter);
  }

  private async sendDeleteItemBatch(
    indexName: string,
    filter: Array<string>
  ): Promise<VectorDeleteItemBatch.Response> {
    const request = new vectorindex._DeleteItemBatchRequest({
      index_name: indexName,
      filter: VectorIndexDataClient.idsToFilterExpression(filter),
    });
    return await new Promise((resolve, reject) => {
      this.client.DeleteItemBatch(
        request,
        {interceptors: this.interceptors},
        (err, resp) => {
          if (resp) {
            resolve(new VectorDeleteItemBatch.Success());
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new VectorDeleteItemBatch.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new VectorSearch.Error(err)
      );
    }
    return await this.sendSearch(indexName, queryVector, options);
  }

  private static buildMetadataRequest(
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

  private static buildFilterExpression(
    filterExpression?: F.VectorFilterExpression
  ): vectorindex._FilterExpression | undefined {
    if (filterExpression === undefined) {
      return undefined;
    } else if (filterExpression instanceof F.VectorFilterAndExpression) {
      return new vectorindex._FilterExpression({
        and_expression: new vectorindex._AndExpression({
          first_expression: VectorIndexDataClient.buildFilterExpression(
            filterExpression.FirstExpression
          ),
          second_expression: VectorIndexDataClient.buildFilterExpression(
            filterExpression.SecondExpression
          ),
        }),
      });
    } else if (filterExpression instanceof F.VectorFilterOrExpression) {
      return new vectorindex._FilterExpression({
        or_expression: new vectorindex._OrExpression({
          first_expression: VectorIndexDataClient.buildFilterExpression(
            filterExpression.FirstExpression
          ),
          second_expression: VectorIndexDataClient.buildFilterExpression(
            filterExpression.SecondExpression
          ),
        }),
      });
    } else if (filterExpression instanceof F.VectorFilterNotExpression) {
      return new vectorindex._FilterExpression({
        not_expression: new vectorindex._NotExpression({
          expression_to_negate: VectorIndexDataClient.buildFilterExpression(
            filterExpression.Expression
          ),
        }),
      });
    } else if (filterExpression instanceof F.VectorFilterEqualsExpression) {
      if (typeof filterExpression.Value === 'string') {
        return new vectorindex._FilterExpression({
          equals_expression: new vectorindex._EqualsExpression({
            field: filterExpression.Field,
            string_value: filterExpression.Value,
          }),
        });
      } else if (typeof filterExpression.Value === 'number') {
        if (Number.isInteger(filterExpression.Value)) {
          return new vectorindex._FilterExpression({
            equals_expression: new vectorindex._EqualsExpression({
              field: filterExpression.Field,
              integer_value: filterExpression.Value,
            }),
          });
        } else {
          return new vectorindex._FilterExpression({
            equals_expression: new vectorindex._EqualsExpression({
              field: filterExpression.Field,
              float_value: filterExpression.Value,
            }),
          });
        }
      } else if (typeof filterExpression.Value === 'boolean') {
        return new vectorindex._FilterExpression({
          equals_expression: new vectorindex._EqualsExpression({
            field: filterExpression.Field,
            boolean_value: filterExpression.Value,
          }),
        });
      } else {
        throw new InvalidArgumentError(
          `Filter value for field '${
            filterExpression.Field
          }' is not a valid type. Value is of type '${typeof filterExpression.Value} and is not a string, number, or boolean.'`
        );
      }
    } else if (
      filterExpression instanceof F.VectorFilterGreaterThanExpression
    ) {
      if (typeof filterExpression.Value === 'number') {
        if (Number.isInteger(filterExpression.Value)) {
          return new vectorindex._FilterExpression({
            greater_than_expression: new vectorindex._GreaterThanExpression({
              field: filterExpression.Field,
              integer_value: filterExpression.Value,
            }),
          });
        } else {
          return new vectorindex._FilterExpression({
            greater_than_expression: new vectorindex._GreaterThanExpression({
              field: filterExpression.Field,
              float_value: filterExpression.Value,
            }),
          });
        }
      } else {
        throw new InvalidArgumentError(
          `Filter value for field '${
            filterExpression.Field
          }' is not a valid type. Value is of type '${typeof filterExpression.Value} and is not a number.'`
        );
      }
    } else if (
      filterExpression instanceof F.VectorFilterGreaterThanOrEqualExpression
    ) {
      if (typeof filterExpression.Value === 'number') {
        if (Number.isInteger(filterExpression.Value)) {
          return new vectorindex._FilterExpression({
            greater_than_or_equal_expression:
              new vectorindex._GreaterThanOrEqualExpression({
                field: filterExpression.Field,
                integer_value: filterExpression.Value,
              }),
          });
        } else {
          return new vectorindex._FilterExpression({
            greater_than_or_equal_expression:
              new vectorindex._GreaterThanOrEqualExpression({
                field: filterExpression.Field,
                float_value: filterExpression.Value,
              }),
          });
        }
      } else {
        throw new InvalidArgumentError(
          `Filter value for field '${
            filterExpression.Field
          }' is not a valid type. Value is of type '${typeof filterExpression.Value} and is not a number.'`
        );
      }
    } else if (filterExpression instanceof F.VectorFilterLessThanExpression) {
      if (typeof filterExpression.Value === 'number') {
        if (Number.isInteger(filterExpression.Value)) {
          return new vectorindex._FilterExpression({
            less_than_expression: new vectorindex._LessThanExpression({
              field: filterExpression.Field,
              integer_value: filterExpression.Value,
            }),
          });
        } else {
          return new vectorindex._FilterExpression({
            less_than_expression: new vectorindex._LessThanExpression({
              field: filterExpression.Field,
              float_value: filterExpression.Value,
            }),
          });
        }
      } else {
        throw new InvalidArgumentError(
          `Filter value for field '${
            filterExpression.Field
          }' is not a valid type. Value is of type '${typeof filterExpression.Value} and is not a number.'`
        );
      }
    } else if (
      filterExpression instanceof F.VectorFilterLessThanOrEqualExpression
    ) {
      if (typeof filterExpression.Value === 'number') {
        if (Number.isInteger(filterExpression.Value)) {
          return new vectorindex._FilterExpression({
            less_than_or_equal_expression:
              new vectorindex._LessThanOrEqualExpression({
                field: filterExpression.Field,
                integer_value: filterExpression.Value,
              }),
          });
        } else {
          return new vectorindex._FilterExpression({
            less_than_or_equal_expression:
              new vectorindex._LessThanOrEqualExpression({
                field: filterExpression.Field,
                float_value: filterExpression.Value,
              }),
          });
        }
      } else {
        throw new InvalidArgumentError(
          `Filter value for field '${
            filterExpression.Field
          }' is not a valid type. Value is of type '${typeof filterExpression.Value} and is not a number.'`
        );
      }
    } else if (
      filterExpression instanceof F.VectorFilterListContainsExpression
    ) {
      if (typeof filterExpression.Value === 'string') {
        return new vectorindex._FilterExpression({
          list_contains_expression: new vectorindex._ListContainsExpression({
            field: filterExpression.Field,
            string_value: filterExpression.Value,
          }),
        });
      } else {
        throw new InvalidArgumentError(
          `Filter value for field '${
            filterExpression.Field
          }' is not a valid type. Value is of type '${typeof filterExpression.Value} and is not a string.'`
        );
      }
    } else if (filterExpression instanceof F.VectorFilterIdInSetExpression) {
      return new vectorindex._FilterExpression({
        id_in_set_expression: new vectorindex._IdInSetExpression({
          ids: filterExpression.Ids,
        }),
      });
    }

    throw new InvalidArgumentError('Filter expression is not a valid type.');
  }

  /**
   * Convert a list of ids to a filter expression that matches the ids.
   * @param ids
   * @private
   */
  private static idsToFilterExpression(
    ids: string[]
  ): vectorindex._FilterExpression {
    return new vectorindex._FilterExpression({
      id_in_set_expression: new vectorindex._IdInSetExpression({
        ids: ids,
      }),
    });
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
      top_k: options?.topK ?? VECTOR_DEFAULT_TOPK,
      metadata_fields: VectorIndexDataClient.buildMetadataRequest(options),
      filter: VectorIndexDataClient.buildFilterExpression(options?.filter),
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new VectorSearch.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new VectorSearchAndFetchVectors.Error(err)
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
      top_k: options?.topK ?? VECTOR_DEFAULT_TOPK,
      metadata_fields: VectorIndexDataClient.buildMetadataRequest(options),
      filter: VectorIndexDataClient.buildFilterExpression(options?.filter),
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e =>
                new VectorSearchAndFetchVectors.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async getItemBatch(
    indexName: string,
    filter: string[]
  ): Promise<VectorGetItemBatch.Response> {
    try {
      validateIndexName(indexName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new VectorGetItemBatch.Error(err)
      );
    }
    return await this.sendGetItemBatch(indexName, filter);
  }

  private async sendGetItemBatch(
    indexName: string,
    filter: string[]
  ): Promise<VectorGetItemBatch.Response> {
    const request = new vectorindex._GetItemBatchRequest({
      index_name: indexName,
      filter: VectorIndexDataClient.idsToFilterExpression(filter),
      metadata_fields: VectorIndexDataClient.buildMetadataRequest({
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
                  acc[itemResponse.id] = {
                    id: itemResponse.id,
                    vector: itemResponse.vector.elements,
                    metadata: VectorIndexDataClient.deserializeMetadata(
                      itemResponse.metadata,
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
                  return acc;
                }, {} as Record<string, VectorIndexStoredItem>)
              )
            );
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new VectorGetItemBatch.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async getItemMetadataBatch(
    indexName: string,
    filter: string[]
  ): Promise<VectorGetItemMetadataBatch.Response> {
    try {
      validateIndexName(indexName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new VectorGetItemMetadataBatch.Error(err)
      );
    }
    return await this.sendGetItemMetadataBatch(indexName, filter);
  }

  private async sendGetItemMetadataBatch(
    indexName: string,
    filter: string[]
  ): Promise<VectorGetItemMetadataBatch.Response> {
    const request = new vectorindex._GetItemMetadataBatchRequest({
      index_name: indexName,
      filter: VectorIndexDataClient.idsToFilterExpression(filter),
      metadata_fields: VectorIndexDataClient.buildMetadataRequest({
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
                  acc[itemResponse.id] =
                    VectorIndexDataClient.deserializeMetadata(
                      itemResponse.metadata,
                      () =>
                        resolve(
                          new VectorGetItemMetadataBatch.Error(
                            new UnknownError(
                              'GetItemMetadataBatch responded with an unknown result'
                            )
                          )
                        )
                    );
                  return acc;
                }, {} as Record<string, VectorIndexMetadata>)
              )
            );
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e =>
                new VectorGetItemMetadataBatch.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
