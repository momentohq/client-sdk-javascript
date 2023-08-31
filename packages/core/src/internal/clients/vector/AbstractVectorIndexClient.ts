import {
  CreateVectorIndex,
  DeleteVectorIndex,
  ListVectorIndexes,
  VectorAddItemBatch,
  VectorSearch,
  VectorDeleteItemBatch,
} from '../../..';
import {
  IVectorIndexClient,
  SearchOptions,
} from '../../../clients/IVectorIndexClient';
import {IVectorIndexControlClient} from './IVectorIndexControlClient';
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
   * Creates an index if it does not exist.
   *
   * @param {string} indexName - The vector index to be created.
   * @param {number} numDimensions - Number of dimensions per vector.
   * @returns {Promise<CreateVectorIndex.Response>} -
   * {@link CreateVectorIndex.Success} on success.
   * {@link CreateVectorIndex.AlreadyExists} if the cache already exists.
   * {@link CreateVectorIndex.Error} on failure.
   */
  public async createIndex(
    indexName: string,
    numDimensions: number
  ): Promise<CreateVectorIndex.Response> {
    return await this.controlClient.createIndex(indexName, numDimensions);
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
   * Adds a batch of items into a vector index.
   *
   * Adds an item into the index regardless if the ID already exists.
   * On duplicate ID, a separate entry is created with the same ID.
   * To deduplicate, first call `deleteItemBatch` to remove all items
   * with the same ID, then call `addItemBatch` to add the new items.
   *
   * @param {string} indexName - Name of the index to add the items into.
   * @param {Array<VectorIndexItem>} items - The items to be added into the index.
   * @returns {Promise<VectorAddItemBatch.Response>} -
   * {@link VectorAddItemBatch.Success} on success.
   * {@link VectorAddItemBatch.Error} on error.
   */
  public async addItemBatch(
    indexName: string,
    items: Array<VectorIndexItem>
  ): Promise<VectorAddItemBatch.Response> {
    return await this.dataClient.addItemBatch(indexName, items);
  }

  /**
   * Searches for the most similar vectors to the query vector in the index.
   * Ranks the vectors in the index by maximum inner product to the query vector.
   * If the index and query vectors are unit normalized, this is equivalent to
   * ranking by cosine similarity. Hence to perform a cosine similarity search,
   * the index vectors should be unit normalized prior to indexing, and the query
   * vector should be unit normalized prior to searching.
   *
   * @param {string} indexName - Name of the index to search in.
   * @param {Array<number>} queryVector - The vector to search for.
   * @param {number} topK - The number of results to return. Defaults to 10.
   * @param {Array<string>} metadataFields - A list of metadata fields to return with each result.
   *   If not provided, no metadata is returned. Defaults to None.
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
