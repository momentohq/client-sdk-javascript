import {CreateCache, DeleteCache, ListCaches} from '../../../index';
import {ICacheClient} from './ICacheClient';
import {IControlClient} from './IControlClient';

export abstract class AbstractCacheClient implements ICacheClient {
  private readonly controlClient: IControlClient;

  constructor(controlClient: IControlClient) {
    this.controlClient = controlClient;
  }

  /**
   * Creates a cache if it does not exist.
   *
   * @param {string} cacheName - The cache to be created.
   * @returns {Promise<CreateCache.Response>} -
   * {@link CreateCache.Success} on success.
   * {@link CreateCache.AlreadyExists} if the cache already exists.
   * {@link CreateCache.Error} on failure.
   */
  public async createCache(cacheName: string): Promise<CreateCache.Response> {
    return await this.controlClient.createCache(cacheName);
  }

  /**
   * Deletes a cache and all items stored in it.
   *
   * @param {string} cacheName - The cache to delete.
   * @returns {Promise<DeleteCache.Response>} -
   * {@link DeleteCache.Success} on success.
   * {@link DeleteCache.Error} on failure.
   */
  public async deleteCache(cacheName: string): Promise<DeleteCache.Response> {
    return await this.controlClient.deleteCache(cacheName);
  }

  /**
   * Lists all caches.
   *
   * @returns {Promise<ListCaches.Response>} -
   * {@link ListCaches.Success} containing the list on success.
   * {@link ListCaches.Error} on failure.
   */
  public async listCaches(): Promise<ListCaches.Response> {
    return await this.controlClient.listCaches();
  }
}
