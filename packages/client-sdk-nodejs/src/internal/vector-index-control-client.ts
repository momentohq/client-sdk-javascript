import {control} from '@gomomento/generated-types';
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {Status} from '@grpc/grpc-js/build/src/constants';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {
  CredentialProvider,
  InvalidArgumentError,
  MomentoLogger,
  VectorIndexConfiguration,
} from '..';
import {version} from '../../package.json';
import {IdleGrpcClientWrapper} from './grpc/idle-grpc-client-wrapper';
import {GrpcClientWrapper} from './grpc/grpc-client-wrapper';
import {
  validateIndexName,
  validateNumDimensions,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {normalizeSdkError} from '@gomomento/sdk-core/dist/src/errors';
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

  /**
   * @param {ControlClientProps} props
   */
  constructor(props: ControlClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
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

    switch (similarityMetric) {
      case VectorSimilarityMetric.INNER_PRODUCT:
        request.inner_product =
          new grpcControl._CreateIndexRequest._InnerProduct();
        break;
      case VectorSimilarityMetric.EUCLIDEAN_SIMILARITY:
        request.euclidean_similarity =
          new grpcControl._CreateIndexRequest._EuclideanSimilarity();
        break;
      case VectorSimilarityMetric.COSINE_SIMILARITY:
        request.cosine_similarity =
          new grpcControl._CreateIndexRequest._CosineSimilarity();
        break;
      default:
        return new CreateVectorIndex.Error(
          new InvalidArgumentError(
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `Invalid similarity metric: ${similarityMetric}`
          )
        );
    }

    return await new Promise<CreateVectorIndex.Response>(resolve => {
      this.clientWrapper.getClient().CreateIndex(
        request,
        {interceptors: this.interceptors},
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err, resp) => {
          if (err) {
            if (err.code === Status.ALREADY_EXISTS) {
              resolve(new CreateVectorIndex.AlreadyExists());
            } else {
              resolve(
                new CreateVectorIndex.Error(cacheServiceErrorMapper(err))
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
    return await new Promise<ListVectorIndexes.Response>(resolve => {
      this.clientWrapper
        .getClient()
        .ListIndexes(
          request,
          {interceptors: this.interceptors},
          (err, resp) => {
            if (err || !resp) {
              // TODO: `Argument of type 'unknown' is not assignable to parameter of type 'Error'.`
              //  I don't see how this is different from the other methods here. So, yeah, what?
              resolve(
                new ListVectorIndexes.Error(cacheServiceErrorMapper(err))
              );
            } else {
              // TODO: um, what?
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
              const indexes = resp.index_names;
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
    return await new Promise<DeleteVectorIndex.Response>(resolve => {
      this.clientWrapper.getClient().DeleteIndex(
        request,
        {interceptors: this.interceptors},
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err, resp) => {
          if (err) {
            resolve(new DeleteVectorIndex.Error(cacheServiceErrorMapper(err)));
          } else {
            resolve(new DeleteVectorIndex.Success());
          }
        }
      );
    });
  }
}
