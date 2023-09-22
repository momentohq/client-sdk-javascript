import {
  LeaderboardDelete,
  LeaderboardFetch,
  LeaderboardGetRank,
  LeaderboardLength,
  LeaderboardRemoveElements,
  LeaderboardUpsert,
} from '../../../messages/responses/leaderboard';
import {SortedSetOrder} from '../../../utils/cache-call-options';

export interface InternalLeaderboardClient {
  leaderboardUpsert(
    cacheName: string,
    leaderboardName: string,
    elements: Map<bigint, number>
  ): Promise<LeaderboardUpsert.Response>;
  leaderboardFetchByRank(
    cacheName: string,
    leaderboardName: string,
    startRank: number,
    endRank?: number,
    order?: SortedSetOrder
  ): Promise<LeaderboardFetch.Response>;
  leaderboardFetchByScore(
    cacheName: string,
    leaderboardName: string,
    order?: SortedSetOrder,
    minScore?: number,
    maxScore?: number,
    offset?: number,
    count?: number
  ): Promise<LeaderboardFetch.Response>;
  leaderboardDelete(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardDelete.Response>;
  leaderboardLength(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardLength.Response>;
  leaderboardGetRank(
    cacheName: string,
    leaderboardName: string,
    elementId: bigint
  ): Promise<LeaderboardGetRank.Response>;
  leaderboardRemoveElements(
    cacheName: string,
    leaderboardName: string,
    elementIds: Array<bigint>
  ): Promise<LeaderboardRemoveElements.Response>;
}
