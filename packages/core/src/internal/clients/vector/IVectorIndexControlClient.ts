import {
  CreateVectorIndex,
  DeleteVectorIndex,
  ListVectorIndexes,
} from '../../../messages/responses/vector';

export interface IVectorIndexControlClient {
  createIndex(
    indexName: string,
    numDimensions: number
  ): Promise<CreateVectorIndex.Response>;
  listIndexes(): Promise<ListVectorIndexes.Response>;
  deleteIndex(indexName: string): Promise<DeleteVectorIndex.Response>;
}
