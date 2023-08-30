import {
  CreateVectorIndex,
  DeleteVectorIndex,
  ListVectorIndexes,
} from '../../..';
import {IVectorClient} from '../../../clients/IVectorClient';
import {IVectorControlClient} from './IVectorControlClient';

export abstract class AbstractVectorClient implements IVectorClient {
  protected readonly controlClient: IVectorControlClient;

  protected constructor(controlClient: IVectorControlClient) {
    this.controlClient = controlClient;
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
}
