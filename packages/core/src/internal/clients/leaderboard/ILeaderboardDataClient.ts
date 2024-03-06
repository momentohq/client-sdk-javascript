import {
  LeaderboardDelete,
  LeaderboardFetch,
  LeaderboardLength,
  LeaderboardRemoveElements,
  LeaderboardUpsert,
} from '../../../messages/responses/leaderboard';
import {LeaderboardOrder} from '../../../utils';

export interface ILeaderboardDataClient {
  upsert(
    cacheName: string,
    leaderboardName: string,
    elements: Record<number, number> | Map<number, number>
  ): Promise<LeaderboardUpsert.Response>;
  fetchByScore(
    cacheName: string,
    leaderboardName: string,
    minScore?: number,
    maxScore?: number,
    order?: LeaderboardOrder,
    offset?: number,
    count?: number
  ): Promise<LeaderboardFetch.Response>;
  fetchByRank(
    cacheName: string,
    leaderboardName: string,
    startRank: number,
    endRank: number,
    order?: LeaderboardOrder
  ): Promise<LeaderboardFetch.Response>;
  getRank(
    cacheName: string,
    leaderboardName: string,
    ids: Array<number>,
    order?: LeaderboardOrder
  ): Promise<LeaderboardFetch.Response>;
  length(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardLength.Response>;
  removeElements(
    cacheName: string,
    leaderboardName: string,
    ids: Array<number>
  ): Promise<LeaderboardRemoveElements.Response>;
  delete(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardDelete.Response>;
  close(): void;
}
