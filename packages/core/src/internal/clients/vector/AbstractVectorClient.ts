import {IVectorClient} from '../../../clients/IVectorClient';
import {IVectorControlClient} from './IVectorControlClient';
import {CreateIndex, ListIndexes, DeleteIndex} from '../../../index';

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
   * @returns {Promise<CreateIndex.Response>} -
   * {@link CreateIndex.Success} on success.
   * {@link CreateIndex.AlreadyExists} if the cache already exists.
   * {@link CreateIndex.Error} on failure.
   */
  public async createIndex(
    indexName: string,
    numDimensions: number
  ): Promise<CreateIndex.Response> {
    return await this.controlClient.createIndex(indexName, numDimensions);
  }

  /**
   * Lists all vector indexes.
   *
   * @returns {Promise<ListIndexes.Response>} -
   * {@link ListIndexes.Success} containing the list on success.
   * {@link ListIndexes.Error} on error.
   */
  public async listIndexes(): Promise<ListIndexes.Response> {
    return await this.controlClient.listIndexes();
  }

  /**
   * Deletes a vector index and all the vectors stored in it.
   *
   * @param {string} indexName - The name of the vector index to delete.
   * @returns {Promise<DeleteIndex.Response>} -
   * {@link DeleteIndex.Success} on success.
   * {@link DeleteIndex.Error} on error.
   */
  public async deleteIndex(indexName: string): Promise<DeleteIndex.Response> {
    return await this.controlClient.deleteIndex(indexName);
  }
}
