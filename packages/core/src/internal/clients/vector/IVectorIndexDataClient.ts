import {
  VectorAddItemBatch,
  VectorDeleteItemBatch,
  VectorSearch,
} from '../../../messages/responses/vector';
import {VectorIndexItem} from '../../../messages/vector-index';
import {SearchOptions} from '../../../clients/IVectorIndexClient';

export interface IVectorIndexDataClient {
  addItemBatch(
    indexName: string,
    items: Array<VectorIndexItem>
  ): Promise<VectorAddItemBatch.Response>;
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
