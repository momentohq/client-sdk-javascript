import {InternalLeaderboardClient} from '../internal/clients';
import {
  LeaderboardFetchByRankCallOptions,
  LeaderboardFetchByScoreCallOptions,
  LeaderboardGetRankCallOptions,
  LeaderboardOrder,
} from '../utils';

export interface ILeaderboardClient {
  leaderboard(
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
