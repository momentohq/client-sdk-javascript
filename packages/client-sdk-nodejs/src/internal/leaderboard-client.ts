import {
  CredentialProvider,
  InvalidArgumentError,
  LeaderboardDelete,
  LeaderboardFetch,
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
  validateLeaderboardNumberOfElements,
  validateSortedSetScores,
  validateLeaderboardOffset,
  validateLeaderboardCount,
  validateLeaderboardRanks,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {LeaderboardConfiguration} from '../config/leaderboard-configuration';
import {
  InternalLeaderboardClient,
  LeaderboardFetchByRankCallOptions,
  LeaderboardFetchByScoreCallOptions,
  LeaderboardGetRankCallOptions,
} from '@gomomento/sdk-core/dist/src/internal/clients';
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
  public readonly cacheName: string;
  public readonly leaderboardName: string;
  private readonly configuration: LeaderboardConfiguration;
  private readonly credentialProvider: CredentialProvider;
  private readonly logger: MomentoLogger;
  private readonly requestTimeoutMs: number;
  private readonly clientWrapper: GrpcClientWrapper<leaderboard.LeaderboardClient>;
  private readonly interceptors: Interceptor[];

  constructor(
    props: LeaderboardClientProps,
    cacheName: string,
    leaderboardName: string
  ) {
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
    } catch (err) {
      throw new InvalidArgumentError(
        'cache name and leaderboard name must not be empty strings'
      );
    }
    this.cacheName = cacheName;
    this.leaderboardName = leaderboardName;

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

  private convertMapToElementsList(elements: Map<number, number>): _Element[] {
    const convertedElements: _Element[] = [];
    elements.forEach((score, id) =>
      convertedElements.push(new _Element({id: id, score: score}))
    );
    return convertedElements;
  }

  public async leaderboardUpsert(
    elements: Map<number, number>
  ): Promise<LeaderboardUpsert.Response> {
    try {
      validateLeaderboardNumberOfElements(elements.size);
    } catch (err) {
      return new LeaderboardUpsert.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(
      `Issuing 'upsert' request; cache: ${this.cacheName}, leaderboard: ${this.leaderboardName}, number of elements: ${elements.size}`
    );
    return await this.sendLeaderboardUpsert(elements);
  }

  private async sendLeaderboardUpsert(
    elements: Map<number, number>
  ): Promise<LeaderboardUpsert.Response> {
    const request = new leaderboard._UpsertElementsRequest({
      cache_name: this.cacheName,
      leaderboard: this.leaderboardName,
      elements: this.convertMapToElementsList(elements),
    });
    const metadata = this.createMetadata(this.cacheName);
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
    options?: LeaderboardFetchByScoreCallOptions
  ): Promise<LeaderboardFetch.Response> {
    const offsetValue = options?.offset === undefined ? 0 : options.offset;
    const countValue = options?.count === undefined ? 8192 : options.count;
    const orderValue = options?.order ?? LeaderboardOrder.Ascending;
    try {
      validateSortedSetScores(options?.minScore, options?.maxScore);
      validateLeaderboardOffset(offsetValue);
      validateLeaderboardCount(countValue);
    } catch (err) {
      return new LeaderboardFetch.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(
      `Issuing 'leaderboardFetchByScore' request; cache: ${
        this.cacheName
      }, leaderboard: ${
        this.leaderboardName
      }, order: ${orderValue.toString()}, minScore: ${
        options?.minScore ?? 'null'
      }, maxScore: ${
        options?.maxScore?.toString() ?? 'null'
      }, offset: ${offsetValue.toString()}, count: ${countValue.toString()}`
    );
    return await this.sendLeaderboardFetchByScore(
      orderValue,
      offsetValue,
      countValue,
      options?.minScore,
      options?.maxScore
    );
  }

  private async sendLeaderboardFetchByScore(
    order: LeaderboardOrder,
    offset: number,
    count: number,
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
      cache_name: this.cacheName,
      leaderboard: this.leaderboardName,
      score_range: protoBufScoreRange,
      order: protoBufOrder,
      offset: offset,
      limit_elements: count,
    });
    const metadata = this.createMetadata(this.cacheName);
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
            if (foundElements.length) {
              resolve(new LeaderboardFetch.Found(foundElements));
            } else {
              // Empty list means requested elements were not found
              resolve(new LeaderboardFetch.NotFound());
            }
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
    options?: LeaderboardFetchByRankCallOptions
  ): Promise<LeaderboardFetch.Response> {
    const rankOrder = options?.order ?? LeaderboardOrder.Ascending;
    const startRankValue =
      options?.startRank === undefined ? 0 : options.startRank;
    const endRankValue =
      options?.endRank === undefined ? startRankValue + 8192 : options.endRank;
    try {
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
      startRankValue,
      endRankValue,
      rankOrder
    );
  }

  private async sendLeaderboardFetchByRank(
    startRank: number,
    endRank: number,
    order: LeaderboardOrder
  ): Promise<LeaderboardFetch.Response> {
    const protoBufOrder =
      order === LeaderboardOrder.Descending
        ? leaderboard._Order.DESCENDING
        : leaderboard._Order.ASCENDING;

    const protoBufRankRange = new leaderboard._RankRange({
      start_inclusive: startRank,
      end_exclusive: endRank,
    });

    const request = new leaderboard._GetByRankRequest({
      cache_name: this.cacheName,
      leaderboard: this.leaderboardName,
      rank_range: protoBufRankRange,
      order: protoBufOrder,
    });
    const metadata = this.createMetadata(this.cacheName);
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
            if (foundElements.length) {
              resolve(new LeaderboardFetch.Found(foundElements));
            } else {
              // Empty list means requested elements were not found
              resolve(new LeaderboardFetch.NotFound());
            }
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
    ids: Array<number>,
    options?: LeaderboardGetRankCallOptions
  ): Promise<LeaderboardFetch.Response> {
    const orderValue = options?.order ?? LeaderboardOrder.Ascending;
    this.logger.trace(
      `Issuing 'leaderboardGetRank' request; cache: ${
        this.cacheName
      }, leaderboard: ${
        this.leaderboardName
      }, order: ${orderValue.toString()}, number of ids: ${ids.length}`
    );
    return await this.sendLeaderboardGetRank(ids, orderValue);
  }

  private async sendLeaderboardGetRank(
    ids: Array<number>,
    order: LeaderboardOrder
  ): Promise<LeaderboardFetch.Response> {
    const protoBufOrder =
      order === LeaderboardOrder.Descending
        ? leaderboard._Order.DESCENDING
        : leaderboard._Order.ASCENDING;

    const request = new leaderboard._GetRankRequest({
      cache_name: this.cacheName,
      leaderboard: this.leaderboardName,
      ids: ids,
      order: protoBufOrder,
    });
    const metadata = this.createMetadata(this.cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.getClient().GetRank(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err: ServiceError | null, resp: unknown) => {
          if (resp) {
            const foundElements = (resp as leaderboard._GetRankResponse)
              .elements;
            if (foundElements.length) {
              resolve(new LeaderboardFetch.Found(foundElements));
            } else {
              // Empty list means requested elements were not found
              resolve(new LeaderboardFetch.NotFound());
            }
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

  public async leaderboardLength(): Promise<LeaderboardLength.Response> {
    this.logger.trace(
      `Issuing 'leaderboardLength' request; cache: ${this.cacheName}, leaderboard: ${this.leaderboardName}`
    );
    return await this.sendLeaderboardLength();
  }

  private async sendLeaderboardLength(): Promise<LeaderboardLength.Response> {
    const request = new leaderboard._GetLeaderboardLengthRequest({
      cache_name: this.cacheName,
      leaderboard: this.leaderboardName,
    });
    const metadata = this.createMetadata(this.cacheName);
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
            resolve(new LeaderboardLength.Found(length));
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
    ids: Array<number>
  ): Promise<LeaderboardRemoveElements.Response> {
    try {
      validateLeaderboardNumberOfElements(ids.length);
    } catch (err) {
      return new LeaderboardRemoveElements.Error(
        normalizeSdkError(err as Error)
      );
    }
    this.logger.trace(
      `Issuing 'leaderboardRemoveElements' request; cache: ${
        this.cacheName
      }, leaderboard: ${
        this.leaderboardName
      }, number of elements: ${ids.length.toString()}`
    );
    return await this.sendLeaderboardRemoveElements(ids);
  }

  private async sendLeaderboardRemoveElements(
    elements: Array<number>
  ): Promise<LeaderboardRemoveElements.Response> {
    const request = new leaderboard._RemoveElementsRequest({
      cache_name: this.cacheName,
      leaderboard: this.leaderboardName,
      ids: elements,
    });
    const metadata = this.createMetadata(this.cacheName);
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

  public async leaderboardDelete(): Promise<LeaderboardDelete.Response> {
    this.logger.trace(
      `Issuing 'leaderboardDelete' request; cache: ${this.cacheName}, leaderboard: ${this.leaderboardName}`
    );
    return await this.sendLeaderboardDelete();
  }

  private async sendLeaderboardDelete(): Promise<LeaderboardDelete.Response> {
    const request = new leaderboard._DeleteLeaderboardRequest({
      cache_name: this.cacheName,
      leaderboard: this.leaderboardName,
    });
    const metadata = this.createMetadata(this.cacheName);
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
