import {version} from '../../package.json';
import {IVectorIndexDataClient} from '@gomomento/sdk-core/dist/src/internal/clients/vector/IVectorIndexDataClient';
import {VectorIndexItem} from '@gomomento/sdk-core/dist/src/messages/vector-index';
import {
  CredentialProvider,
  InvalidArgumentError,
  MomentoLogger,
  MomentoLoggerFactory,
  SearchOptions,
  VectorDeleteItemBatch,
  VectorSearch,
  VectorUpsertItemBatch,
} from '@gomomento/sdk-core';
import {VectorIndexClientProps} from '../vector-index-client-props';
import {VectorIndexConfiguration} from '../config/vector-index-configuration';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {vectorindex} from '@gomomento/generated-types/dist/vectorindex';
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  validateIndexName,
  validateTopK,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {normalizeSdkError} from '@gomomento/sdk-core/dist/src/errors';
import {ALL_VECTOR_METADATA} from '@gomomento/sdk-core/dist/src/clients/IVectorIndexClient';

export class VectorIndexDataClient implements IVectorIndexDataClient {
  private readonly configuration: VectorIndexConfiguration;
  private readonly credentialProvider: CredentialProvider;
  private readonly logger: MomentoLogger;
  private readonly requestTimeoutMs: number;
  private readonly client: vectorindex.VectorIndexClient;
  private readonly interceptors: Interceptor[];

  constructor(props: VectorIndexClientProps) {
    this.configuration = props.configuration;
    this.credentialProvider = props.credentialProvider;
    this.logger = this.configuration.getLoggerFactory().getLogger(this);
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
    try {
      validateIndexName(indexName);
    } catch (err) {
      return new VectorUpsertItemBatch.Error(normalizeSdkError(err as Error));
    }
    return await this.sendUpsertItemBatch(indexName, items);
  }

  private async sendUpsertItemBatch(
    indexName: string,
    items: Array<VectorIndexItem>
  ): Promise<VectorUpsertItemBatch.Response> {
    // integration test covering replacing a vector, metadata
    const request = new vectorindex._UpsertItemBatchRequest({
      index_name: indexName,
      items: items.map(item => {
        return new vectorindex._Item({
          id: item.id,
          vector: new vectorindex._Vector({elements: item.vector}),
          metadata:
            item.metadata === undefined
              ? []
              : Object.entries(item.metadata).map(
                  ([key, value]) =>
                    new vectorindex._Metadata({
                      field: key,
                      string_value: value,
                    })
                ),
        });
      }),
    });
    return await new Promise(resolve => {
      this.client.UpsertItemBatch(
        request,
        {interceptors: this.interceptors},
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
    const request = new vectorindex._DeleteItemBatchRequest({
      index_name: indexName,
      ids: ids,
    });
    return await new Promise(resolve => {
      this.client.DeleteItemBatch(
        request,
        {interceptors: this.interceptors},
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
    const metadataRequest = new vectorindex._MetadataRequest();
    if (options?.metadataFields === ALL_VECTOR_METADATA) {
      metadataRequest.all = new vectorindex._MetadataRequest.All();
    } else {
      metadataRequest.some = new vectorindex._MetadataRequest.Some({
        fields:
          options?.metadataFields === undefined ? [] : options.metadataFields,
      });
    }

    const request = new vectorindex._SearchRequest({
      index_name: indexName,
      query_vector: new vectorindex._Vector({elements: queryVector}),
      top_k: options?.topK,
      metadata_fields: metadataRequest,
    });

    return await new Promise(resolve => {
      this.client.Search(
        request,
        {interceptors: this.interceptors},
        (err, resp) => {
          if (resp) {
            resolve(
              new VectorSearch.Success(
                resp.hits.map(hit => ({
                  id: hit.id,
                  distance: hit.distance,
                  metadata: hit.metadata.reduce((acc, metadata) => {
                    acc[metadata.field] = metadata.string_value;
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

  private validateRequestTimeout(timeout?: number) {
    this.logger.debug(`Request timeout ms: ${String(timeout)}`);
    if (timeout !== undefined && timeout <= 0) {
      throw new InvalidArgumentError(
        'request timeout must be greater than zero.'
      );
    }
  }

  private initializeInterceptors(
    loggerFactory: MomentoLoggerFactory
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
