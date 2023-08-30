import {
  CreateVectorIndex,
  DeleteVectorIndex,
  ListVectorIndexes,
} from '../../../messages/responses/vector';

export interface IVectorControlClient {
  createIndex(
    indexName: string,
    numDimensions: number
  ): Promise<CreateVectorIndex.Response>;
  listIndexes(): Promise<ListVectorIndexes.Response>;
  deleteIndex(indexName: string): Promise<DeleteVectorIndex.Response>;
}
