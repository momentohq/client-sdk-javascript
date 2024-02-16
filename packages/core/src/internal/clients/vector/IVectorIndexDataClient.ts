import {
  VectorCountItems,
  VectorDeleteItemBatch,
  VectorGetItemBatch,
  VectorGetItemMetadataBatch,
  VectorSearch,
  VectorSearchAndFetchVectors,
  VectorUpsertItemBatch,
} from '../../../messages/responses/vector';
import {VectorIndexItem} from '../../../messages/vector-index';
import {SearchOptions} from '../../../clients/IVectorIndexClient';
import {VectorFilterExpression} from '../../../messages/vector-index-filters';

export interface IVectorIndexDataClient {
  countItems(indexName: string): Promise<VectorCountItems.Response>;

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
    filter: VectorFilterExpression | Array<string>
  ): Promise<VectorDeleteItemBatch.Response>;

  getItemBatch(
    indexName: string,
    filter: Array<string>
  ): Promise<VectorGetItemBatch.Response>;

  getItemMetadataBatch(
    indexName: string,
    filter: Array<string>
  ): Promise<VectorGetItemMetadataBatch.Response>;
}
