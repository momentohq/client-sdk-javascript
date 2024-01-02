import {control} from '@gomomento/generated-types';
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {Status} from '@grpc/grpc-js/build/src/constants';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {
  CredentialProvider,
  InvalidArgumentError,
  MomentoLogger,
  VectorIndexConfiguration,
  VectorIndexInfo,
} from '..';
import {version} from '../../package.json';
import {IdleGrpcClientWrapper} from './grpc/idle-grpc-client-wrapper';
import {GrpcClientWrapper} from './grpc/grpc-client-wrapper';
import {
  validateIndexName,
  validateNumDimensions,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {
  normalizeSdkError,
  UnknownError,
} from '@gomomento/sdk-core/dist/src/errors';
import {
  CreateVectorIndex,
  DeleteVectorIndex,
  ListVectorIndexes,
} from '@gomomento/sdk-core';
import {
  IVectorIndexControlClient,
  VectorSimilarityMetric,
} from '@gomomento/sdk-core/dist/src/internal/clients';
import grpcControl = control.control_client;

export interface ControlClientProps {
  configuration: VectorIndexConfiguration;
  credentialProvider: CredentialProvider;
}

export class VectorIndexControlClient implements IVectorIndexControlClient {
  private readonly clientWrapper: GrpcClientWrapper<grpcControl.ScsControlClient>;
  private readonly interceptors: Interceptor[];
  private static readonly REQUEST_TIMEOUT_MS: number = 60 * 1000;
  private readonly logger: MomentoLogger;
  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;

  /**
   * @param {ControlClientProps} props
   */
  constructor(props: ControlClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.cacheServiceErrorMapper = new CacheServiceErrorMapper(
      props.configuration.getThrowOnErrors()
    );
    const headers = [
      new Header('Authorization', props.credentialProvider.getAuthToken()),
      new Header('Agent', `nodejs:${version}`),
    ];
    this.interceptors = [
      new HeaderInterceptorProvider(headers).createHeadersInterceptor(),
      ClientTimeoutInterceptor(VectorIndexControlClient.REQUEST_TIMEOUT_MS),
    ];
    this.logger.debug(
      `Creating control client using endpoint: '${props.credentialProvider.getControlEndpoint()}`
    );
    this.clientWrapper = new IdleGrpcClientWrapper({
      clientFactoryFn: () =>
        new grpcControl.ScsControlClient(
          props.credentialProvider.getControlEndpoint(),
          ChannelCredentials.createSsl()
        ),
      loggerFactory: props.configuration.getLoggerFactory(),
      maxIdleMillis: props.configuration
        .getTransportStrategy()
        .getMaxIdleMillis(),
    });
  }

  public async createIndex(
    indexName: string,
    numDimensions: number,
    similarityMetric?: VectorSimilarityMetric
  ): Promise<CreateVectorIndex.Response> {
    try {
      validateIndexName(indexName);
      validateNumDimensions(numDimensions);
    } catch (err) {
      return new CreateVectorIndex.Error(normalizeSdkError(err as Error));
    }
    this.logger.debug("Issuing 'createIndex' request");
    const request = new grpcControl._CreateIndexRequest();
    request.index_name = indexName;
    request.num_dimensions = numDimensions;

    similarityMetric ??= VectorSimilarityMetric.COSINE_SIMILARITY;

    const similarityMetricPb = new grpcControl._SimilarityMetric();
    switch (similarityMetric) {
      case VectorSimilarityMetric.INNER_PRODUCT:
        similarityMetricPb.inner_product =
          new grpcControl._SimilarityMetric._InnerProduct();
        break;
      case VectorSimilarityMetric.EUCLIDEAN_SIMILARITY:
        similarityMetricPb.euclidean_similarity =
          new grpcControl._SimilarityMetric._EuclideanSimilarity();
        break;
      case VectorSimilarityMetric.COSINE_SIMILARITY:
        similarityMetricPb.cosine_similarity =
          new grpcControl._SimilarityMetric._CosineSimilarity();
        break;
      default:
        return new CreateVectorIndex.Error(
          new InvalidArgumentError(
            `Invalid similarity metric: ${
              similarityMetric as unknown as string
            }`
          )
        );
    }
    request.similarity_metric = similarityMetricPb;

    return await new Promise<CreateVectorIndex.Response>((resolve, reject) => {
      this.clientWrapper.getClient().CreateIndex(
        request,
        {interceptors: this.interceptors},
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err, resp) => {
          if (err) {
            if (err.code === Status.ALREADY_EXISTS) {
              resolve(new CreateVectorIndex.AlreadyExists());
            } else {
              this.cacheServiceErrorMapper.handleError(
                err,
                e => new CreateVectorIndex.Error(e),
                resolve,
                reject
              );
            }
          } else {
            resolve(new CreateVectorIndex.Success());
          }
        }
      );
    });
  }

  public async listIndexes(): Promise<ListVectorIndexes.Response> {
    const request = new grpcControl._ListIndexesRequest();
    this.logger.debug("Issuing 'listIndexes' request");
    return await new Promise<ListVectorIndexes.Response>((resolve, reject) => {
      this.clientWrapper
        .getClient()
        .ListIndexes(
          request,
          {interceptors: this.interceptors},
          (err, resp) => {
            if (err || !resp) {
              // TODO: `Argument of type 'unknown' is not assignable to parameter of type 'Error'.`
              //  I don't see how this is different from the other methods here. So, yeah, what?
              this.cacheServiceErrorMapper.handleError(
                err,
                e => new ListVectorIndexes.Error(e),
                resolve,
                reject
              );
            } else {
              const indexes = resp.indexes.map(index => {
                let similarityMetric: VectorSimilarityMetric =
                  VectorSimilarityMetric.COSINE_SIMILARITY;
                switch (index.similarity_metric.similarity_metric) {
                  case 'inner_product':
                    similarityMetric = VectorSimilarityMetric.INNER_PRODUCT;
                    break;
                  case 'euclidean_similarity':
                    similarityMetric =
                      VectorSimilarityMetric.EUCLIDEAN_SIMILARITY;
                    break;
                  case 'cosine_similarity':
                    similarityMetric = VectorSimilarityMetric.COSINE_SIMILARITY;
                    break;
                  default:
                    resolve(
                      new ListVectorIndexes.Error(
                        new UnknownError(
                          `Unknown similarity metric: ${index.similarity_metric.similarity_metric}`
                        )
                      )
                    );
                    break;
                }
                return new VectorIndexInfo(
                  index.index_name,
                  index.num_dimensions,
                  similarityMetric
                );
              });
              resolve(new ListVectorIndexes.Success(indexes));
            }
          }
        );
    });
  }

  public async deleteIndex(name: string): Promise<DeleteVectorIndex.Response> {
    try {
      validateIndexName(name);
    } catch (err) {
      return new DeleteVectorIndex.Error(normalizeSdkError(err as Error));
    }
    const request = new grpcControl._DeleteIndexRequest({
      index_name: name,
    });
    this.logger.info(`Deleting index: ${name}`);
    return await new Promise<DeleteVectorIndex.Response>((resolve, reject) => {
      this.clientWrapper.getClient().DeleteIndex(
        request,
        {interceptors: this.interceptors},
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err, resp) => {
          if (err) {
            this.cacheServiceErrorMapper.handleError(
              err,
              e => new DeleteVectorIndex.Error(e),
              resolve,
              reject
            );
          } else {
            resolve(new DeleteVectorIndex.Success());
          }
        }
      );
    });
  }
}
