import {validateTtlSeconds} from '../internal/utils';

/** Represents the desired behavior for managing the TTL on collection
 *  objects (dictionaries, lists, sets) in your cache.
 *
 *  For cache operations that modify a collection, there are a few things
 *  to consider.  The first time the collection is created, we need to
 *  set a TTL on it.  For subsequent operations that modify the collection
 *  you may choose to update the TTL in order to prolong the life of the
 *  cached collection object, or you may choose to leave the TTL unmodified
 *  in order to ensure that the collection expires at the original TTL.
 *
 *  The default behavior is to refresh the TTL (to prolong the life of the
 *  collection) each time it is written.  This behavior can be modified
 *  by calling CollectionTtl.withNoRefreshTtlOnUpdates().
 *
 *  A null TTL means to use the client's TTL.
 */
export class CollectionTtl {
  private readonly _ttlSeconds: number | null;
  private readonly _refreshTtl: boolean;

  /**
   * If refreshTtl is true, the client must update the collection's TTL
   * when it modifies a collection.
   * A null ttl means to use the client's TTL.
   * @param {number | null} [ttlSeconds=null]
   * @param {boolean} [refreshTtl=true]
   */
  constructor(ttlSeconds: number | null = null, refreshTtl = true) {
    if (ttlSeconds !== null) {
      validateTtlSeconds(ttlSeconds);
    }
    this._refreshTtl = refreshTtl;
    this._ttlSeconds = ttlSeconds;
  }

  /** Time-to-live, in seconds.
   * @returns {number | null}
   */
  public ttlSeconds(): number | null {
    return this._ttlSeconds;
  }

  /** Time-to-live, in milliseconds.
   * @returns {number | null}
   */
  public ttlMilliseconds(): number | null {
    return this._ttlSeconds === null ? null : this._ttlSeconds * 1000;
  }

  /** Whether or not to refresh a collection's TTL when it's modified.
   * @returns {boolean}
   */
  public refreshTtl(): boolean {
    return this._refreshTtl;
  }

  /** The default way to handle TTLs for collections. The client's default TTL
   *  will be used, and the TTL for the collection will be refreshed any
   *  time the collection is modified.
   * @constructor
   * @returns {CollectionTtl}
   */
  public static fromCacheTtl(): CollectionTtl {
    return new CollectionTtl(null, true);
  }

  /** Constructs a CollectionTtl with the specified TTL. The TTL
   *  for the collection will be refreshed any time the collection is
   *  modified.
   * @constructor
   * @param {number} [ttlSeconds]
   * @returns {CollectionTtl}
   */
  public static of(ttlSeconds: number): CollectionTtl {
    return new CollectionTtl(ttlSeconds, true);
  }

  /** Constructs a CollectionTtl with the specified TTL.
   *  Will only refresh if the TTL is provided.
   * @constructor
   * @param {number | null} [ttlSeconds=null]
   * @returns {CollectionTtl}
   */
  public static refreshTtlIfProvided(
    ttlSeconds: number | null = null
  ): CollectionTtl {
    return new CollectionTtl(ttlSeconds, ttlSeconds !== null);
  }

  /** Copies the CollectionTtl, but it will refresh the TTL when
   *  the collection is modified.
   * @returns {CollectionTtl}
   */
  public withRefreshTtlOnUpdates(): CollectionTtl {
    return new CollectionTtl(this._ttlSeconds, true);
  }

  /** Copies the CollectionTTL, but the TTL will not be refreshed
   *  when the collection is modified. Use this if you want to ensure
   *  that your collection expires at the originally specified time, even
   *  if you make modifications to the value of the collection.
   * @returns {CollectionTtl}
   */
  public withNoRefreshTtlOnUpdates(): CollectionTtl {
    return new CollectionTtl(this._ttlSeconds, false);
  }

  /** A string represenation of the CollectionTtl for debugging purposes.
   * @return {CollectionTtl}
   */
  public toString(): string {
    return `ttl: ${this._ttlSeconds || 'null'}, refreshTtl: ${
      this._refreshTtl ? 'true' : 'false'
    }`;
  }
}
