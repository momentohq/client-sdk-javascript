import {InternalLeaderboardClient} from '../internal/clients';
import {
  LeaderboardFetchByRankCallOptions,
  LeaderboardFetchByScoreCallOptions,
  LeaderboardGetRankCallOptions,
  LeaderboardOrder,
} from '../utils';

export interface ILeaderboardClient {
  createLeaderboard(
    cacheName: string,
    leaderboardName: string
  ): InternalLeaderboardClient;
}
export {
  LeaderboardFetchByRankCallOptions,
  LeaderboardFetchByScoreCallOptions,
  LeaderboardGetRankCallOptions,
  LeaderboardOrder,
};
