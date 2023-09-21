import {
  SortedSetFetchByRankCallOptions,
  SortedSetFetchByScoreCallOptions,
  SortedSetOrder,
} from '../utils';

export type LeaderboardGetElementsByRankRangeOptions = SortedSetFetchByRankCallOptions;
export type LeaderboardGetElementsByScoreRangeOptions = SortedSetFetchByScoreCallOptions;
export type LeaderboardOrder = SortedSetOrder;

export interface ILeaderboardClient {
    leaderboardDelete(
      cacheName: string,
      leaderboardName: string
    ): Promise<LeaderboardDelete.Response>;
    leaderboardLength(
      cacheName: string,
      leaderboardName: string
    ): Promise<LeaderboardLength.Response>;
    leaderboardUpsert(
      cacheName: string,
      leaderboardName: string,
      elements: Map<bigint, number>
    ): Promise<LeaderboardUpsert.Response>;
    leaderboardFetchByRank(
      cacheName: string,
      leaderboardName: string,
      options?: LeaderboardFetchByRankOptions
    ): Promise<LeaderboardFetchByRank.Response>;
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
    leaderboardFetchByScore(
      cacheName: string,
      leaderboardName: string,
      options?: LeaderboardFetchByScoreOptions
    ): Promise<LeaderboardFetchByScore.Response>;
}