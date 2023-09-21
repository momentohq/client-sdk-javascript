import {
  SortedSetFetchByRankCallOptions,
  SortedSetFetchByScoreCallOptions,
} from '../utils';

export type LeaderboardGetElementsByRankRangeOptions = SortedSetFetchByRankCallOptions;
export type LeaderboardGetElementsByScoreRangeOptions = SortedSetFetchByScoreCallOptions;

export interface ILeaderboardClient {
    leaderboardDelete(
      cacheName: string,
      leaderboardName: string
    ): Promise<CacheLeaderboardDelete.Response>;
    leaderboardLength(
      cacheName: string,
      leaderboardName: string
    ): Promise<CacheLeaderboardLength.Response>;
    leaderboardUpsert(
      cacheName: string,
      leaderboardName: string,
      elements: Map<bigint, number>
    ): Promise<CacheLeaderboardUpsert.Response>;
    leaderboardGetElementsByRankRange(
      cacheName: string,
      leaderboardName: string,
      options?: LeaderboardGetElementsByRankRangeOptions
    ): Promise<CacheLeaderboardGetElementsByRankRange.Response>;
    leaderboardGetElementRank(
      cacheName: string,
      leaderboardName: string,
      elementId: bigint
    ): Promise<CacheLeaderboardGetElementRank.Response>;
    leaderboardRemoveElements(
      cacheName: string,
      leaderboardName: string,
      elementIds: Array<bigint>
    ): Promise<CacheLeaderboardRemoveElements.Response>;
    leaderboardGetElementsByScoreRange(
      cacheName: string,
      leaderboardName: string,
      options?: LeaderboardGetElementsByScoreRangeOptions
    ): Promise<CacheLeaderboardGetElementsByScoreRange.Response>;
}