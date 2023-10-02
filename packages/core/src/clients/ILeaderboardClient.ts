import {
  LeaderboardDelete,
  LeaderboardFetch,
  LeaderboardLength,
  LeaderboardRemoveElements,
  LeaderboardUpsert,
} from '../messages/responses/leaderboard';
import {
  LeaderboardFetchByRankCallOptions,
  LeaderboardFetchByScoreCallOptions,
  LeaderboardGetRankCallOptions,
  LeaderboardOrder,
} from '../utils';

export interface ILeaderboardClient {
  leaderboardUpsert(
    cacheName: string,
    leaderboardName: string,
    elements: Map<bigint | number, number>
  ): Promise<LeaderboardUpsert.Response>;
  leaderboardFetchByScore(
    cacheName: string,
    leaderboardName: string,
    options?: LeaderboardFetchByScoreCallOptions
  ): Promise<LeaderboardFetch.Response>;
  leaderboardFetchByRank(
    cacheName: string,
    leaderboardName: string,
    options?: LeaderboardFetchByRankCallOptions
  ): Promise<LeaderboardFetch.Response>;
  leaderboardGetRank(
    cacheName: string,
    leaderboardName: string,
    ids: Array<bigint | number>,
    options?: LeaderboardGetRankCallOptions
  ): Promise<LeaderboardFetch.Response>;
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
export {
  LeaderboardFetchByRankCallOptions,
  LeaderboardFetchByScoreCallOptions,
  LeaderboardGetRankCallOptions,
  LeaderboardOrder,
};
