import {
  CreateVectorIndex,
  DeleteVectorIndex,
  ListVectorIndexes,
} from '../../../messages/responses/vector';

/**
 * The similarity metric to use when comparing vectors in the index.
 */
export enum SimilarityMetric {
  /**
   * The cosine similarity between two vectors, ie the cosine of the angle between them.
   * Bigger is better. Ranges from -1 to 1.
   */
  COSINE_SIMILARITY,

  /**
   * The inner product between two vectors, ie the sum of the element-wise products.
   * Bigger is better. Ranges from 0 to infinity.
   */
  INNER_PRODUCT,

  /**
   * The Euclidean distance squared between two vectors, ie the sum of squared differences between each element.
   * Smaller is better. Ranges from 0 to infinity.
   */
  EUCLIDEAN_SIMILARITY,
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
