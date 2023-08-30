import {IVectorClient} from '../../../clients/IVectorClient';
import {IVectorControlClient} from './IVectorControlClient';
import {vector} from '../../../index';

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
   * @returns {Promise<vector.CreateVectorIndex.Response>} -
   * {@link vector.CreateVectorIndex.Success} on success.
   * {@link vector.CreateVectorIndex.AlreadyExists} if the cache already exists.
   * {@link vector.CreateVectorIndex.Error} on failure.
   */
  public async createIndex(
    indexName: string,
    numDimensions: number
  ): Promise<vector.CreateVectorIndex.Response> {
    return await this.controlClient.createIndex(indexName, numDimensions);
  }

  /**
   * Lists all vector indexes.
   *
   * @returns {Promise<vector.ListVectorIndexes.Response>} -
   * {@link vector.ListVectorIndexes.Success} containing the list on success.
   * {@link vector.ListVectorIndexes.Error} on error.
   */
  public async listIndexes(): Promise<vector.ListVectorIndexes.Response> {
    return await this.controlClient.listIndexes();
  }

  /**
   * Deletes a vector index and all the vectors stored in it.
   *
   * @param {string} indexName - The name of the vector index to delete.
   * @returns {Promise<vector.DeleteVectorIndex.Response>} -
   * {@link vector.DeleteVectorIndex.Success} on success.
   * {@link vector.DeleteVectorIndex.Error} on error.
   */
  public async deleteIndex(
    indexName: string
  ): Promise<vector.DeleteVectorIndex.Response> {
    return await this.controlClient.deleteIndex(indexName);
  }
}
