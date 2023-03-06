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
