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
  leaderboardUpsert(
    elements: Map<number, number>
  ): Promise<LeaderboardUpsert.Response>;
  leaderboardFetchByScore(
    options?: LeaderboardFetchByScoreCallOptions
  ): Promise<LeaderboardFetch.Response>;
  leaderboardFetchByRank(
    options?: LeaderboardFetchByRankCallOptions
  ): Promise<LeaderboardFetch.Response>;
  leaderboardGetRank(
    ids: Array<number>,
    options?: LeaderboardGetRankCallOptions
  ): Promise<LeaderboardFetch.Response>;
  leaderboardLength(): Promise<LeaderboardLength.Response>;
  leaderboardRemoveElements(
    ids: Array<number>
  ): Promise<LeaderboardRemoveElements.Response>;
  leaderboardDelete(): Promise<LeaderboardDelete.Response>;
}
export {
  LeaderboardFetchByRankCallOptions,
  LeaderboardFetchByScoreCallOptions,
  LeaderboardGetRankCallOptions,
  LeaderboardOrder,
};
