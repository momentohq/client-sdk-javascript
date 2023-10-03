import {
  CreateVectorIndex,
  DeleteVectorIndex,
  ListVectorIndexes,
} from '../../../messages/responses/vector';

export enum SimilarityMetric {
  COSINE_SIMILARITY,
  INNER_PRODUCT,
  EUCLIDIAN_DISTANCE,
}

export interface IVectorIndexControlClient {
  createIndex(
    indexName: string,
    numDimensions: number,
    similarityMetric?: SimilarityMetric
  ): Promise<CreateVectorIndex.Response>;
  listIndexes(): Promise<ListVectorIndexes.Response>;
  deleteIndex(indexName: string): Promise<DeleteVectorIndex.Response>;
}
