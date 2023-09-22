import {
  LeaderboardDelete,
  LeaderboardFetch,
  LeaderboardGetRank,
  LeaderboardLength,
  LeaderboardRemoveElements,
  LeaderboardUpsert,
} from '../messages/responses/leaderboard';
import {
  SortedSetFetchByRankCallOptions,
  SortedSetFetchByScoreCallOptions,
} from '../utils';

export type LeaderboardFetchByRankOptions = SortedSetFetchByRankCallOptions;
export type LeaderboardFetchByScoreOptions = SortedSetFetchByScoreCallOptions;

export interface ILeaderboardClient {
  leaderboardUpsert(
    cacheName: string,
    leaderboardName: string,
    elements: Map<bigint, number>
  ): Promise<LeaderboardUpsert.Response>;
  leaderboardFetchByScore(
    cacheName: string,
    leaderboardName: string,
    options?: LeaderboardFetchByScoreOptions
  ): Promise<LeaderboardFetch.Response>;
  leaderboardFetchByRank(
    cacheName: string,
    leaderboardName: string,
    options?: LeaderboardFetchByRankOptions
  ): Promise<LeaderboardFetch.Response>;
  leaderboardGetRank(
    cacheName: string,
    leaderboardName: string,
    elementId: bigint
  ): Promise<LeaderboardGetRank.Response>;
  leaderboardLength(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardLength.Response>;
  leaderboardRemoveElements(
    cacheName: string,
    leaderboardName: string,
    elementIds: Array<bigint>
  ): Promise<LeaderboardRemoveElements.Response>;
  leaderboardDelete(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardDelete.Response>;
}
