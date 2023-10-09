import {
  LeaderboardDelete,
  LeaderboardFetch,
  LeaderboardLength,
  LeaderboardRemoveElements,
  LeaderboardUpsert,
  MomentoLogger,
  LeaderboardOrder,
} from '@gomomento/sdk-core';
import {LeaderboardClientProps} from '../leaderboard-client-props';
import {normalizeSdkError} from '@gomomento/sdk-core/dist/src/errors';
import {
  validateSortedSetScores,
  validateLeaderboardOffset,
  validateLeaderboardCount,
  validateLeaderboardRanks,
  validateLeaderboardNumberOfElements,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {Request, UnaryResponse, StatusCode} from 'grpc-web';
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
  _Unbounded,
  _UpsertElementsRequest,
} from '@gomomento/generated-types-webtext/dist/leaderboard_pb';
import {ClientMetadataProvider} from './client-metadata-provider';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {_RankedElement} from '@gomomento/sdk-core/dist/src/messages/responses/grpc-response-types';
import {ILeaderboardDataClient} from '@gomomento/sdk-core/dist/src/internal/clients/leaderboard/ILeaderboardDataClient';

export class LeaderboardDataClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> implements ILeaderboardDataClient
{
  private readonly logger: MomentoLogger;
  private readonly client: leaderboard.LeaderboardClient;
  private readonly clientMetadataProvider: ClientMetadataProvider;
  private readonly deadlineMillis: number;

  constructor(props: LeaderboardClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.logger.debug(
      `Creating data client using endpoint: '${getWebCacheEndpoint(
        props.credentialProvider
      )}`
    );
    this.clientMetadataProvider = new ClientMetadataProvider({
      authToken: props.credentialProvider.getAuthToken(),
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

  private convertMapToElementsList(elements: Map<number, number>): _Element[] {
    const convertedElements: _Element[] = [];
    elements.forEach((score, id) => {
      const newElement = new _Element();
      newElement.setId(id);
      newElement.setScore(score);
      convertedElements.push(newElement);
    });
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

  public async leaderboardUpsert(
    cacheName: string,
    leaderboardName: string,
    elements: Map<number, number>
  ): Promise<LeaderboardUpsert.Response> {
    try {
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
    elements: Map<number, number>
  ): Promise<LeaderboardUpsert.Response> {
    const request = new _UpsertElementsRequest();
    request.setCacheName(cacheName);
    request.setLeaderboard(leaderboardName);
    request.setElementsList(this.convertMapToElementsList(elements));

    return await new Promise(resolve => {
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
            resolve(new LeaderboardUpsert.Error(cacheServiceErrorMapper(err)));
          }
        }
      );
    });
  }

  public async leaderboardFetchByScore(
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
    offset: number,
    count: number,
    minScore?: number,
    maxScore?: number
  ): Promise<LeaderboardFetch.Response> {
    const request = new _GetByScoreRequest();
    request.setCacheName(cacheName);
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

    return await new Promise(resolve => {
      this.client.getByScore(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp) {
            const foundElements = resp.getElementsList();
            if (foundElements.length) {
              resolve(
                new LeaderboardFetch.Found(
                  this.convertToRankedElementsList(foundElements)
                )
              );
            } else {
              // Empty list means requested elements were not found
              resolve(new LeaderboardFetch.NotFound());
            }
          } else {
            if (err.code === StatusCode.NOT_FOUND) {
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
    startRank?: number,
    endRank?: number,
    order?: LeaderboardOrder
  ): Promise<LeaderboardFetch.Response> {
    const rankOrder = order ?? LeaderboardOrder.Ascending;
    const startRankValue = startRank === undefined ? 0 : startRank;
    const endRankValue =
      endRank === undefined ? startRankValue + 8192 : endRank;
    try {
      validateLeaderboardRanks(startRankValue, endRankValue);
    } catch (err) {
      return new LeaderboardFetch.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(
      `Issuing 'leaderboardFetchByRank' request; cache: ${cacheName}, leaderboard: ${leaderboardName}, order: ${rankOrder.toString()}, startRank: ${
        startRank ?? 'null'
      }, endRank: ${endRank?.toString() ?? 'null'}`
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
    startRank: number,
    endRank: number,
    order: LeaderboardOrder
  ): Promise<LeaderboardFetch.Response> {
    const request = new _GetByRankRequest();
    request.setCacheName(cacheName);
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

    return await new Promise(resolve => {
      this.client.getByRank(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp) {
            const foundElements = resp.getElementsList();
            if (foundElements.length) {
              resolve(
                new LeaderboardFetch.Found(
                  this.convertToRankedElementsList(foundElements)
                )
              );
            } else {
              // Empty list means requested elements were not found
              resolve(new LeaderboardFetch.NotFound());
            }
          } else {
            if (err?.code === StatusCode.NOT_FOUND) {
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
    ids: Array<number>,
    order?: LeaderboardOrder
  ): Promise<LeaderboardFetch.Response> {
    const orderValue = order ?? LeaderboardOrder.Ascending;
    this.logger.trace(
      `Issuing 'leaderboardGetRank' request; cache: ${cacheName}, leaderboard: ${leaderboardName}, order: ${orderValue.toString()}, number of ids: ${
        ids.length
      }`
    );
    return await this.sendLeaderboardGetRank(
      cacheName,
      leaderboardName,
      ids,
      orderValue
    );
  }

  private async sendLeaderboardGetRank(
    cacheName: string,
    leaderboardName: string,
    ids: Array<number>,
    order: LeaderboardOrder
  ): Promise<LeaderboardFetch.Response> {
    const request = new _GetRankRequest();
    request.setCacheName(cacheName);
    request.setLeaderboard(leaderboardName);
    request.setIdsList(ids);

    const protoBufOrder =
      order === LeaderboardOrder.Descending
        ? _Order.DESCENDING
        : _Order.ASCENDING;
    request.setOrder(protoBufOrder);

    return await new Promise(resolve => {
      this.client.getRank(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp) {
            const foundElements = resp.getElementsList();
            if (foundElements.length) {
              resolve(
                new LeaderboardFetch.Found(
                  this.convertToRankedElementsList(foundElements)
                )
              );
            } else {
              // Empty list means requested elements were not found
              resolve(new LeaderboardFetch.NotFound());
            }
          } else {
            if (err?.code === StatusCode.NOT_FOUND) {
              resolve(new LeaderboardFetch.NotFound());
            } else {
              resolve(new LeaderboardFetch.Error(cacheServiceErrorMapper(err)));
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
    this.logger.trace(
      `Issuing 'leaderboardLength' request; cache: ${cacheName}, leaderboard: ${leaderboardName}`
    );
    return await this.sendLeaderboardLength(cacheName, leaderboardName);
  }

  private async sendLeaderboardLength(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardLength.Response> {
    const request = new _GetLeaderboardLengthRequest();
    request.setCacheName(cacheName);
    request.setLeaderboard(leaderboardName);

    return await new Promise(resolve => {
      this.client.getLeaderboardLength(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.deadlineMillis),
        },
        (err, resp) => {
          if (resp) {
            const length = resp.getCount();
            resolve(new LeaderboardLength.Found(length));
          } else {
            if (err?.code === StatusCode.NOT_FOUND) {
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
    ids: Array<number>
  ): Promise<LeaderboardRemoveElements.Response> {
    const request = new _RemoveElementsRequest();
    request.setCacheName(cacheName);
    request.setLeaderboard(leaderboardName);
    request.setIdsList(ids);

    return await new Promise(resolve => {
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
    this.logger.trace(
      `Issuing 'leaderboardDelete' request; cache: ${cacheName}, leaderboard: ${leaderboardName}`
    );
    return await this.sendLeaderboardDelete(cacheName, leaderboardName);
  }

  private async sendLeaderboardDelete(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardDelete.Response> {
    const request = new _DeleteLeaderboardRequest();
    request.setCacheName(cacheName);
    request.setLeaderboard(leaderboardName);

    return await new Promise(resolve => {
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
            resolve(new LeaderboardDelete.Error(cacheServiceErrorMapper(err)));
          }
        }
      );
    });
  }
}
