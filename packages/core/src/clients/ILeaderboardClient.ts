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
    leaderboardGetElementsByRankRange(
      cacheName: string,
      leaderboardName: string,
      options?: LeaderboardGetElementsByRankRangeOptions
    ): Promise<LeaderboardGetElementsByRankRange.Response>;
    leaderboardGetElementRank(
      cacheName: string,
      leaderboardName: string,
      elementId: bigint
    ): Promise<LeaderboardGetElementRank.Response>;
    leaderboardRemoveElements(
      cacheName: string,
      leaderboardName: string,
      elementIds: Array<bigint>
    ): Promise<LeaderboardRemoveElements.Response>;
    leaderboardGetElementsByScoreRange(
      cacheName: string,
      leaderboardName: string,
      options?: LeaderboardGetElementsByScoreRangeOptions
    ): Promise<LeaderboardGetElementsByScoreRange.Response>;
}