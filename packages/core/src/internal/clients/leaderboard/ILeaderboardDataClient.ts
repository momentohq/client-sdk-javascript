import {
  LeaderboardDelete,
  LeaderboardFetch,
  LeaderboardLength,
  LeaderboardRemoveElements,
  LeaderboardUpsert,
} from '../../../messages/responses/leaderboard';
import {LeaderboardOrder} from '../../../utils';

export interface ILeaderboardDataClient {
  leaderboardUpsert(
    cacheName: string,
    leaderboardName: string,
    elements: Map<number, number>
  ): Promise<LeaderboardUpsert.Response>;
  leaderboardFetchByScore(
    cacheName: string,
    leaderboardName: string,
    minScore?: number,
    maxScore?: number,
    order?: LeaderboardOrder,
    offset?: number,
    count?: number
  ): Promise<LeaderboardFetch.Response>;
  leaderboardFetchByRank(
    cacheName: string,
    leaderboardName: string,
    startRank?: number,
    endRank?: number,
    order?: LeaderboardOrder
  ): Promise<LeaderboardFetch.Response>;
  leaderboardGetRank(
    cacheName: string,
    leaderboardName: string,
    ids: Array<number>,
    order?: LeaderboardOrder
  ): Promise<LeaderboardFetch.Response>;
  leaderboardLength(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardLength.Response>;
  leaderboardRemoveElements(
    cacheName: string,
    leaderboardName: string,
    ids: Array<number>
  ): Promise<LeaderboardRemoveElements.Response>;
  leaderboardDelete(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardDelete.Response>;
}
