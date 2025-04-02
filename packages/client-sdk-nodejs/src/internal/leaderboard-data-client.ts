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
import {Header, HeaderInterceptor} from './grpc/headers-interceptor';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  ChannelCredentials,
  Interceptor,
  Metadata,
  ServiceError,
} from '@grpc/grpc-js';
import {version} from '../../package.json';
import {ILeaderboardDataClient} from '@gomomento/sdk-core/dist/src/internal/clients/leaderboard/ILeaderboardDataClient';
import {LeaderboardClientAllProps} from './leaderboard-client-all-props';
import {middlewaresInterceptor} from './grpc/middlewares-interceptor';
import {
  Middleware,
  MiddlewareRequestHandlerContext,
} from '../config/middleware/middleware';
import {grpcChannelOptionsFromGrpcConfig} from './grpc/grpc-channel-options';
import {common} from '@gomomento/generated-types/dist/common';
import {RetryInterceptor} from './grpc/retry-interceptor';

export const CONNECTION_ID_KEY = Symbol('connectionID');

export class LeaderboardDataClient implements ILeaderboardDataClient {
  private readonly configuration: LeaderboardConfiguration;
  private readonly credentialProvider: CredentialProvider;
  private readonly logger: MomentoLogger;
  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;
  private readonly requestTimeoutMs: number;
  private readonly clientWrappers: GrpcClientWrapper<leaderboard.LeaderboardClient>[];
  protected nextDataClientIndex: number;
  private readonly interceptors: Interceptor[];

  /**
   * @param {LeaderboardClientAllProps} props
   * @param dataClientID
   */
  constructor(props: LeaderboardClientAllProps, dataClientID: string) {
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

    const channelOptions = grpcChannelOptionsFromGrpcConfig(grpcConfig);

    this.clientWrappers = range(numDataClients).map(
      () =>
        new IdleGrpcClientWrapper({
          clientFactoryFn: () =>
            new leaderboard.LeaderboardClient(
              this.credentialProvider.getCacheEndpoint(),
              this.credentialProvider.isCacheEndpointSecure()
                ? ChannelCredentials.createSsl()
                : ChannelCredentials.createInsecure(),
              channelOptions
            ),
          loggerFactory: this.configuration.getLoggerFactory(),
          clientTimeoutMillis: this.requestTimeoutMs,
          maxIdleMillis: this.configuration
            .getTransportStrategy()
            .getMaxIdleMillis(),
        })
    );

    const context: MiddlewareRequestHandlerContext = {};
    context[CONNECTION_ID_KEY] = dataClientID;
    this.interceptors = this.initializeInterceptors(
      this.configuration.getLoggerFactory(),
      this.configuration.getMiddlewares(),
      context
    );
  }

  close() {
    this.logger.debug('Closing leaderboard data clients');
    this.clientWrappers.map(wrapper => wrapper.getClient().close());
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
    _loggerFactory: MomentoLoggerFactory,
    middlewares: Middleware[],
    middlewareRequestContext: MiddlewareRequestHandlerContext
  ): Interceptor[] {
    const headers = [
      new Header('Authorization', this.credentialProvider.getAuthToken()),
      new Header('agent', `nodejs:leaderboard:${version}`),
      new Header('runtime-version', `nodejs:${process.versions.node}`),
    ];
    return [
      middlewaresInterceptor(
        _loggerFactory,
        middlewares,
        middlewareRequestContext
      ),
      HeaderInterceptor.createHeadersInterceptor(headers),
      RetryInterceptor.createRetryInterceptor({
        clientName: 'LeaderboardDataClient',
        loggerFactory: _loggerFactory,
        overallRequestTimeoutMs: this.requestTimeoutMs,
      }),
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
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new LeaderboardUpsert.Error(err)
      );
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new LeaderboardUpsert.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new LeaderboardFetch.Error(err)
      );
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
      protoBufScoreRange.unbounded_min = new common._Unbounded();
    }
    if (maxScore !== undefined) {
      protoBufScoreRange.max_exclusive = maxScore;
    } else {
      protoBufScoreRange.unbounded_max = new common._Unbounded();
    }

    const request = new leaderboard._GetByScoreRequest({
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new LeaderboardFetch.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new LeaderboardFetch.Error(err)
      );
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new LeaderboardFetch.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new LeaderboardFetch.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new LeaderboardLength.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new LeaderboardRemoveElements.Error(err)
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e =>
                new LeaderboardRemoveElements.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new LeaderboardDelete.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
