import {CollectionTtl} from './collection-ttl';

export interface SingleCallOptions {
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
  truncateFrontToSize?: number; //separate front and back
}

export interface BackTruncatableCallOptions extends CollectionCallOptions {
  /**
   * If the collection exceeds this length, remove excess from the end of the list. Must be positive.
   */
  truncateBackToSize?: number; //separate front and back
}
