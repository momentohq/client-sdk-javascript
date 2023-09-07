import {VectorIndexClient} from '@gomomento/generated-types-webtext/dist/VectorindexServiceClientPb';
import * as vectorindex from '@gomomento/generated-types-webtext/dist/vectorindex_pb';
import {IVectorIndexDataClient} from '@gomomento/sdk-core/dist/src/internal/clients/vector/IVectorIndexDataClient';
import {VectorIndexItem} from '@gomomento/sdk-core/dist/src/messages/vector-index';
import {
  MomentoLogger,
  SearchOptions,
  VectorAddItemBatch,
  VectorDeleteItemBatch,
  VectorSearch,
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

  public async addItemBatch(
    indexName: string,
    items: Array<VectorIndexItem>
  ): Promise<VectorAddItemBatch.Response> {
    try {
      validateIndexName(indexName);
    } catch (err) {
      return new VectorAddItemBatch.Error(normalizeSdkError(err as Error));
    }
    return await this.sendAddItemBatch(indexName, items);
  }

  private async sendAddItemBatch(
    indexName: string,
    items: Array<VectorIndexItem>
  ): Promise<VectorAddItemBatch.Response> {
    const request = new vectorindex._AddItemBatchRequest();
    request.setIndexName(indexName);
    request.setItemsList(
      items.map(vectorIndexItem => {
        const item = new vectorindex._Item();
        item.setId(vectorIndexItem.id);
        const vector = new vectorindex._Vector();
        vector.setElementsList(vectorIndexItem.vector);
        item.setVector(vector);

        item.setMetadataList(
          vectorIndexItem.metadata === undefined
            ? []
            : Object.entries(vectorIndexItem.metadata).map(([key, value]) => {
                const metadata = new vectorindex._Metadata();
                metadata.setField(key);
                metadata.setStringValue(value);
                return metadata;
              })
        );
        return item;
      })
    );

    return await new Promise(resolve => {
      this.client.addItemBatch(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...this.createVectorCallMetadata(this.deadlineMillis),
        },
        (err, resp) => {
          if (resp) {
            resolve(new VectorAddItemBatch.Success());
          } else {
            resolve(new VectorAddItemBatch.Error(cacheServiceErrorMapper(err)));
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
    const some = new vectorindex._MetadataRequest.Some();
    some.setFieldsList(
      options?.metadataFields === undefined ? [] : options.metadataFields
    );
    metadataRequest.setSome(some);
    request.setMetadataFields(metadataRequest);

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
                  distance: hit.getDistance(),
                  metadata: hit.getMetadataList().reduce((acc, metadata) => {
                    acc[metadata.getField()] = metadata.getStringValue();
                    return acc;
                  }, {} as Record<string, string>),
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

  private createVectorCallMetadata(timeoutMillis: number): {deadline: string} {
    const deadline = Date.now() + timeoutMillis;
    return {deadline: deadline.toString()};
  }
}
