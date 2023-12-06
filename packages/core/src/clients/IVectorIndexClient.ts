import {IVectorIndexControlClient} from '../internal/clients';
import {
  VectorUpsertItemBatch,
  VectorDeleteItemBatch,
  VectorSearch,
  VectorSearchAndFetchVectors,
  VectorGetItemBatch,
  VectorGetItemMetadataBatch,
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

  searchAndFetchVectors(
    indexName: string,
    queryVector: Array<number>,
    options?: SearchOptions
  ): Promise<VectorSearchAndFetchVectors.Response>;

  deleteItemBatch(
    indexName: string,
    ids: Array<string>
  ): Promise<VectorDeleteItemBatch.Response>;

  getItemBatch(
    indexName: string,
    ids: Array<string>
  ): Promise<VectorGetItemBatch.Response>;

  getItemMetadataBatch(
    indexName: string,
    ids: Array<string>,
    metadataFields?: Array<string>
  ): Promise<VectorGetItemMetadataBatch.Response>;
}
