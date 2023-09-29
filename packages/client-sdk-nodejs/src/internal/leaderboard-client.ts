import {
  CredentialProvider,
  InvalidArgumentError,
  LeaderboardDelete,
  LeaderboardFetch,
  LeaderboardGetRank,
  LeaderboardLength,
  LeaderboardRemoveElements,
  LeaderboardUpsert,
  MomentoLogger,
  MomentoLoggerFactory,
  LeaderboardOrder,
} from '@gomomento/sdk-core';
import {LeaderboardClientProps} from '../leaderboard-client-props';
import {normalizeSdkError} from '@gomomento/sdk-core/dist/src/errors';
import {
  validateCacheName,
  validateLeaderboardName,
  validateLeaderboardRanks,
  validateLeaderboardOffset,
  validateLeaderboardCount,
  validateLeaderboardNumberOfElements,
  validateSortedSetScores,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {LeaderboardConfiguration} from '../config/leaderboard-configuration';
import {InternalLeaderboardClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {leaderboard} from '@gomomento/generated-types/dist/leaderboard';
import _Element = leaderboard._Element;
import {IdleGrpcClientWrapper} from './grpc/idle-grpc-client-wrapper';
import {GrpcClientWrapper} from './grpc/grpc-client-wrapper';
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  ChannelCredentials,
  Interceptor,
  Metadata,
  ServiceError,
  status,
} from '@grpc/grpc-js';
import {version} from '../../package.json';
import {_RankedElement} from '@gomomento/sdk-core/dist/src/messages/responses/grpc-response-types';

export class LeaderboardDataClient implements InternalLeaderboardClient {
  private readonly configuration: LeaderboardConfiguration;
  private readonly credentialProvider: CredentialProvider;
  private readonly logger: MomentoLogger;
  private readonly requestTimeoutMs: number;
  private readonly clientWrapper: GrpcClientWrapper<leaderboard.LeaderboardClient>;
  private readonly interceptors: Interceptor[];

  constructor(props: LeaderboardClientProps) {
    this.configuration = props.configuration;
    this.credentialProvider = props.credentialProvider;
    this.logger = this.configuration.getLoggerFactory().getLogger(this);
    const grpcConfig = this.configuration
      .getTransportStrategy()
      .getGrpcConfig();

    this.requestTimeoutMs = grpcConfig.getDeadlineMillis();
    this.validateRequestTimeout(this.requestTimeoutMs);
    this.logger.debug(
      `Creating leaderboard client using endpoint: '${this.credentialProvider.getCacheEndpoint()}'`
    );

    this.clientWrapper = new IdleGrpcClientWrapper({
      clientFactoryFn: () =>
        new leaderboard.LeaderboardClient(
          this.credentialProvider.getCacheEndpoint(),
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
        ),
      loggerFactory: this.configuration.getLoggerFactory(),
      maxIdleMillis: this.configuration
        .getTransportStrategy()
        .getMaxIdleMillis(),
    });

    this.interceptors = this.initializeInterceptors(
      this.configuration.getLoggerFactory()
    );
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

  private createMetadata(cacheName: string): Metadata {
    const metadata = new Metadata();
    metadata.set('cache', cacheName);
    return metadata;
  }

  private convertMapToElementsList(
    elements: Map<bigint | number, number>
  ): _Element[] {
    const convertedElements: _Element[] = [];
    elements.forEach((score, id) =>
      convertedElements.push(new _Element({id: String(id), score: score}))
    );
    return convertedElements;
  }

  private convertToRankedElementsList(
    elements: leaderboard._RankedElement[]
  ): _RankedElement[] {
    return elements.map(element => {
      return new _RankedElement(
        BigInt(element.id),
        element.score,
        BigInt(element.rank)
      );
    });
  }

  public async leaderboardUpsert(
    cacheName: string,
    leaderboardName: string,
    elements: Map<bigint | number, number>
  ): Promise<LeaderboardUpsert.Response> {
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
      validateLeaderboardNumberOfElements(elements.size);
    } catch (err) {
      return new LeaderboardUpsert.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(
      `Issuing 'upsert' request; cache: ${cacheName}, leaderboard: ${leaderboardName}, number of elements: ${elements.size}`
    );
    return await this.sendLeaderboardUpsert(
      cacheName,
      leaderboardName,
      elements
    );
  }

  private async sendLeaderboardUpsert(
    cacheName: string,
    leaderboardName: string,
    elements: Map<bigint | number, number>
  ): Promise<LeaderboardUpsert.Response> {
    const request = new leaderboard._UpsertElementsRequest({
      cache_name: cacheName,
      leaderboard: leaderboardName,
      elements: this.convertMapToElementsList(elements),
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.getClient().UpsertElements(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err: ServiceError | null, resp: unknown) => {
          if (resp) {
            resolve(new LeaderboardUpsert.Success());
          } else {
            resolve(new LeaderboardUpsert.Error(cacheServiceErrorMapper(err)));
          }
        }
      );
    });
  }

  public async leaderboardFetchByScore(
    cacheName: string,
    leaderboardName: string,
    order?: LeaderboardOrder,
    minScore?: number,
    maxScore?: number,
    offset?: bigint | number,
    count?: bigint | number
  ): Promise<LeaderboardFetch.Response> {
    const offsetValue = offset === undefined ? 0n : BigInt(offset);
    const countValue = count === undefined ? 8192n : BigInt(count);
    const orderValue = order ?? LeaderboardOrder.Ascending;
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
      validateSortedSetScores(minScore, maxScore);
      validateLeaderboardOffset(offsetValue);
      validateLeaderboardCount(countValue);
    } catch (err) {
      return new LeaderboardFetch.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(
      `Issuing 'leaderboardFetchByScore' request; cache: ${cacheName}, leaderboard: ${leaderboardName}, order: ${orderValue.toString()}, minScore: ${
        minScore ?? 'null'
      }, maxScore: ${
        maxScore?.toString() ?? 'null'
      }, offset: ${offsetValue.toString()}, count: ${countValue.toString()}`
    );
    return await this.sendLeaderboardFetchByScore(
      cacheName,
      leaderboardName,
      orderValue,
      offsetValue,
      countValue,
      minScore,
      maxScore
    );
  }

  private async sendLeaderboardFetchByScore(
    cacheName: string,
    leaderboardName: string,
    order: LeaderboardOrder,
    offset: bigint,
    count: bigint,
    minScore?: number,
    maxScore?: number
  ): Promise<LeaderboardFetch.Response> {
    const protoBufOrder =
      order === LeaderboardOrder.Descending
        ? leaderboard._Order.DESCENDING
        : leaderboard._Order.ASCENDING;

    const protoBufScoreRange = new leaderboard._ScoreRange();
    if (minScore !== undefined) {
      protoBufScoreRange.min_inclusive = minScore;
    } else {
      protoBufScoreRange.unbounded_min = new leaderboard._Unbounded();
    }
    if (maxScore !== undefined) {
      protoBufScoreRange.max_exclusive = maxScore;
    } else {
      protoBufScoreRange.unbounded_max = new leaderboard._Unbounded();
    }

    const request = new leaderboard._GetByScoreRequest({
      cache_name: cacheName,
      leaderboard: leaderboardName,
      score_range: protoBufScoreRange,
      order: protoBufOrder,
      offset: offset.toString(),
      limit_elements: count.toString(),
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.getClient().GetByScore(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err: ServiceError | null, resp: unknown) => {
          if (resp) {
            const foundElements = (resp as leaderboard._GetByScoreResponse)
              .elements;
            resolve(
              new LeaderboardFetch.Found(
                this.convertToRankedElementsList(foundElements)
              )
            );
          } else {
            if (err?.code === status.NOT_FOUND) {
              resolve(new LeaderboardFetch.NotFound());
            } else {
              resolve(new LeaderboardFetch.Error(cacheServiceErrorMapper(err)));
            }
          }
        }
      );
    });
  }

  public async leaderboardFetchByRank(
    cacheName: string,
    leaderboardName: string,
    startRank?: bigint | number,
    endRank?: bigint | number,
    order?: LeaderboardOrder
  ): Promise<LeaderboardFetch.Response> {
    const rankOrder = order ?? LeaderboardOrder.Ascending;
    const startRankValue = startRank === undefined ? 0n : BigInt(startRank);
    const endRankValue =
      endRank === undefined ? startRankValue + 8192n : BigInt(endRank);
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
      validateLeaderboardRanks(startRankValue, endRankValue);
    } catch (err) {
      return new LeaderboardFetch.Error(normalizeSdkError(err as Error));
    }

    this.logger.trace(
      "Issuing 'leaderboardFetchByRank' request; startRank: %s, endRank : %s, order: %s",
      startRankValue.toString(),
      endRankValue.toString(),
      rankOrder.toString()
    );
    return await this.sendLeaderboardFetchByRank(
      cacheName,
      leaderboardName,
      startRankValue,
      endRankValue,
      rankOrder
    );
  }

  private async sendLeaderboardFetchByRank(
    cacheName: string,
    leaderboardName: string,
    startRank: bigint,
    endRank: bigint,
    order: LeaderboardOrder
  ): Promise<LeaderboardFetch.Response> {
    const protoBufOrder =
      order === LeaderboardOrder.Descending
        ? leaderboard._Order.DESCENDING
        : leaderboard._Order.ASCENDING;

    const protoBufRankRange = new leaderboard._RankRange({
      start_inclusive: startRank.toString(),
      end_exclusive: endRank.toString(),
    });

    const request = new leaderboard._GetByRankRequest({
      cache_name: cacheName,
      leaderboard: leaderboardName,
      rank_range: protoBufRankRange,
      order: protoBufOrder,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.getClient().GetByRank(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err: ServiceError | null, resp: unknown) => {
          if (resp) {
            const foundElements = (resp as leaderboard._GetByRankResponse)
              .elements;
            resolve(
              new LeaderboardFetch.Found(
                this.convertToRankedElementsList(foundElements)
              )
            );
          } else {
            if (err?.code === status.NOT_FOUND) {
              resolve(new LeaderboardFetch.NotFound());
            } else {
              resolve(new LeaderboardFetch.Error(cacheServiceErrorMapper(err)));
            }
          }
        }
      );
    });
  }

  public async leaderboardGetRank(
    cacheName: string,
    leaderboardName: string,
    id: bigint | number,
    order?: LeaderboardOrder
  ): Promise<LeaderboardGetRank.Response> {
    const orderValue = order ?? LeaderboardOrder.Ascending;
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
    } catch (err) {
      return new LeaderboardGetRank.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(
      `Issuing 'leaderboardGetRank' request; cache: ${cacheName}, leaderboard: ${leaderboardName}, order: ${orderValue.toString()}, id: ${id.toString()}`
    );
    return await this.sendLeaderboardGetRank(
      cacheName,
      leaderboardName,
      BigInt(id),
      orderValue
    );
  }

  private async sendLeaderboardGetRank(
    cacheName: string,
    leaderboardName: string,
    id: bigint,
    order: LeaderboardOrder
  ): Promise<LeaderboardGetRank.Response> {
    const protoBufOrder =
      order === LeaderboardOrder.Descending
        ? leaderboard._Order.DESCENDING
        : leaderboard._Order.ASCENDING;

    const request = new leaderboard._GetRankRequest({
      cache_name: cacheName,
      leaderboard: leaderboardName,
      id: id.toString(),
      order: protoBufOrder,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.getClient().GetRank(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err: ServiceError | null, resp: unknown) => {
          if (resp) {
            const element = resp as leaderboard._RankedElement;
            resolve(new LeaderboardGetRank.Found(BigInt(element.rank)));
          } else {
            if (err?.code === status.NOT_FOUND) {
              resolve(new LeaderboardGetRank.NotFound());
            } else {
              resolve(
                new LeaderboardGetRank.Error(cacheServiceErrorMapper(err))
              );
            }
          }
        }
      );
    });
  }

  public async leaderboardLength(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardLength.Response> {
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
    } catch (err) {
      return new LeaderboardLength.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(
      `Issuing 'leaderboardLength' request; cache: ${cacheName}, leaderboard: ${leaderboardName}`
    );
    return await this.sendLeaderboardLength(cacheName, leaderboardName);
  }

  private async sendLeaderboardLength(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardLength.Response> {
    const request = new leaderboard._GetLeaderboardLengthRequest({
      cache_name: cacheName,
      leaderboard: leaderboardName,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.getClient().GetLeaderboardLength(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err: ServiceError | null, resp: unknown) => {
          if (resp) {
            const length = (resp as leaderboard._GetLeaderboardLengthResponse)
              .count;
            resolve(new LeaderboardLength.Found(BigInt(length)));
          } else {
            if (err?.code === status.NOT_FOUND) {
              resolve(new LeaderboardLength.NotFound());
            } else {
              resolve(
                new LeaderboardLength.Error(cacheServiceErrorMapper(err))
              );
            }
          }
        }
      );
    });
  }

  public async leaderboardRemoveElements(
    cacheName: string,
    leaderboardName: string,
    ids: Array<bigint | number>
  ): Promise<LeaderboardRemoveElements.Response> {
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
      validateLeaderboardNumberOfElements(ids.length);
    } catch (err) {
      return new LeaderboardRemoveElements.Error(
        normalizeSdkError(err as Error)
      );
    }
    this.logger.trace(
      `Issuing 'leaderboardRemoveElements' request; cache: ${cacheName}, leaderboard: ${leaderboardName}, number of elements: ${ids.length.toString()}`
    );
    return await this.sendLeaderboardRemoveElements(
      cacheName,
      leaderboardName,
      ids
    );
  }

  private async sendLeaderboardRemoveElements(
    cacheName: string,
    leaderboardName: string,
    elements: Array<bigint | number>
  ): Promise<LeaderboardRemoveElements.Response> {
    const convertedIds = elements.map(id => id.toString());
    const request = new leaderboard._RemoveElementsRequest({
      cache_name: cacheName,
      leaderboard: leaderboardName,
      ids: convertedIds,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.getClient().RemoveElements(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err: ServiceError | null, resp: unknown) => {
          if (resp) {
            resolve(new LeaderboardRemoveElements.Success());
          } else {
            resolve(
              new LeaderboardRemoveElements.Error(cacheServiceErrorMapper(err))
            );
          }
        }
      );
    });
  }

  public async leaderboardDelete(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardDelete.Response> {
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
    } catch (err) {
      return new LeaderboardDelete.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(
      `Issuing 'leaderboardDelete' request; cache: ${cacheName}, leaderboard: ${leaderboardName}`
    );
    return await this.sendLeaderboardDelete(cacheName, leaderboardName);
  }

  private async sendLeaderboardDelete(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardDelete.Response> {
    const request = new leaderboard._DeleteLeaderboardRequest({
      cache_name: cacheName,
      leaderboard: leaderboardName,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.getClient().DeleteLeaderboard(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err: ServiceError | null, resp: unknown) => {
          if (resp) {
            resolve(new LeaderboardDelete.Success());
          } else {
            resolve(new LeaderboardDelete.Error(cacheServiceErrorMapper(err)));
          }
        }
      );
    });
  }
}
