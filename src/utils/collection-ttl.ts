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
 *  by calling the CollectionTtl.WithNoRefreshTtlOnUpdates
 */
export class CollectionTtl {
  private readonly _ttlSeconds: number | null;
  private readonly _refreshTtl: boolean;

  constructor(ttlSeconds: number | null = null, refreshTtl = true) {
    this._refreshTtl = refreshTtl;
    this._ttlSeconds = ttlSeconds;
  }

  public ttlSeconds(): number | null {
    return this._ttlSeconds;
  }

  public ttlMilliseconds(): number | null {
    return this._ttlSeconds === null ? null : this._ttlSeconds * 1000;
  }

  public refreshTtl(): boolean {
    return this._refreshTtl;
  }

  /** The default way to handle TTLs for collections.  The default TTL
   *  <see cref="TimeSpan"/> that was specified when constructing the <see cref="SimpleCacheClient"/>
   *  will be used, and the TTL for the collection will be refreshed any
   *  time the collection is modified.
   */
  public static fromCacheTtl(): CollectionTtl {
    return new CollectionTtl(null, true);
  }

  /** Constructs a CollectionTtl with the specified <see cref="TimeSpan"/>.  The TTL
   *  for the collection will be refreshed any time the collection is
   *  modified.
   */
  public static of(ttlSeconds: number): CollectionTtl {
    return new CollectionTtl(ttlSeconds, true);
  }

  /** Constructs a <see cref="CollectionTtl"/> with the specified <see cref="TimeSpan"/>.
   *  Will only refresh if the TTL is provided (ie not <see langword="null" />).
   */
  public static refreshTtlIfProvided(
    ttlSeconds: number | null = null
  ): CollectionTtl {
    return new CollectionTtl(ttlSeconds, ttlSeconds !== null);
  }

  /** Specifies that the TTL for the collection should be refreshed when
   *  the collection is modified.  (This is the default behavior.)
   */
  public withRefreshTtlOnUpdates(): CollectionTtl {
    return new CollectionTtl(this._ttlSeconds, true);
  }

  /** Specifies that the TTL for the collection should not be refreshed
   *  when the collection is modified.  Use this if you want to ensure
   *  that your collection expires at the originally specified time, even
   *  if you make modifications to the value of the collection.
   */
  public withNoRefreshTtlOnUpdates(): CollectionTtl {
    return new CollectionTtl(this._ttlSeconds, false);
  }

  public toString(): string {
    return `ttl: ${this._ttlSeconds || 'null'}, refreshTtl: ${
      this._refreshTtl ? 'true' : 'false'
    }`;
  }
}
