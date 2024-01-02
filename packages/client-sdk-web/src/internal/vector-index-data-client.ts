import {VectorIndexClient} from '@gomomento/generated-types-webtext/dist/VectorindexServiceClientPb';
import * as vectorindex from '@gomomento/generated-types-webtext/dist/vectorindex_pb';
import {IVectorIndexDataClient} from '@gomomento/sdk-core/dist/src/internal/clients/vector/IVectorIndexDataClient';
import {
  MomentoLogger,
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
  InvalidArgumentError,
  UnknownError,
} from '@gomomento/sdk-core';
import {VectorIndexClientProps} from '../vector-index-client-props';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  validateIndexName,
  validateTopK,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {normalizeSdkError} from '@gomomento/sdk-core/dist/src/errors';
import {ClientMetadataProvider} from './client-metadata-provider';
import {getWebVectorEndpoint} from '../utils/web-client-utils';
import {ALL_VECTOR_METADATA} from '@gomomento/sdk-core/dist/src/clients/IVectorIndexClient';

export class VectorIndexDataClient implements IVectorIndexDataClient {
  private readonly client: VectorIndexClient;
  private readonly logger: MomentoLogger;
  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;
  private readonly clientMetadataProvider: ClientMetadataProvider;
  private readonly deadlineMillis: number;

  constructor(props: VectorIndexClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.cacheServiceErrorMapper = new CacheServiceErrorMapper(
      props.configuration.getThrowOnErrors()
    );
    const vectorEndpoint = getWebVectorEndpoint(props.credentialProvider);
    this.logger.debug(
      `Creating data client using endpoint: '${vectorEndpoint}`
    );

    this.deadlineMillis = props.configuration
      .getTransportStrategy()
      .getGrpcConfig()
      .getDeadlineMillis();
    this.clientMetadataProvider = new ClientMetadataProvider({
      authToken: props.credentialProvider.getAuthToken(),
    });
    this.client = new VectorIndexClient(vectorEndpoint, null, {});
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
    return await this.sendUpsertItemBatch(request);
  }

  private static buildUpsertItemBatchRequest(
    indexName: string,
    items: Array<VectorIndexItem>
  ): vectorindex._UpsertItemBatchRequest {
    const request = new vectorindex._UpsertItemBatchRequest();
    request.setIndexName(indexName);
    request.setItemsList(
      items.map(vectorIndexItem => {
        const item = new vectorindex._Item();
        item.setId(vectorIndexItem.id);
        const vector = new vectorindex._Vector();
        vector.setElementsList(vectorIndexItem.vector);
        item.setVector(vector);

        item.setMetadataList(
          VectorIndexDataClient.convertItemMetadataToProtobufMetadata(
            vectorIndexItem
          )
        );
        return item;
      })
    );
    return request;
  }

  private static convertItemMetadataToProtobufMetadata(
    item: VectorIndexItem
  ): vectorindex._Metadata[] {
    if (item.metadata === undefined) {
      return [];
    }
    return Object.entries(item.metadata).map(([key, value]) => {
      const metadata = new vectorindex._Metadata();
      metadata.setField(key);
      if (typeof value === 'string') {
        metadata.setStringValue(value);
      } else if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          metadata.setIntegerValue(value);
        } else {
          metadata.setDoubleValue(value);
        }
      } else if (typeof value === 'boolean') {
        metadata.setBooleanValue(value);
      } else if (
        Array.isArray(value) &&
        value.every(item => typeof item === 'string')
      ) {
        const listOfStrings = new vectorindex._Metadata._ListOfStrings();
        listOfStrings.setValuesList(value);
        metadata.setListOfStringsValue(listOfStrings);
      } else {
        throw new InvalidArgumentError(
          `Metadata value for field '${key}' is not a valid type. Value is of type '${typeof value} and is not a string, number, boolean, or array of strings.'`
        );
      }
      return metadata;
    });
  }

  private async sendUpsertItemBatch(
    request: vectorindex._UpsertItemBatchRequest
  ): Promise<VectorUpsertItemBatch.Response> {
    return await new Promise((resolve, reject) => {
      this.client.upsertItemBatch(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...this.createVectorCallMetadata(this.deadlineMillis),
        },
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
    const request = new vectorindex._DeleteItemBatchRequest();
    request.setIndexName(indexName);
    request.setIdsList(ids);

    return await new Promise((resolve, reject) => {
      this.client.deleteItemBatch(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...this.createVectorCallMetadata(this.deadlineMillis),
        },
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
      const all = new vectorindex._MetadataRequest.All();
      metadataRequest.setAll(all);
    } else {
      const some = new vectorindex._MetadataRequest.Some();
      some.setFieldsList(
        options?.metadataFields === undefined ? [] : options.metadataFields
      );
      metadataRequest.setSome(some);
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
      request.setScoreThreshold(options.scoreThreshold);
    } else {
      request.setNoScoreThreshold(new vectorindex._NoScoreThreshold());
    }
  }

  private static deserializeMetadata(
    metadata: vectorindex._Metadata[],
    errorCallback: () => void
  ): VectorIndexMetadata {
    return metadata.reduce((acc, metadata) => {
      const field = metadata.getField();
      switch (metadata.getValueCase()) {
        case vectorindex._Metadata.ValueCase.STRING_VALUE:
          acc[field] = metadata.getStringValue();
          break;
        case vectorindex._Metadata.ValueCase.INTEGER_VALUE:
          acc[field] = metadata.getIntegerValue();
          break;
        case vectorindex._Metadata.ValueCase.DOUBLE_VALUE:
          acc[field] = metadata.getDoubleValue();
          break;
        case vectorindex._Metadata.ValueCase.BOOLEAN_VALUE:
          acc[field] = metadata.getBooleanValue();
          break;
        case vectorindex._Metadata.ValueCase.LIST_OF_STRINGS_VALUE:
          acc[field] = metadata.getListOfStringsValue()?.getValuesList() ?? [];
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
    const request = new vectorindex._SearchRequest();
    request.setIndexName(indexName);
    const vector = new vectorindex._Vector();
    vector.setElementsList(queryVector);
    request.setQueryVector(vector);
    if (options?.topK !== undefined) {
      request.setTopK(options.topK);
    }
    request.setMetadataFields(
      VectorIndexDataClient.prepareMetadataRequest(options)
    );
    VectorIndexDataClient.applyScoreThreshold(request, options);

    return await new Promise((resolve, reject) => {
      this.client.search(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...this.createVectorCallMetadata(this.deadlineMillis),
        },
        (err, resp) => {
          if (resp) {
            resolve(
              new VectorSearch.Success(
                resp.getHitsList().map(hit => ({
                  id: hit.getId(),
                  score: hit.getScore(),
                  metadata: VectorIndexDataClient.deserializeMetadata(
                    hit.getMetadataList(),
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
    const request = new vectorindex._SearchAndFetchVectorsRequest();
    request.setIndexName(indexName);
    const vector = new vectorindex._Vector();
    vector.setElementsList(queryVector);
    request.setQueryVector(vector);
    if (options?.topK !== undefined) {
      request.setTopK(options.topK);
    }
    request.setMetadataFields(
      VectorIndexDataClient.prepareMetadataRequest(options)
    );
    VectorIndexDataClient.applyScoreThreshold(request, options);

    return await new Promise((resolve, reject) => {
      this.client.searchAndFetchVectors(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...this.createVectorCallMetadata(this.deadlineMillis),
        },
        (err, resp) => {
          if (resp) {
            resolve(
              new VectorSearchAndFetchVectors.Success(
                resp.getHitsList().map(hit => ({
                  id: hit.getId(),
                  score: hit.getScore(),
                  vector: hit.getVector()?.getElementsList() ?? [],
                  metadata: VectorIndexDataClient.deserializeMetadata(
                    hit.getMetadataList(),
                    () =>
                      resolve(
                        new VectorSearchAndFetchVectors.Error(
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
    const request = new vectorindex._GetItemBatchRequest();
    request.setIndexName(indexName);
    request.setIdsList(ids);
    request.setMetadataFields(
      VectorIndexDataClient.prepareMetadataRequest({
        metadataFields: ALL_VECTOR_METADATA,
      })
    );

    return await new Promise((resolve, reject) => {
      this.client.getItemBatch(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...this.createVectorCallMetadata(this.deadlineMillis),
        },
        (err, resp) => {
          if (resp) {
            resolve(
              new VectorGetItemBatch.Success(
                resp.getItemResponseList().reduce((acc, itemResponse) => {
                  let hit: vectorindex._ItemResponse._Hit | undefined;
                  switch (itemResponse.getResponseCase()) {
                    case vectorindex._ItemResponse.ResponseCase.HIT:
                      hit = itemResponse.getHit();
                      acc[hit?.getId() ?? ''] = {
                        id: hit?.getId() ?? '',
                        vector: hit?.getVector()?.getElementsList() ?? [],
                        metadata: VectorIndexDataClient.deserializeMetadata(
                          hit?.getMetadataList() ?? [],
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
                    case vectorindex._ItemResponse.ResponseCase.MISS:
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
    const request = new vectorindex._GetItemMetadataBatchRequest();
    request.setIndexName(indexName);
    request.setIdsList(ids);
    request.setMetadataFields(
      VectorIndexDataClient.prepareMetadataRequest({
        metadataFields: ALL_VECTOR_METADATA,
      })
    );

    return await new Promise((resolve, reject) => {
      this.client.getItemMetadataBatch(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...this.createVectorCallMetadata(this.deadlineMillis),
        },
        (err, resp) => {
          if (resp) {
            resolve(
              new VectorGetItemMetadataBatch.Success(
                resp
                  .getItemMetadataResponseList()
                  .reduce((acc, itemResponse) => {
                    let hit: vectorindex._ItemMetadataResponse._Hit | undefined;
                    switch (itemResponse.getResponseCase()) {
                      case vectorindex._ItemMetadataResponse.ResponseCase.HIT:
                        hit = itemResponse.getHit();
                        acc[hit?.getId() ?? ''] =
                          VectorIndexDataClient.deserializeMetadata(
                            hit?.getMetadataList() ?? [],
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
                      case vectorindex._ItemResponse.ResponseCase.MISS:
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

  private createVectorCallMetadata(timeoutMillis: number): {deadline: string} {
    const deadline = Date.now() + timeoutMillis;
    return {deadline: deadline.toString()};
  }
}
