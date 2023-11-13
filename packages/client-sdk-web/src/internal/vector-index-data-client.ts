import {VectorIndexClient} from '@gomomento/generated-types-webtext/dist/VectorindexServiceClientPb';
import * as vectorindex from '@gomomento/generated-types-webtext/dist/vectorindex_pb';
import {IVectorIndexDataClient} from '@gomomento/sdk-core/dist/src/internal/clients/vector/IVectorIndexDataClient';
import {VectorIndexItem} from '@gomomento/sdk-core/dist/src/messages/vector-index';
import {
  MomentoLogger,
  SearchOptions,
  VectorDeleteItemBatch,
  VectorSearch,
  VectorSearchAndFetchVectors,
  VectorUpsertItemBatch,
  InvalidArgumentError,
  UnknownError,
} from '@gomomento/sdk-core';
import {VectorIndexClientProps} from '../vector-index-client-props';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
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
  private readonly clientMetadataProvider: ClientMetadataProvider;
  private readonly deadlineMillis: number;

  constructor(props: VectorIndexClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
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
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          metadata.setIntegerValue(value);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          metadata.setDoubleValue(value);
        }
      } else if (typeof value === 'boolean') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        metadata.setBooleanValue(value);
      } else if (
        Array.isArray(value) &&
        value.every(item => typeof item === 'string')
      ) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
        const listOfStrings = new vectorindex._Metadata._ListOfStrings();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        listOfStrings.setValuesList(value);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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
    return await new Promise(resolve => {
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
            resolve(
              new VectorUpsertItemBatch.Error(cacheServiceErrorMapper(err))
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

    return await new Promise(resolve => {
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
            resolve(
              new VectorDeleteItemBatch.Error(cacheServiceErrorMapper(err))
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
    request.setMetadataFields(metadataRequest);

    if (options?.scoreThreshold !== undefined) {
      request.setScoreThreshold(options.scoreThreshold);
    } else {
      request.setNoScoreThreshold(new vectorindex._NoScoreThreshold());
    }

    return await new Promise(resolve => {
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
                  metadata: hit.getMetadataList().reduce((acc, metadata) => {
                    const field = metadata.getField();
                    switch (metadata.getValueCase()) {
                      case vectorindex._Metadata.ValueCase.STRING_VALUE:
                        acc[field] = metadata.getStringValue();
                        break;
                      case vectorindex._Metadata.ValueCase.INTEGER_VALUE:
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
                        acc[field] = metadata.getIntegerValue();
                        break;
                      case vectorindex._Metadata.ValueCase.DOUBLE_VALUE:
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
                        acc[field] = metadata.getDoubleValue();
                        break;
                      case vectorindex._Metadata.ValueCase.BOOLEAN_VALUE:
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
                        acc[field] = metadata.getBooleanValue();
                        break;
                      case vectorindex._Metadata.ValueCase
                        .LIST_OF_STRINGS_VALUE:
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
                        acc[field] =
                          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                          metadata.getListOfStringsValue()?.getValuesList() ??
                          [];
                        break;
                      default:
                        resolve(
                          new VectorSearch.Error(
                            new UnknownError(
                              'Search responded with an unknown result'
                            )
                          )
                        );
                        break;
                    }
                    return acc;
                  }, {} as Record<string, string | number | boolean | Array<string>>),
                }))
              )
            );
          } else {
            resolve(new VectorSearch.Error(cacheServiceErrorMapper(err)));
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

  private sendSearchAndFetchVectors(
    indexName: string,
    queryVector: Array<number>,
    options?: SearchOptions
  ): Promise<VectorSearchAndFetchVectors.Response> {
    throw new Error('Method not implemented.');
  }

  private createVectorCallMetadata(timeoutMillis: number): {deadline: string} {
    const deadline = Date.now() + timeoutMillis;
    return {deadline: deadline.toString()};
  }
}
