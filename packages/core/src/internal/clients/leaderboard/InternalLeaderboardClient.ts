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
  leaderboardFetchByScore(
    cacheName: string,
    leaderboardName: string,
    order?: SortedSetOrder,
    minScore?: number,
    maxScore?: number,
    offset?: number,
    count?: number
  ): Promise<LeaderboardFetch.Response>;
  leaderboardFetchByRank(
    cacheName: string,
    leaderboardName: string,
    startRank: number,
    endRank?: number,
    order?: SortedSetOrder
  ): Promise<LeaderboardFetch.Response>;
  leaderboardGetRank(
    cacheName: string,
    leaderboardName: string,
    id: bigint
  ): Promise<LeaderboardGetRank.Response>;
  leaderboardLength(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardLength.Response>;
  leaderboardRemoveElements(
    cacheName: string,
    leaderboardName: string,
    ids: Array<bigint>
  ): Promise<LeaderboardRemoveElements.Response>;
  leaderboardDelete(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardDelete.Response>;
}
