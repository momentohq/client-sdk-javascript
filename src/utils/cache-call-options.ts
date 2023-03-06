import {CollectionTtl} from './collection-ttl';

export interface ScalarCallOptions {
  /**
   * The time to live in seconds of the object being modified.
   */
  ttl?: number;
}

export interface CollectionCallOptions {
  /**
   * The length of the TTL and whether it should be refreshed when the collection is modified.
   */
  ttl?: CollectionTtl;
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

export interface SortedSetFetchByIndexCallOptions {
  /**
   * The index of the first element to return, inclusive.
   * If negative, the index is relative to the end of the list.
   * If the index is not specified, the first element is used.
   */
  startIndex?: number;
  /**
   * The index of the last element to return, exclusive.
   * If negative, the index is relative to the end of the list.
   * If the index is not specified, the range extends to the end of the list.
   */
  endIndex?: number;
  /**
   * The order in which to return the elements.
   * If the order is not specified, the elements are returned in ascending order.
   * If descending order is used, the start and end indexes are interpreted as if
   * the list were reversed.
   */
  order?: SortedSetOrder;
}

/**
 * An endpoint of a range of scores.
 */
export interface ScoreEndpoint {
  /**
   * The score of the endpoint.
   * If the score is not specified, the range extends to include +/- infinity.
   * That is, if the minimum score is not specified, the range extends to always include
   * the extreme value in that direction, regardless of the inclusive flag.
   */
  score?: number;
  /**
   * Whether the endpoint is inclusive, ie whether the score is included in the range.
   * Defaults to true.
   */
  inclusive?: boolean;
}

export interface SortedSetFetchByScoreCallOptions {
  /**
   * The minimum score of the elements to return and whether it is inclusive.
   * Defaults to extending to including the lowest score.
   */
  minScore?: ScoreEndpoint;
  /**
   * The maximum score of the elements to return and whether it is inclusive.
   * Defaults to extending to including the highest score.
   */
  maxScore?: ScoreEndpoint;
  /**
   * The order in which to return the elements.
   * If the order is not specified, the elements are returned in ascending order.
   */
  order?: SortedSetOrder;
}
