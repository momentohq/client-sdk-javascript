/**
 * An item to upsert into the vector index.
 */
export interface VectorIndexItem {
  /**
   * The ID of the item.
   */
  id: string;
  /**
   * The vector of the item.
   */
  vector: Array<number>;
  /**
   * The metadata of the item, if any.
   */
  metadata?: Record<string, string | number | boolean | Array<string>>;
}

/**
 * An item stored in the vector index.
 *
 * @remarks Specifying metadata is optional when upserting with
 * `VectorIndexItem` but it is always returned when fetching items.
 * Ie we know with certainty that `metadata` is not undefined.
 */
export interface VectorIndexStoredItem {
  /**
   * The ID of the item.
   */
  id: string;
  /**
   * The vector of the item.
   */
  vector: Array<number>;
  /**
   * The metadata of the item.
   */
  metadata: Record<string, string | number | boolean | Array<string>>;
}
