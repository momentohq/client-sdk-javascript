import {VectorIndexClient} from '@gomomento/generated-types-webtext/dist/VectorindexServiceClientPb';
import * as vectorindex from '@gomomento/generated-types-webtext/dist/vectorindex_pb';
import {IVectorIndexDataClient} from '@gomomento/sdk-core/dist/src/internal/clients/vector/IVectorIndexDataClient';
import {
  ALL_VECTOR_METADATA,
  InvalidArgumentError,
  MomentoLogger,
  SearchOptions,
  UnknownError,
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
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  validateIndexName,
  validateTopK,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {ClientMetadataProvider} from './client-metadata-provider';
import {getWebVectorEndpoint} from '../utils/web-client-utils';
import {VectorIndexClientPropsWithConfig} from './vector-index-client-props-with-config';

export class VectorIndexDataClient implements IVectorIndexDataClient {
  private readonly client: VectorIndexClient;
  private readonly logger: MomentoLogger;
  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;
  private readonly clientMetadataProvider: ClientMetadataProvider;
  private readonly deadlineMillis: number;

  constructor(props: VectorIndexClientPropsWithConfig) {
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
    const request = new vectorindex._CountItemsRequest();
    request.setIndexName(indexName);
    request.setAll(new vectorindex._CountItemsRequest.All());

    return await new Promise((resolve, reject) => {
      this.client.countItems(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...this.createVectorCallMetadata(this.deadlineMillis),
        },
        (err, resp) => {
          if (resp) {
            resolve(new VectorCountItems.Success(resp.getItemCount()));
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
    ids: Array<string>
  ): Promise<VectorDeleteItemBatch.Response> {
    try {
      validateIndexName(indexName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new VectorDeleteItemBatch.Error(err)
      );
    }
    return await this.sendDeleteItemBatch(indexName, ids);
  }

  private async sendDeleteItemBatch(
    indexName: string,
    ids: Array<string>
  ): Promise<VectorDeleteItemBatch.Response> {
    const request = new vectorindex._DeleteItemBatchRequest();
    request.setIndexName(indexName);
    request.setFilter(VectorIndexDataClient.idsToFilterExpression(ids));

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

  private static buildFilterExpression(
    filterExpression?: F.VectorFilterExpression
  ): vectorindex._FilterExpression | undefined {
    if (filterExpression === undefined) {
      return undefined;
    }

    if (filterExpression instanceof F.VectorFilterAndExpression) {
      const and = new vectorindex._AndExpression();
      and.setFirstExpression(
        VectorIndexDataClient.buildFilterExpression(
          filterExpression.FirstExpression
        )
      );
      and.setSecondExpression(
        VectorIndexDataClient.buildFilterExpression(
          filterExpression.SecondExpression
        )
      );
      const expression = new vectorindex._FilterExpression();
      expression.setAndExpression(and);
      return expression;
    } else if (filterExpression instanceof F.VectorFilterOrExpression) {
      const or = new vectorindex._OrExpression();
      or.setFirstExpression(
        VectorIndexDataClient.buildFilterExpression(
          filterExpression.FirstExpression
        )
      );
      or.setSecondExpression(
        VectorIndexDataClient.buildFilterExpression(
          filterExpression.SecondExpression
        )
      );
      const expression = new vectorindex._FilterExpression();
      expression.setOrExpression(or);
      return expression;
    } else if (filterExpression instanceof F.VectorFilterNotExpression) {
      const not = new vectorindex._NotExpression();
      not.setExpressionToNegate(
        VectorIndexDataClient.buildFilterExpression(filterExpression.Expression)
      );
      const expression = new vectorindex._FilterExpression();
      expression.setNotExpression(not);
      return expression;
    } else if (filterExpression instanceof F.VectorFilterEqualsExpression) {
      const equals = new vectorindex._EqualsExpression();
      equals.setField(filterExpression.Field);

      if (typeof filterExpression.Value === 'string') {
        equals.setStringValue(filterExpression.Value);
      } else if (typeof filterExpression.Value === 'number') {
        if (Number.isInteger(filterExpression.Value)) {
          equals.setIntegerValue(filterExpression.Value);
        } else {
          equals.setFloatValue(filterExpression.Value);
        }
      } else if (typeof filterExpression.Value === 'boolean') {
        equals.setBooleanValue(filterExpression.Value);
      } else {
        throw new InvalidArgumentError(
          `Filter value for field '${
            filterExpression.Field
          }' is not a valid type. Value is of type '${typeof filterExpression.Value} and is not a string, number, or boolean.'`
        );
      }

      const expression = new vectorindex._FilterExpression();
      expression.setEqualsExpression(equals);
      return expression;
    } else if (
      filterExpression instanceof F.VectorFilterGreaterThanExpression
    ) {
      const greaterThan = new vectorindex._GreaterThanExpression();
      greaterThan.setField(filterExpression.Field);

      if (typeof filterExpression.Value === 'number') {
        if (Number.isInteger(filterExpression.Value)) {
          greaterThan.setIntegerValue(filterExpression.Value);
        } else {
          greaterThan.setFloatValue(filterExpression.Value);
        }
      } else {
        throw new InvalidArgumentError(
          `Filter value for field '${
            filterExpression.Field
          }' is not a valid type. Value is of type '${typeof filterExpression.Value} and is not a number.'`
        );
      }

      const expression = new vectorindex._FilterExpression();
      expression.setGreaterThanExpression(greaterThan);
      return expression;
    } else if (
      filterExpression instanceof F.VectorFilterGreaterThanOrEqualExpression
    ) {
      const greaterThanOrEqual =
        new vectorindex._GreaterThanOrEqualExpression();
      greaterThanOrEqual.setField(filterExpression.Field);

      if (typeof filterExpression.Value === 'number') {
        if (Number.isInteger(filterExpression.Value)) {
          greaterThanOrEqual.setIntegerValue(filterExpression.Value);
        } else {
          greaterThanOrEqual.setFloatValue(filterExpression.Value);
        }
      } else {
        throw new InvalidArgumentError(
          `Filter value for field '${
            filterExpression.Field
          }' is not a valid type. Value is of type '${typeof filterExpression.Value} and is not a number.'`
        );
      }

      const expression = new vectorindex._FilterExpression();
      expression.setGreaterThanOrEqualExpression(greaterThanOrEqual);
      return expression;
    } else if (filterExpression instanceof F.VectorFilterLessThanExpression) {
      const lessThan = new vectorindex._LessThanExpression();
      lessThan.setField(filterExpression.Field);

      if (typeof filterExpression.Value === 'number') {
        if (Number.isInteger(filterExpression.Value)) {
          lessThan.setIntegerValue(filterExpression.Value);
        } else {
          lessThan.setFloatValue(filterExpression.Value);
        }
      } else {
        throw new InvalidArgumentError(
          `Filter value for field '${
            filterExpression.Field
          }' is not a valid type. Value is of type '${typeof filterExpression.Value} and is not a number.'`
        );
      }

      const expression = new vectorindex._FilterExpression();
      expression.setLessThanExpression(lessThan);
      return expression;
    } else if (
      filterExpression instanceof F.VectorFilterLessThanOrEqualExpression
    ) {
      const lessThanOrEqual = new vectorindex._LessThanOrEqualExpression();
      lessThanOrEqual.setField(filterExpression.Field);

      if (typeof filterExpression.Value === 'number') {
        if (Number.isInteger(filterExpression.Value)) {
          lessThanOrEqual.setIntegerValue(filterExpression.Value);
        } else {
          lessThanOrEqual.setFloatValue(filterExpression.Value);
        }
      } else {
        throw new InvalidArgumentError(
          `Filter value for field '${
            filterExpression.Field
          }' is not a valid type. Value is of type '${typeof filterExpression.Value} and is not a number.'`
        );
      }

      const expression = new vectorindex._FilterExpression();
      expression.setLessThanOrEqualExpression(lessThanOrEqual);
      return expression;
    } else if (
      filterExpression instanceof F.VectorFilterListContainsExpression
    ) {
      const listContains = new vectorindex._ListContainsExpression();
      listContains.setField(filterExpression.Field);

      if (typeof filterExpression.Value === 'string') {
        listContains.setStringValue(filterExpression.Value);
      } else {
        throw new InvalidArgumentError(
          `Filter value for field '${
            filterExpression.Field
          }' is not a valid type. Value is of type '${typeof filterExpression.Value} and is not a string or number.'`
        );
      }

      const expression = new vectorindex._FilterExpression();
      expression.setListContainsExpression(listContains);
      return expression;
    } else if (filterExpression instanceof F.VectorFilterIdInSetExpression) {
      const idInSet = new vectorindex._IdInSetExpression();
      idInSet.setIdsList(filterExpression.Ids);

      const expression = new vectorindex._FilterExpression();
      expression.setIdInSetExpression(idInSet);
      return expression;
    }

    throw new InvalidArgumentError('Filter expression is not a valid type.');
  }

  /**
   * Converts a list of ids to a filter expression that matches the ids.
   * @param ids
   * @private
   */
  private static idsToFilterExpression(
    ids: string[]
  ): vectorindex._FilterExpression {
    const idInSet = new vectorindex._IdInSetExpression();
    idInSet.setIdsList(ids);

    const expression = new vectorindex._FilterExpression();
    expression.setIdInSetExpression(idInSet);
    return expression;
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
    request.setTopK(options?.topK ?? VECTOR_DEFAULT_TOPK);
    request.setMetadataFields(
      VectorIndexDataClient.buildMetadataRequest(options)
    );
    VectorIndexDataClient.applyScoreThreshold(request, options);
    request.setFilter(
      VectorIndexDataClient.buildFilterExpression(options?.filter)
    );

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
    const request = new vectorindex._SearchAndFetchVectorsRequest();
    request.setIndexName(indexName);
    const vector = new vectorindex._Vector();
    vector.setElementsList(queryVector);
    request.setQueryVector(vector);
    request.setTopK(options?.topK ?? VECTOR_DEFAULT_TOPK);
    request.setMetadataFields(
      VectorIndexDataClient.buildMetadataRequest(options)
    );
    VectorIndexDataClient.applyScoreThreshold(request, options);
    request.setFilter(
      VectorIndexDataClient.buildFilterExpression(options?.filter)
    );

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
    ids: string[]
  ): Promise<VectorGetItemBatch.Response> {
    try {
      validateIndexName(indexName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new VectorGetItemBatch.Error(err)
      );
    }
    return await this.sendGetItemBatch(indexName, ids);
  }

  private async sendGetItemBatch(
    indexName: string,
    ids: string[]
  ): Promise<VectorGetItemBatch.Response> {
    const request = new vectorindex._GetItemBatchRequest();
    request.setIndexName(indexName);
    request.setFilter(VectorIndexDataClient.idsToFilterExpression(ids));
    request.setMetadataFields(
      VectorIndexDataClient.buildMetadataRequest({
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
    ids: string[]
  ): Promise<VectorGetItemMetadataBatch.Response> {
    try {
      validateIndexName(indexName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new VectorGetItemMetadataBatch.Error(err)
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
    request.setFilter(VectorIndexDataClient.idsToFilterExpression(ids));
    request.setMetadataFields(
      VectorIndexDataClient.buildMetadataRequest({
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

  private createVectorCallMetadata(timeoutMillis: number): {deadline: string} {
    const deadline = Date.now() + timeoutMillis;
    return {deadline: deadline.toString()};
  }
}
