import {CreateIndex, ListIndexes, DeleteIndex} from '../../../index';

export interface IVectorControlClient {
  createIndex(
    indexName: string,
    numDimensions: number
  ): Promise<CreateIndex.Response>;
  listIndexes(): Promise<ListIndexes.Response>;
  deleteIndex(indexName: string): Promise<DeleteIndex.Response>;
}
