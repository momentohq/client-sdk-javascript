import {vector} from '../../../index';

export interface IVectorControlClient {
  createIndex(
    indexName: string,
    numDimensions: number
  ): Promise<vector.CreateVectorIndex.Response>;
  listIndexes(): Promise<vector.ListVectorIndexes.Response>;
  deleteIndex(indexName: string): Promise<vector.DeleteVectorIndex.Response>;
}
