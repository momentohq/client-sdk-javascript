import {IVectorIndexControlClient} from '../internal/clients';
import {
  VectorUpsertItemBatch,
  VectorDeleteItemBatch,
  VectorSearch,
} from '../messages/responses/vector';
import {VectorIndexItem} from '../messages/vector-index';

/**
 * A special value to request all metadata fields.
 */
export const ALL_VECTOR_METADATA = Symbol('ALL_VECTOR_METADATA');

/**
 * Options for the search operation.
 */
export interface SearchOptions {
  /**
   * The number of results to return. Defaults to 10.
   */
  topK?: number;
  /**
   * A list of metadata fields to return with each result,
   * or a value indicating all metadata should be returned. If not provided, no metadata is returned. Defaults to None.
   */
  metadataFields?: Array<string> | typeof ALL_VECTOR_METADATA;
  /**
   * A score threshold to filter results by. The threshold is exclusive. Defaults to no threshold.
   * - For cosine similarity and inner product, scores lower than the threshold
   *   are excluded.
   * - For euclidean similarity, scores higher than the threshold
   *   are excluded.
   */
  scoreThreshold?: number;
}

export interface IVectorIndexClient extends IVectorIndexControlClient {
  upsertItemBatch(
    indexName: string,
    items: Array<VectorIndexItem>
  ): Promise<VectorUpsertItemBatch.Response>;

  search(
    indexName: string,
    queryVector: Array<number>,
    options?: SearchOptions
  ): Promise<VectorSearch.Response>;

  deleteItemBatch(
    indexName: string,
    ids: Array<string>
  ): Promise<VectorDeleteItemBatch.Response>;
}
