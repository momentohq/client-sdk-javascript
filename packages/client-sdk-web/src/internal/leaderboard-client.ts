import {InternalLeaderboardClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {
  LeaderboardDelete,
  LeaderboardFetch,
  LeaderboardGetRank,
  LeaderboardLength,
  LeaderboardRemoveElements,
  LeaderboardUpsert,
  MomentoLogger,
  SortedSetOrder,
} from '@gomomento/sdk-core';
import {LeaderboardClientProps} from '../leaderboard-client-props';
import {normalizeSdkError} from '@gomomento/sdk-core/dist/src/errors';
import {
  validateCacheName,
  validateLeaderboardName,
  validateSortedSetRanks,
  validateSortedSetScores,
  validateSortedSetOffset,
  validateSortedSetCount,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {delay} from '@gomomento/common-integration-tests';
import {Request, UnaryResponse} from 'grpc-web';
import {getWebCacheEndpoint} from '../utils/web-client-utils';

export class LeaderboardClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> implements InternalLeaderboardClient
{
  private readonly logger: MomentoLogger;
  // TODO: add LeaderboardClient and other class members

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

    // TODO: create LeaderboardClient
  }

  public async leaderboardUpsert(
    cacheName: string,
    leaderboardName: string,
    elements: Map<bigint, number>
  ): Promise<LeaderboardUpsert.Response> {
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
    } catch (err) {
      return new LeaderboardUpsert.Error(normalizeSdkError(err as Error));
    }
    await delay(1); // to keep async in the API signature
    return new LeaderboardUpsert.Error(
      normalizeSdkError(new Error('Not Yet Implemented'))
    );
  }

  public async leaderboardFetchByScore(
    cacheName: string,
    leaderboardName: string,
    order?: SortedSetOrder,
    minScore?: number,
    maxScore?: number,
    offset?: number,
    count?: number
  ): Promise<LeaderboardFetch.Response> {
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
      validateSortedSetScores(minScore, maxScore);
      if (offset !== undefined) {
        validateSortedSetOffset(offset);
      }
      if (count !== undefined) {
        validateSortedSetCount(count);
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
    startRank: number,
    endRank?: number,
    order?: SortedSetOrder
  ): Promise<LeaderboardFetch.Response> {
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
      validateSortedSetRanks(startRank, endRank);
    } catch (err) {
      return new LeaderboardFetch.Error(normalizeSdkError(err as Error));
    }
    await delay(1); // to keep async in the API signature
    return new LeaderboardFetch.Error(
      normalizeSdkError(new Error('Not Yet Implemented'))
    );
  }

  public async leaderboardGetRank(
    cacheName: string,
    leaderboardName: string,
    elementId: bigint
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
    elementIds: Array<bigint>
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
