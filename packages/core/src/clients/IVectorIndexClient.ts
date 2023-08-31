import {IVectorIndexControlClient} from '../internal/clients';
import {
  VectorAddItemBatch,
  VectorDeleteItemBatch,
  VectorSearch,
} from '../messages/responses/vector';
import {VectorIndexItem} from '../messages/vector-index';

export interface SearchOptions {
  topK?: number;
  metadataFields?: Array<string>;
}

export interface IVectorIndexClient extends IVectorIndexControlClient {
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
