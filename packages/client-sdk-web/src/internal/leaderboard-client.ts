import {InternalLeaderboardClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {
  LeaderboardDelete,
  LeaderboardFetch,
  LeaderboardGetRank,
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
import {delay} from '@gomomento/common-integration-tests';
import {Request, UnaryResponse, StatusCode} from 'grpc-web';
import {
  createCallMetadata,
  getWebCacheEndpoint,
} from '../utils/web-client-utils';
import {leaderboard} from '@gomomento/generated-types-webtext';
import {
  _Element,
  _GetByRankRequest,
  _GetByRankResponse,
  _Order,
  _RankRange,
  _RankedElement as _RankedElementGrpc,
  _UpsertElementsRequest,
} from '@gomomento/generated-types-webtext/dist/leaderboard_pb';
import {ClientMetadataProvider} from './client-metadata-provider';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import { _RankedElement } from '@gomomento/sdk-core/dist/src/messages/responses/grpc-response-types';

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
    const convertedElements: _Element[] = [];
    elements.forEach((score, id) => {
      const newElement = new _Element();
      newElement.setId(String(id));
      newElement.setScore(score);
      convertedElements.push(newElement);
    });
    const request = new _UpsertElementsRequest();
    request.setCacheName(cacheName);
    request.setLeaderboard(leaderboardName);
    request.setElementsList(convertedElements);

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
    const offsetValue = offset === undefined ? 0n : BigInt(offset);
    const countValue = count === undefined ? 8192n : BigInt(count);
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
      validateSortedSetScores(minScore, maxScore);
      if (offset !== undefined) {
        validateLeaderboardOffset(offsetValue);
      }
      if (count !== undefined) {
        validateLeaderboardCount(countValue);
      }
    } catch (err) {
      return new LeaderboardFetch.Error(normalizeSdkError(err as Error));
    }
    await delay(1); // to keep async in the API signature
    return new LeaderboardFetch.Error(
      normalizeSdkError(new Error('Not Yet Implemented'))
    );
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
            const foundElements = (resp as _GetByRankResponse).getElementsList();
            const convertedElements: _RankedElement[] = foundElements.map(
              element => {
                return new _RankedElement(
                  BigInt(element.getId()),
                  element.getScore(),
                  BigInt(element.getRank())
                );
              }
            );
            resolve(new LeaderboardFetch.Found(convertedElements));
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
    id: bigint | number,
    order?: LeaderboardOrder
  ): Promise<LeaderboardGetRank.Response> {
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
    } catch (err) {
      return new LeaderboardGetRank.Error(normalizeSdkError(err as Error));
    }
    await delay(1); // to keep async in the API signature
    return new LeaderboardGetRank.Error(
      normalizeSdkError(new Error('Not Yet Implemented'))
    );
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
    await delay(1); // to keep async in the API signature
    return new LeaderboardLength.Error(
      normalizeSdkError(new Error('Not Yet Implemented'))
    );
  }

  public async leaderboardRemoveElements(
    cacheName: string,
    leaderboardName: string,
    ids: Array<bigint | number>
  ): Promise<LeaderboardRemoveElements.Response> {
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
    } catch (err) {
      return new LeaderboardRemoveElements.Error(
        normalizeSdkError(err as Error)
      );
    }
    await delay(1); // to keep async in the API signature
    return new LeaderboardRemoveElements.Error(
      normalizeSdkError(new Error('Not Yet Implemented'))
    );
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
    await delay(1); // to keep async in the API signature
    return new LeaderboardDelete.Error(
      normalizeSdkError(new Error('Not Yet Implemented'))
    );
  }
}
