import {InternalLeaderboardClient} from '@gomomento/sdk-core/dist/src/internal/clients';
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
  validateCacheName,
  validateLeaderboardName,
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

export class LeaderboardDataClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> implements InternalLeaderboardClient
{
  private readonly logger: MomentoLogger;
  private readonly client: leaderboard.LeaderboardClient;
  private readonly clientMetadataProvider: ClientMetadataProvider;
  private readonly deadlineMillis: number;

  /**
   * @param {LeaderboardClientProps} props
   */
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

  private convertMapToElementsList(
    elements: Map<bigint | number, number>
  ): _Element[] {
    const convertedElements: _Element[] = [];
    elements.forEach((score, id) => {
      const newElement = new _Element();
      newElement.setId(String(id));
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
        BigInt(element.getId()),
        element.getScore(),
        BigInt(element.getRank())
      );
    });
  }

  private convertIdsToStringArray(ids: Array<bigint | number>) {
    return ids.map(id => id.toString());
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
    order?: LeaderboardOrder,
    minScore?: number,
    maxScore?: number,
    offset?: bigint | number,
    count?: bigint | number
  ): Promise<LeaderboardFetch.Response> {
    const offsetValue = offset === undefined ? BigInt(0) : BigInt(offset);
    const countValue = count === undefined ? BigInt(8192) : BigInt(count);
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
    const request = new _GetByScoreRequest();
    request.setCacheName(cacheName);
    request.setLeaderboard(leaderboardName);
    request.setOffset(offset.toString());
    request.setLimitElements(count.toString());

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
            resolve(
              new LeaderboardFetch.Found(
                this.convertToRankedElementsList(foundElements)
              )
            );
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
    startRank?: bigint | number,
    endRank?: bigint | number,
    order?: LeaderboardOrder
  ): Promise<LeaderboardFetch.Response> {
    const rankOrder = order ?? LeaderboardOrder.Ascending;
    const startRankValue =
      startRank === undefined ? BigInt(0) : BigInt(startRank);
    const endRankValue =
      endRank === undefined ? startRankValue + BigInt(8192) : BigInt(endRank);
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
    const request = new _GetByRankRequest();
    request.setCacheName(cacheName);
    request.setLeaderboard(leaderboardName);

    const protoBufOrder =
      order === LeaderboardOrder.Descending
        ? _Order.DESCENDING
        : _Order.ASCENDING;
    request.setOrder(protoBufOrder);

    const protoBufRankRange = new _RankRange();
    protoBufRankRange.setStartInclusive(startRank.toString());
    protoBufRankRange.setEndExclusive(endRank.toString());
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
            resolve(
              new LeaderboardFetch.Found(
                this.convertToRankedElementsList(foundElements)
              )
            );
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
    ids: Array<bigint | number>,
    order?: LeaderboardOrder
  ): Promise<LeaderboardFetch.Response> {
    const orderValue = order ?? LeaderboardOrder.Ascending;
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
    } catch (err) {
      return new LeaderboardFetch.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(
      `Issuing 'leaderboardGetRank' request; cache: ${cacheName}, leaderboard: ${leaderboardName}, order: ${orderValue.toString()}, number of ids: ${
        ids.length
      }`
    );
    return await this.sendLeaderboardGetRank(
      cacheName,
      leaderboardName,
      this.convertIdsToStringArray(ids),
      orderValue
    );
  }

  private async sendLeaderboardGetRank(
    cacheName: string,
    leaderboardName: string,
    ids: Array<string>,
    order?: LeaderboardOrder
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
            resolve(
              new LeaderboardFetch.Found(
                this.convertToRankedElementsList(foundElements)
              )
            );
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
            resolve(new LeaderboardLength.Found(BigInt(length)));
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
    const request = new _RemoveElementsRequest();
    request.setCacheName(cacheName);
    request.setLeaderboard(leaderboardName);

    const convertedIds = elements.map(id => id.toString());
    request.setIdsList(convertedIds);

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
