import {
  VectorUpsertItemBatch,
  VectorDeleteItemBatch,
  VectorSearch,
  VectorSearchAndFetchVectors,
  VectorGetItemBatch,
  VectorGetItemMetadataBatch,
} from '../../../messages/responses/vector';
import {VectorIndexItem} from '../../../messages/vector-index';
import {SearchOptions} from '../../../clients/IVectorIndexClient';

export interface IVectorIndexDataClient {
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
    ids: Array<string>
  ): Promise<VectorGetItemMetadataBatch.Response>;
}
