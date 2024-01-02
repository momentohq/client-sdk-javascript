import {control} from '@gomomento/generated-types-webtext';
import {
  CredentialProvider,
  InvalidArgumentError,
  MomentoLogger,
  VectorIndexConfiguration,
  VectorIndexInfo,
} from '..';
import {Request, StatusCode, UnaryResponse} from 'grpc-web';
import {
  _CreateIndexRequest,
  _ListIndexesRequest,
  _DeleteIndexRequest,
  _SimilarityMetric,
} from '@gomomento/generated-types-webtext/dist/controlclient_pb';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  IVectorIndexControlClient,
  VectorSimilarityMetric,
} from '@gomomento/sdk-core/dist/src/internal/clients';
import {
  normalizeSdkError,
  UnknownError,
} from '@gomomento/sdk-core/dist/src/errors';
import {
  validateIndexName,
  validateNumDimensions,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {getWebControlEndpoint} from '../utils/web-client-utils';
import {ClientMetadataProvider} from './client-metadata-provider';
import {
  CreateVectorIndex,
  DeleteVectorIndex,
  ListVectorIndexes,
} from '@gomomento/sdk-core';

export interface ControlClientProps {
  configuration: VectorIndexConfiguration;
  credentialProvider: CredentialProvider;
}

export class VectorIndexControlClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> implements IVectorIndexControlClient
{
  private readonly clientWrapper: control.ScsControlClient;
  private readonly logger: MomentoLogger;
  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;

  private readonly clientMetadataProvider: ClientMetadataProvider;

  /**
   * @param {ControlClientProps} props
   */
  constructor(props: ControlClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.cacheServiceErrorMapper = new CacheServiceErrorMapper(
      props.configuration.getThrowOnErrors()
    );
    this.logger.debug(
      `Creating control client using endpoint: '${getWebControlEndpoint(
        props.credentialProvider
      )}`
    );

    this.clientMetadataProvider = new ClientMetadataProvider({
      authToken: props.credentialProvider.getAuthToken(),
    });
    this.clientWrapper = new control.ScsControlClient(
      // Note: all web SDK requests are routed to a `web.` subdomain to allow us flexibility on the server
      getWebControlEndpoint(props.credentialProvider),
      null,
      {}
    );
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
    const request = new _CreateIndexRequest();
    request.setIndexName(indexName);
    request.setNumDimensions(numDimensions);

    similarityMetric ??= VectorSimilarityMetric.COSINE_SIMILARITY;

    const similarityMetricPb = new _SimilarityMetric();
    switch (similarityMetric) {
      case VectorSimilarityMetric.INNER_PRODUCT:
        similarityMetricPb.setInnerProduct(
          new _SimilarityMetric._InnerProduct()
        );
        break;
      case VectorSimilarityMetric.EUCLIDEAN_SIMILARITY:
        similarityMetricPb.setEuclideanSimilarity(
          new _SimilarityMetric._EuclideanSimilarity()
        );
        break;
      case VectorSimilarityMetric.COSINE_SIMILARITY:
        similarityMetricPb.setCosineSimilarity(
          new _SimilarityMetric._CosineSimilarity()
        );
        break;
      default:
        return new CreateVectorIndex.Error(
          new InvalidArgumentError(
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `Invalid similarity metric: ${similarityMetric}`
          )
        );
    }
    request.setSimilarityMetric(similarityMetricPb);

    this.logger.debug("Issuing 'createIndex' request");
    return await new Promise<CreateVectorIndex.Response>((resolve, reject) => {
      this.clientWrapper.createIndex(
        request,
        this.clientMetadataProvider.createClientMetadata(),
        (err, _resp) => {
          if (err) {
            if (err.code === StatusCode.ALREADY_EXISTS) {
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
    const request = new _ListIndexesRequest();
    this.logger.debug("Issuing 'listIndexes' request");
    return await new Promise<ListVectorIndexes.Response>((resolve, reject) => {
      this.clientWrapper.listIndexes(
        request,
        this.clientMetadataProvider.createClientMetadata(),
        (err, resp) => {
          if (err) {
            this.cacheServiceErrorMapper.handleError(
              err,
              e => new ListVectorIndexes.Error(e),
              resolve,
              reject
            );
          } else {
            const indexes: VectorIndexInfo[] = resp
              .getIndexesList()
              .map(index => {
                let similarityMetric: VectorSimilarityMetric =
                  VectorSimilarityMetric.COSINE_SIMILARITY;
                switch (
                  index.getSimilarityMetric()?.getSimilarityMetricCase()
                ) {
                  case _SimilarityMetric.SimilarityMetricCase.INNER_PRODUCT:
                    similarityMetric = VectorSimilarityMetric.INNER_PRODUCT;
                    break;
                  case _SimilarityMetric.SimilarityMetricCase
                    .EUCLIDEAN_SIMILARITY:
                    similarityMetric =
                      VectorSimilarityMetric.EUCLIDEAN_SIMILARITY;
                    break;
                  case _SimilarityMetric.SimilarityMetricCase.COSINE_SIMILARITY:
                    similarityMetric = VectorSimilarityMetric.COSINE_SIMILARITY;
                    break;
                  default:
                    resolve(
                      new ListVectorIndexes.Error(
                        new UnknownError(
                          `Unknown similarity metric: ${
                            index
                              .getSimilarityMetric()
                              ?.getSimilarityMetricCase() ?? 'undefined'
                          }`
                        )
                      )
                    );
                    break;
                }
                return new VectorIndexInfo(
                  index.getIndexName(),
                  index.getNumDimensions(),
                  similarityMetric
                );
              });
            resolve(new ListVectorIndexes.Success(indexes));
          }
        }
      );
    });
  }

  public async deleteIndex(indexName: string) {
    const request = new _DeleteIndexRequest();
    try {
      validateIndexName(indexName);
    } catch (err) {
      return new CreateVectorIndex.Error(normalizeSdkError(err as Error));
    }
    request.setIndexName(indexName);
    this.logger.debug("Issuing 'deleteIndex' request");
    return await new Promise<DeleteVectorIndex.Response>((resolve, reject) => {
      this.clientWrapper.deleteIndex(
        request,
        this.clientMetadataProvider.createClientMetadata(),
        (err, _resp) => {
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
