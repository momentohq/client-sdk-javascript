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
  validateLeaderboardNumberOfElements,
  validateSortedSetScores,
  validateLeaderboardOffset,
  validateLeaderboardCount,
  validateLeaderboardRanks,
  range,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {LeaderboardConfiguration} from '../config/leaderboard-configuration';
import {leaderboard} from '@gomomento/generated-types/dist/leaderboard';
import _Element = leaderboard._Element;
import {IdleGrpcClientWrapper} from './grpc/idle-grpc-client-wrapper';
import {GrpcClientWrapper} from './grpc/grpc-client-wrapper';
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  ChannelCredentials,
  Interceptor,
  Metadata,
  ServiceError,
} from '@grpc/grpc-js';
import {version} from '../../package.json';
import {ILeaderboardDataClient} from '@gomomento/sdk-core/dist/src/internal/clients/leaderboard/ILeaderboardDataClient';

export class LeaderboardDataClient implements ILeaderboardDataClient {
  private readonly configuration: LeaderboardConfiguration;
  private readonly credentialProvider: CredentialProvider;
  private readonly logger: MomentoLogger;
  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;
  private readonly requestTimeoutMs: number;
  private readonly clientWrappers: GrpcClientWrapper<leaderboard.LeaderboardClient>[];
  protected nextDataClientIndex: number;
  private readonly interceptors: Interceptor[];

  constructor(props: LeaderboardClientProps) {
    this.configuration = props.configuration;
    this.cacheServiceErrorMapper = new CacheServiceErrorMapper(
      props.configuration.getThrowOnErrors()
    );
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

    const numDataClients = grpcConfig.getNumClients();

    // We round-robin the requests through all of our clients.  Since javascript
    // is single-threaded, we don't have to worry about thread safety on this
    // index variable.
    this.nextDataClientIndex = 0;

    this.clientWrappers = range(numDataClients).map(
      () =>
        new IdleGrpcClientWrapper({
          clientFactoryFn: () =>
            new leaderboard.LeaderboardClient(
              this.credentialProvider.getCacheEndpoint(),
              ChannelCredentials.createSsl(),
              {
                // default value for max session memory is 10mb.  Under high load, it is easy to exceed this,
                // after which point all requests will fail with a client-side RESOURCE_EXHAUSTED exception.
                'grpc-node.max_session_memory':
                  grpcConfig.getMaxSessionMemoryMb(),
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
        })
    );

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
    _loggerFactory: MomentoLoggerFactory
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

  private convertMapOrRecordToElementsList(
    elements: Record<number, number> | Map<number, number>
  ): _Element[] {
    const convertedElements: _Element[] = [];
    if (elements instanceof Map) {
      elements.forEach((score, id) =>
        convertedElements.push(new _Element({id: id, score: score}))
      );
    } else {
      Object.entries(elements).forEach(element =>
        convertedElements.push(
          new _Element({id: Number(element[0]), score: element[1]})
        )
      );
    }
    return convertedElements;
  }

  public async upsert(
    cacheName: string,
    leaderboardName: string,
    elements: Record<number, number> | Map<number, number>
  ): Promise<LeaderboardUpsert.Response> {
    const size =
      elements instanceof Map ? elements.size : Object.keys(elements).length;
    try {
      validateLeaderboardNumberOfElements(size);
    } catch (err) {
      return new LeaderboardUpsert.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(
      `Issuing 'upsert' request; cache: ${cacheName}, leaderboard: ${leaderboardName}, number of elements: ${size}`
    );
    return await this.sendUpsert(cacheName, leaderboardName, elements);
  }

  private async sendUpsert(
    cacheName: string,
    leaderboardName: string,
    elements: Record<number, number> | Map<number, number>
  ): Promise<LeaderboardUpsert.Response> {
    const request = new leaderboard._UpsertElementsRequest({
      cache_name: cacheName,
      leaderboard: leaderboardName,
      elements: this.convertMapOrRecordToElementsList(elements),
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.getNextDataClient().UpsertElements(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err: ServiceError | null, resp: unknown) => {
          if (resp) {
            resolve(new LeaderboardUpsert.Success());
          } else {
            this.cacheServiceErrorMapper.handleError(
              err,
              e => new LeaderboardUpsert.Error(e),
              resolve,
              reject
            );
          }
        }
      );
    });
  }

  public async fetchByScore(
    cacheName: string,
    leaderboardName: string,
    minScore?: number,
    maxScore?: number,
    order?: LeaderboardOrder,
    offset?: number,
    count?: number
  ): Promise<LeaderboardFetch.Response> {
    const offsetValue = offset === undefined ? 0 : offset;
    const countValue = count === undefined ? 8192 : count;
    const orderValue = order ?? LeaderboardOrder.Ascending;
    try {
      validateSortedSetScores(minScore, maxScore);
      validateLeaderboardOffset(offsetValue);
      validateLeaderboardCount(countValue);
    } catch (err) {
      return new LeaderboardFetch.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(
      `Issuing 'fetchByScore' request; cache: ${cacheName}, leaderboard: ${leaderboardName}, order: ${orderValue.toString()}, minScore: ${
        minScore ?? 'null'
      }, maxScore: ${
        maxScore?.toString() ?? 'null'
      }, offset: ${offsetValue.toString()}, count: ${countValue.toString()}`
    );
    return await this.sendFetchByScore(
      cacheName,
      leaderboardName,
      orderValue,
      offsetValue,
      countValue,
      minScore,
      maxScore
    );
  }

  private async sendFetchByScore(
    cacheName: string,
    leaderboardName: string,
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
      cache_name: cacheName,
      leaderboard: leaderboardName,
      score_range: protoBufScoreRange,
      order: protoBufOrder,
      offset: offset,
      limit_elements: count,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.getNextDataClient().GetByScore(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err: ServiceError | null, resp: unknown) => {
          if (resp) {
            const foundElements = (resp as leaderboard._GetByScoreResponse)
              .elements;
            resolve(new LeaderboardFetch.Success(foundElements));
          } else {
            this.cacheServiceErrorMapper.handleError(
              err,
              e => new LeaderboardFetch.Error(e),
              resolve,
              reject
            );
          }
        }
      );
    });
  }

  public async fetchByRank(
    cacheName: string,
    leaderboardName: string,
    startRank: number,
    endRank: number,
    order?: LeaderboardOrder
  ): Promise<LeaderboardFetch.Response> {
    const rankOrder = order ?? LeaderboardOrder.Ascending;
    try {
      validateLeaderboardRanks(startRank, endRank);
    } catch (err) {
      return new LeaderboardFetch.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(
      `Issuing 'fetchByRank' request; cache: ${cacheName}, leaderboard: ${leaderboardName}, order: ${rankOrder.toString()}, startRank: ${startRank}, endRank: ${endRank}`
    );
    return await this.sendFetchByRank(
      cacheName,
      leaderboardName,
      startRank,
      endRank,
      rankOrder
    );
  }

  private async sendFetchByRank(
    cacheName: string,
    leaderboardName: string,
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
      cache_name: cacheName,
      leaderboard: leaderboardName,
      rank_range: protoBufRankRange,
      order: protoBufOrder,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.getNextDataClient().GetByRank(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err: ServiceError | null, resp: unknown) => {
          if (resp) {
            const foundElements = (resp as leaderboard._GetByRankResponse)
              .elements;
            resolve(new LeaderboardFetch.Success(foundElements));
          } else {
            this.cacheServiceErrorMapper.handleError(
              err,
              e => new LeaderboardFetch.Error(e),
              resolve,
              reject
            );
          }
        }
      );
    });
  }

  public async getRank(
    cacheName: string,
    leaderboardName: string,
    ids: Array<number>,
    order?: LeaderboardOrder
  ): Promise<LeaderboardFetch.Response> {
    const orderValue = order ?? LeaderboardOrder.Ascending;
    this.logger.trace(
      `Issuing 'getRank' request; cache: ${cacheName}, leaderboard: ${leaderboardName}, order: ${orderValue.toString()}, number of ids: ${
        ids.length
      }`
    );
    return await this.sendGetRank(cacheName, leaderboardName, ids, orderValue);
  }

  private async sendGetRank(
    cacheName: string,
    leaderboardName: string,
    ids: Array<number>,
    order: LeaderboardOrder
  ): Promise<LeaderboardFetch.Response> {
    const protoBufOrder =
      order === LeaderboardOrder.Descending
        ? leaderboard._Order.DESCENDING
        : leaderboard._Order.ASCENDING;

    const request = new leaderboard._GetRankRequest({
      cache_name: cacheName,
      leaderboard: leaderboardName,
      ids: ids,
      order: protoBufOrder,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.getNextDataClient().GetRank(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err: ServiceError | null, resp: unknown) => {
          if (resp) {
            const foundElements = (resp as leaderboard._GetRankResponse)
              .elements;
            resolve(new LeaderboardFetch.Success(foundElements));
          } else {
            this.cacheServiceErrorMapper.handleError(
              err,
              e => new LeaderboardFetch.Error(e),
              resolve,
              reject
            );
          }
        }
      );
    });
  }

  public async length(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardLength.Response> {
    this.logger.trace(
      `Issuing 'length' request; cache: ${cacheName}, leaderboard: ${leaderboardName}`
    );
    return await this.sendLength(cacheName, leaderboardName);
  }

  private async sendLength(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardLength.Response> {
    const request = new leaderboard._GetLeaderboardLengthRequest({
      cache_name: cacheName,
      leaderboard: leaderboardName,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.getNextDataClient().GetLeaderboardLength(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err: ServiceError | null, resp: unknown) => {
          if (resp) {
            const length = (resp as leaderboard._GetLeaderboardLengthResponse)
              .count;
            resolve(new LeaderboardLength.Success(length));
          } else {
            this.cacheServiceErrorMapper.handleError(
              err,
              e => new LeaderboardLength.Error(e),
              resolve,
              reject
            );
          }
        }
      );
    });
  }

  public async removeElements(
    cacheName: string,
    leaderboardName: string,
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
      `Issuing 'removeElements' request; cache: ${cacheName}, leaderboard: ${leaderboardName}, number of elements: ${ids.length.toString()}`
    );
    return await this.sendRemoveElements(cacheName, leaderboardName, ids);
  }

  private async sendRemoveElements(
    cacheName: string,
    leaderboardName: string,
    ids: Array<number>
  ): Promise<LeaderboardRemoveElements.Response> {
    const request = new leaderboard._RemoveElementsRequest({
      cache_name: cacheName,
      leaderboard: leaderboardName,
      ids: ids,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.getNextDataClient().RemoveElements(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err: ServiceError | null, resp: unknown) => {
          if (resp) {
            resolve(new LeaderboardRemoveElements.Success());
          } else {
            this.cacheServiceErrorMapper.handleError(
              err,
              e => new LeaderboardRemoveElements.Error(e),
              resolve,
              reject
            );
          }
        }
      );
    });
  }

  public async delete(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardDelete.Response> {
    this.logger.trace(
      `Issuing 'delete' request; cache: ${cacheName}, leaderboard: ${leaderboardName}`
    );
    return await this.sendDelete(cacheName, leaderboardName);
  }

  private async sendDelete(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardDelete.Response> {
    const request = new leaderboard._DeleteLeaderboardRequest({
      cache_name: cacheName,
      leaderboard: leaderboardName,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.getNextDataClient().DeleteLeaderboard(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err: ServiceError | null, resp: unknown) => {
          if (resp) {
            resolve(new LeaderboardDelete.Success());
          } else {
            this.cacheServiceErrorMapper.handleError(
              err,
              e => new LeaderboardDelete.Error(e),
              resolve,
              reject
            );
          }
        }
      );
    });
  }

  protected getNextDataClient(): leaderboard.LeaderboardClient {
    const clientWrapper = this.clientWrappers[this.nextDataClientIndex];
    this.nextDataClientIndex =
      (this.nextDataClientIndex + 1) % this.clientWrappers.length;
    return clientWrapper.getClient();
  }
}
