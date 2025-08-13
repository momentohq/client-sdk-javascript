import {CollectionTtl} from './collection-ttl';
export interface ScalarCallOptions {
  /**
   * The time to live in seconds of the object being modified.
   */
  ttl?: number;
}

export interface CompressableCallOptions {
  /**
   * Whether to compress the data.
   */
  compress?: boolean;
}

export interface DecompressableCallOptions {
  /**
   * Whether to decompress the data. Overrides the client-wide automatic decompression setting.
   */
  decompress?: boolean;
}

export interface SetCallOptions
  extends ScalarCallOptions,
    CompressableCallOptions {}
export type SetBatchCallOptions = SetCallOptions;

export type GetCallOptions = DecompressableCallOptions;
export type GetBatchCallOptions = GetCallOptions;

export interface SetIfAbsentCallOptions
  extends ScalarCallOptions,
    CompressableCallOptions {}

export interface CollectionCallOptions {
  /**
   * The length of the TTL and whether it should be refreshed when the collection is modified.
   */
  ttl?: CollectionTtl;
}

/**
 * Returns the TTL from the options or refresh with the cache TTL.
 *
 * @param options The options to get the TTL from.
 * @returns The TTL from the options or a default value.
 */
export function ttlOrFromCacheTtl(
  options?: CollectionCallOptions
): CollectionTtl {
  return options?.ttl ?? CollectionTtl.fromCacheTtl();
}

export interface FrontTruncatableCallOptions extends CollectionCallOptions {
  /**
   * If the collection exceeds this length, remove excess from the start of the list. Must be positive.
   */
  truncateFrontToSize?: number;
}

export interface BackTruncatableCallOptions extends CollectionCallOptions {
  /**
   * If the collection exceeds this length, remove excess from the end of the list. Must be positive.
   */
  truncateBackToSize?: number;
}

export enum SortedSetOrder {
  Ascending = 'ASC',
  Descending = 'DESC',
}

export interface SortedSetFetchByRankCallOptions {
  /**
   * The rank of the first element to return, inclusive.
   * If negative, the rank is relative to the end of the list.
   * If the rank is not specified, the first element is used.
   */
  startRank?: number;
  /**
   * The rank of the last element to return, exclusive.
   * If negative, the rank is relative to the end of the list.
   * If the rank is not specified, the range extends to the end of the list.
   */
  endRank?: number;
  /**
   * The order in which to return the elements.
   * If the order is not specified, the elements are returned in ascending order.
   * If descending order is used, the start and end ranks are interpreted as if
   * the list were reversed.
   */
  order?: SortedSetOrder;
}

export interface SortedSetFetchByScoreCallOptions {
  /**
   * The minimum score of the elements to return, inclusive.
   * If the minimum score is not specified, the range extends to the lowest score.
   */
  minScore?: number;
  /**
   * The maximum score of the elements to return, inclusive.
   * If the maximum score is not specified, the range extends to the highest score.
   */
  maxScore?: number;
  /**
   * The order in which to return the elements.
   * If the order is not specified, the elements are returned in ascending order.
   */
  order?: SortedSetOrder;
  /**
   * The index offset of the first element to return, relative to the first element in the result set.
   * If specified must be non-negative (>= 0).
   * Defaults to zero, ie. the start at first element in the result set.
   */
  offset?: number;
  /**
   * The maximum number of elements to return.
   * If specified must be strictly positive (> 0).
   * Defaults to all elements in the result set.
   */
  count?: number;
}

export interface SortedSetGetRankCallOptions {
  /**
   * The order in which sorted set will be sorted to determine the rank.
   * If the order is not specified, then ascending order is used.
   */
  order?: SortedSetOrder;
}

export interface SortedSetLengthByScoreCallOptions {
  /**
   * The minimum score of the elements to include when counting number of items in the set, inclusive.
   * If the minimum score is not specified, the range extends to the lowest score.
   */
  minScore?: number;
  /**
   * The maximum score of the elements to include when counting number of items in the set, inclusive.
   * If the maximum score is not specified, the range extends to the highest score.
   */
  maxScore?: number;
}
export enum SortedSetAggregate {
  SUM = 0,
  MIN = 1,
  MAX = 2,
}

export interface SortedSetUnionStoreCallOptions {
  /**
   * A function to determine the final score for an element that exists in multiple source sets.
   * If the function is not specified, the aggregate function defaults to SUM.
   */
  aggregate?: SortedSetAggregate;
  /**
   * The time to live in seconds of the object being modified.
   */
  ttl?: CollectionTtl;
}

export interface ListRetainCallOptions extends CollectionCallOptions {
  /**
   * Starting inclusive index of operation.
   */
  startIndex?: number;

  /**
   * Ending exclusive index of operation.
   */
  endIndex?: number;
}
export interface ListFetchCallOptions {
  /**
   * Starting inclusive index of operation.
   */
  startIndex?: number;

  /**
   * Ending exclusive index of operation.
   */
  endIndex?: number;
}

export enum LeaderboardOrder {
  Ascending = 'ASC', // 0 is the lowest-scoring rank
  Descending = 'DESC', // 0 is the highest-scoring rank.
}

export interface LeaderboardGetRankCallOptions {
  /**
   * The order in which to return the elements.
   * If the order is not specified, the elements are returned in ascending order.
   * If descending order is used, the start and end ranks are interpreted as if
   * the leaderboard were reversed.
   */
  order?: LeaderboardOrder;
}

export interface LeaderboardFetchByRankCallOptions {
  /**
   * The order in which to return the elements.
   * If the order is not specified, the elements are returned in ascending order.
   * If descending order is used, the start and end ranks are interpreted as if
   * the leaderboard were reversed.
   */
  order?: LeaderboardOrder;
}

export interface LeaderboardFetchByScoreCallOptions {
  /**
   * The minimum score of the elements to return, inclusive.
   * If the minimum score is not specified, the range extends to the lowest score.
   */
  minScore?: number;
  /**
   * The maximum score of the elements to return, exclusive.
   * If the maximum score is not specified, the range extends to the highest score.
   */
  maxScore?: number;
  /**
   * The order in which to return the elements.
   * If the order is not specified, the elements are returned in ascending order.
   */
  order?: LeaderboardOrder;
  /**
   * The index offset of the first element to return, relative to the first element in the result set.
   * If specified must be non-negative (>= 0).
   * Defaults to zero, ie. the start at first element in the result set.
   */
  offset?: number;
  /**
   * The maximum number of elements to return.
   * If specified must be strictly positive (> 0).
   * Defaults to 8192, the maximum number of elements that can be returned at a time.
   */
  count?: number;
}
