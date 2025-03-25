import {
  LeaderboardDelete,
  LeaderboardFetch,
  LeaderboardLength,
  LeaderboardRemoveElements,
  LeaderboardUpsert,
  MomentoLogger,
  LeaderboardOrder,
} from '@gomomento/sdk-core';
import {
  validateSortedSetScores,
  validateLeaderboardOffset,
  validateLeaderboardCount,
  validateLeaderboardRanks,
  validateLeaderboardNumberOfElements,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {Request, UnaryResponse} from 'grpc-web';
import {
  createCallMetadata,
  getWebCacheEndpoint,
} from '../utils/web-client-utils';
import {leaderboard} from '@gomomento/generated-types-webtext';
import {
  _DeleteLeaderboardRequest,
  _Element,
  _GetByRankRequest,
  _GetByScoreRequest,
  _GetLeaderboardLengthRequest,
  _GetRankRequest,
  _Order,
  _RankRange,
  _RankedElement as _RankedElementGrpc,
  _RemoveElementsRequest,
  _ScoreRange,
  _UpsertElementsRequest,
} from '@gomomento/generated-types-webtext/dist/leaderboard_pb';
import {ClientMetadataProvider} from './client-metadata-provider';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {_RankedElement} from '@gomomento/sdk-core/dist/src/messages/responses/grpc-response-types';
import {ILeaderboardDataClient} from '@gomomento/sdk-core/dist/src/internal/clients/leaderboard/ILeaderboardDataClient';
import {LeaderboardClientAllProps} from './leaderboard-client-all-props';
import {_Unbounded} from '@gomomento/generated-types-webtext/dist/common_pb';

export class LeaderboardDataClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> implements ILeaderboardDataClient
{
  private readonly logger: MomentoLogger;
  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;
  private readonly client: leaderboard.LeaderboardClient;
  private readonly clientMetadataProvider: ClientMetadataProvider;
  private readonly deadlineMillis: number;

  constructor(props: LeaderboardClientAllProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.cacheServiceErrorMapper = new CacheServiceErrorMapper(
      props.configuration.getThrowOnErrors()
    );
    this.logger.debug(
      `Creating data client using endpoint: '${getWebCacheEndpoint(
        props.credentialProvider
      )}`
    );
    this.clientMetadataProvider = new ClientMetadataProvider({
      authToken: props.credentialProvider.getAuthToken(),
      clientType: 'leaderboard',
    });
    this.deadlineMillis = props.configuration
      .getTransportStrategy()
      .getGrpcConfig()
      .getDeadlineMillis();
    this.client = new leaderboard.LeaderboardClient(
      // Note: all web SDK requests are routed to a `web.` subdomain to allow us flexibility on the server
      getWebCacheEndpoint(props.credentialProvider),
      null,
      {}
    );
  }

  close() {
    this.logger.debug('Closing cache control client');
    // do nothing as gRPC web version doesn't expose a close() yet.
    // this is needed as we have added close to `IControlClient` extended
    // by both nodejs and web SDKs
  }

  private convertMapOrRecordToElementsList(
    elements: Record<number, number> | Map<number, number>
  ): _Element[] {
    const convertedElements: _Element[] = [];
    if (elements instanceof Map) {
      elements.forEach((score, id) => {
        const newElement = new _Element();
        newElement.setId(id);
        newElement.setScore(score);
        convertedElements.push(newElement);
      });
    } else {
      Object.entries(elements).forEach(element => {
        const newElement = new _Element();
        newElement.setId(Number(element[0]));
        newElement.setScore(element[1]);
        convertedElements.push(newElement);
      });
    }
    return convertedElements;
  }

  private convertToRankedElementsList(
    elements: _RankedElementGrpc[]
  ): _RankedElement[] {
    return elements.map(element => {
      return new _RankedElement(
        element.getId(),
        element.getScore(),
        element.getRank()
      );
    });
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
    const request = new _UpsertElementsRequest();
    request.setLeaderboard(leaderboardName);
    request.setElementsList(this.convertMapOrRecordToElementsList(elements));

    return await new Promise((resolve, reject) => {
      this.client.upsertElements(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
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
    const request = new _GetByScoreRequest();
    request.setLeaderboard(leaderboardName);
    request.setOffset(offset);
    request.setLimitElements(count);

    const protoBufOrder =
      order === LeaderboardOrder.Descending
        ? _Order.DESCENDING
        : _Order.ASCENDING;
    request.setOrder(protoBufOrder);

    const protoBufScoreRange = new _ScoreRange();
    if (minScore !== undefined) {
      protoBufScoreRange.setMinInclusive(minScore);
    } else {
      protoBufScoreRange.setUnboundedMin(new _Unbounded());
    }
    if (maxScore !== undefined) {
      protoBufScoreRange.setMaxExclusive(maxScore);
    } else {
      protoBufScoreRange.setUnboundedMax(new _Unbounded());
    }
    request.setScoreRange(protoBufScoreRange);

    return await new Promise((resolve, reject) => {
      this.client.getByScore(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp) {
            const foundElements = resp.getElementsList();
            resolve(
              new LeaderboardFetch.Success(
                this.convertToRankedElementsList(foundElements)
              )
            );
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
    const request = new _GetByRankRequest();
    request.setLeaderboard(leaderboardName);

    const protoBufOrder =
      order === LeaderboardOrder.Descending
        ? _Order.DESCENDING
        : _Order.ASCENDING;
    request.setOrder(protoBufOrder);

    const protoBufRankRange = new _RankRange();
    protoBufRankRange.setStartInclusive(startRank);
    protoBufRankRange.setEndExclusive(endRank);
    request.setRankRange(protoBufRankRange);

    return await new Promise((resolve, reject) => {
      this.client.getByRank(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp) {
            const foundElements = resp.getElementsList();
            resolve(
              new LeaderboardFetch.Success(
                this.convertToRankedElementsList(foundElements)
              )
            );
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
    const request = new _GetRankRequest();
    request.setLeaderboard(leaderboardName);
    request.setIdsList(ids);

    const protoBufOrder =
      order === LeaderboardOrder.Descending
        ? _Order.DESCENDING
        : _Order.ASCENDING;
    request.setOrder(protoBufOrder);

    return await new Promise((resolve, reject) => {
      this.client.getRank(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp) {
            const foundElements = resp.getElementsList();
            resolve(
              new LeaderboardFetch.Success(
                this.convertToRankedElementsList(foundElements)
              )
            );
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
    const request = new _GetLeaderboardLengthRequest();
    request.setLeaderboard(leaderboardName);

    return await new Promise((resolve, reject) => {
      this.client.getLeaderboardLength(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp) {
            const length = resp.getCount();
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
    const request = new _RemoveElementsRequest();
    request.setLeaderboard(leaderboardName);
    request.setIdsList(ids);

    return await new Promise((resolve, reject) => {
      this.client.removeElements(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
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
    const request = new _DeleteLeaderboardRequest();
    request.setLeaderboard(leaderboardName);

    return await new Promise((resolve, reject) => {
      this.client.deleteLeaderboard(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
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
}
