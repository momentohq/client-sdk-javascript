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
} from '../utils/cache-call-options';

export interface ILeaderboard {
  upsert(
    elements: Record<number, number> | Map<number, number>
  ): Promise<LeaderboardUpsert.Response>;
  fetchByScore(
    options?: LeaderboardFetchByScoreCallOptions
  ): Promise<LeaderboardFetch.Response>;
  fetchByRank(
    startRank: number,
    endRank: number,
    options?: LeaderboardFetchByRankCallOptions
  ): Promise<LeaderboardFetch.Response>;
  getRank(
    ids: Array<number>,
    options?: LeaderboardGetRankCallOptions
  ): Promise<LeaderboardFetch.Response>;
  length(): Promise<LeaderboardLength.Response>;
  removeElements(
    ids: Array<number>
  ): Promise<LeaderboardRemoveElements.Response>;
  delete(): Promise<LeaderboardDelete.Response>;
}
export {
  LeaderboardFetchByRankCallOptions,
  LeaderboardFetchByScoreCallOptions,
  LeaderboardGetRankCallOptions,
  LeaderboardOrder,
};
