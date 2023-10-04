import {
  CreateVectorIndex,
  DeleteVectorIndex,
  ListVectorIndexes,
  VectorUpsertItemBatch,
  VectorSearch,
  VectorDeleteItemBatch,
} from '../../..';
import {
  IVectorIndexClient,
  SearchOptions,
} from '../../../clients/IVectorIndexClient';
import {
  IVectorIndexControlClient,
  SimilarityMetric,
} from './IVectorIndexControlClient';
import {VectorIndexItem} from '../../../messages/vector-index';
import {IVectorIndexDataClient} from './IVectorIndexDataClient';

export abstract class AbstractVectorIndexClient
  implements IVectorIndexClient, IVectorIndexDataClient
{
  protected readonly controlClient: IVectorIndexControlClient;
  protected readonly dataClient: IVectorIndexDataClient;

  protected constructor(
    controlClient: IVectorIndexControlClient,
    dataClient: IVectorIndexDataClient
  ) {
    this.controlClient = controlClient;
    this.dataClient = dataClient;
  }

  /**
   * Creates a vector index if it does not exist.
   *
   * Remark on the choice of similarity metric:
   * - Cosine similarity is appropriate for most embedding models as they tend to be optimized
   *     for this metric.
   * - If the vectors are unit normalized, cosine similarity is equivalent to inner product.
   *     If your vectors are already unit normalized, you can use inner product to improve
   *     performance.
   * - Euclidean similarity, the sum of squared differences, is appropriate for datasets where
   *     this metric is meaningful. For example, if the vectors represent images, and the
   *     embedding model is trained to optimize the euclidean distance between images, then
   *     euclidean similarity is appropriate.
   *
   * @param {string} indexName - The vector index to be created.
   * @param {number} numDimensions - Number of dimensions per vector.
   * @param {SimilarityMetric} similarityMetric - The metric used to
   * quantify the distance between vectors. Can be cosine similarity,
   * inner product, or euclidean similarity. Defaults to cosine similarity.
   * @returns {Promise<CreateVectorIndex.Response>} -
   * {@link CreateVectorIndex.Success} on success.
   * {@link CreateVectorIndex.AlreadyExists} if the cache already exists.
   * {@link CreateVectorIndex.Error} on failure.
   */
  public async createIndex(
    indexName: string,
    numDimensions: number,
    similarityMetric?: SimilarityMetric
  ): Promise<CreateVectorIndex.Response> {
    return await this.controlClient.createIndex(
      indexName,
      numDimensions,
      similarityMetric
    );
  }

  /**
   * Lists all vector indexes.
   *
   * @returns {Promise<ListVectorIndexes.Response>} -
   * {@link ListVectorIndexes.Success} containing the list on success.
   * {@link ListVectorIndexes.Error} on error.
   */
  public async listIndexes(): Promise<ListVectorIndexes.Response> {
    return await this.controlClient.listIndexes();
  }

  /**
   * Deletes a vector index and all the vectors stored in it.
   *
   * @param {string} indexName - The name of the vector index to delete.
   * @returns {Promise<DeleteVectorIndex.Response>} -
   * {@link DeleteVectorIndex.Success} on success.
   * {@link DeleteVectorIndex.Error} on error.
   */
  public async deleteIndex(
    indexName: string
  ): Promise<DeleteVectorIndex.Response> {
    return await this.controlClient.deleteIndex(indexName);
  }

  /**
   * Upserts a batch of items into a vector index.
   *
   * If an item with the same ID already exists in the index, it will be replaced.
   * Otherwise, it will be added to the index.
   *
   * @param {string} indexName - Name of the index to upsert the items into.
   * @param {Array<VectorIndexItem>} items - The items to be upserted into the index.
   * @returns {Promise<VectorUpsertItemBatch.Response>} -
   * {@link VectorUpsertItemBatch.Success} on success.
   * {@link VectorUpsertItemBatch.Error} on error.
   */
  public async upsertItemBatch(
    indexName: string,
    items: Array<VectorIndexItem>
  ): Promise<VectorUpsertItemBatch.Response> {
    return await this.dataClient.upsertItemBatch(indexName, items);
  }

  /**
   * Searches for the most similar vectors to the query vector in the index.
   * Ranks the vectors in the index by maximum inner product to the query vector.
   * If the index and query vectors are unit normalized, this is equivalent to
   * ranking by cosine similarity. Hence, to perform a cosine similarity search,
   * the index vectors should be unit normalized prior to indexing, and the query
   * vector should be unit normalized prior to searching.
   *
   * @param {string} indexName - Name of the index to search in.
   * @param {Array<number>} queryVector - The vector to search for.
   * @param {SearchOptions} options - Optional search arguments,
   * including max number of results and which metadata to return.
   * @returns {Promise<VectorSearch.Response>}
   */
  public async search(
    indexName: string,
    queryVector: Array<number>,
    options?: SearchOptions
  ): Promise<VectorSearch.Response> {
    return await this.dataClient.search(indexName, queryVector, options);
  }

  /**
   * Deletes a batch of items from a vector index.
   * Deletes any and all items with the given IDs from the index.
   *
   * @param {string} indexName - Name of the index to delete the items from.
   * @param {Array<string>} ids - The IDs of the items to be deleted from the index.
   * @returns {Promise<VectorDeleteItemBatch.Response>}
   */
  public async deleteItemBatch(
    indexName: string,
    ids: Array<string>
  ): Promise<VectorDeleteItemBatch.Response> {
    return await this.dataClient.deleteItemBatch(indexName, ids);
  }
}
