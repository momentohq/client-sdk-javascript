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
 * @param {number} topK - The number of results to return. Defaults to 10.
 * @param {Array<string>} metadataFields - A list of metadata fields to return with each result,
 * or a value indicating all metadata should be returned. If not provided, no metadata is returned. Defaults to None.
 */
export interface SearchOptions {
  topK?: number;
  metadataFields?: Array<string> | typeof ALL_VECTOR_METADATA;
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
