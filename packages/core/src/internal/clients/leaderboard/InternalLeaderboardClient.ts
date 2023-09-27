import {
  LeaderboardDelete,
  LeaderboardFetch,
  LeaderboardGetRank,
  LeaderboardLength,
  LeaderboardRemoveElements,
  LeaderboardUpsert,
} from '../../../messages/responses/leaderboard';
import {LeaderboardOrder} from '../../../utils/cache-call-options';

export interface InternalLeaderboardClient {
  leaderboardUpsert(
    cacheName: string,
    leaderboardName: string,
    elements: Map<bigint | number, number>
  ): Promise<LeaderboardUpsert.Response>;
  leaderboardFetchByScore(
    cacheName: string,
    leaderboardName: string,
    order?: LeaderboardOrder,
    minScore?: number,
    maxScore?: number,
    offset?: bigint | number,
    count?: bigint | number
  ): Promise<LeaderboardFetch.Response>;
  leaderboardFetchByRank(
    cacheName: string,
    leaderboardName: string,
    startRank?: bigint | number,
    endRank?: bigint | number,
    order?: LeaderboardOrder
  ): Promise<LeaderboardFetch.Response>;
  leaderboardGetRank(
    cacheName: string,
    leaderboardName: string,
    id: bigint | number,
    order?: LeaderboardOrder
  ): Promise<LeaderboardGetRank.Response>;
  leaderboardLength(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardLength.Response>;
  leaderboardRemoveElements(
    cacheName: string,
    leaderboardName: string,
    ids: Array<bigint | number>
  ): Promise<LeaderboardRemoveElements.Response>;
  leaderboardDelete(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardDelete.Response>;
}
