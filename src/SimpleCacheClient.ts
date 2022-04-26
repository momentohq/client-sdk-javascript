import {Momento} from './Momento';
import {MomentoCache} from './MomentoCache';
import {decodeJwt} from './utils/jwt';
import {SetResponse} from './messages/SetResponse';
import {GetResponse} from './messages/GetResponse';
import {CreateCacheResponse} from './messages/CreateCacheResponse';
import {DeleteCacheResponse} from './messages/DeleteCacheResponse';
import {ListCachesResponse} from './messages/ListCachesResponse';
import {DeleteResponse} from './messages/DeleteResponse';

export class SimpleCacheClient {
  private readonly dataClient: MomentoCache;
  private readonly controlClient: Momento;

  /**
   * @param {string} authToken
   * @param {number} defaultTtlSeconds
   * @param {number} requestTimeoutMs
   */
  constructor(
    authToken: string,
    defaultTtlSeconds: number,
    requestTimeoutMs?: number
  ) {
    const claims = decodeJwt(authToken);
    const controlEndpoint = claims.cp;
    const dataEndpoint = claims.c;
    this.dataClient = new MomentoCache({
      authToken,
      defaultTtlSeconds,
      endpoint: dataEndpoint,
      requestTimeoutMs: requestTimeoutMs,
    });

    this.controlClient = new Momento({
      endpoint: controlEndpoint,
      authToken,
    });
  }

  /**
   * @param {string} cacheName
   * @param {string | Uint8Array} key
   * @returns Promise<GetResponse>
   */
  public async get(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<GetResponse> {
    return await this.dataClient.get(cacheName, key);
  }

  /**
   * @param {string} cacheName
   * @param {string | Uint8Array} key
   * @param {string | Uint8Array} value
   * @param {number=} ttl - time to live in cache, in seconds
   * @returns Promise<SetResponse>
   */
  public async set(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    ttl?: number
  ): Promise<SetResponse> {
    return await this.dataClient.set(cacheName, key, value, ttl);
  }

  /**
   * @param {string} cacheName
   * @param {string | Uint8Array} key
   * @returns Promise<DeleteResponse>
   */
  public async delete(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<DeleteResponse> {
    return await this.dataClient.delete(cacheName, key);
  }

  /**
   * creates a new cache in your Momento account
   * @param {string} cacheName - cache name to create
   * @returns Promise<CreateCacheResponse>
   */
  public async createCache(cacheName: string): Promise<CreateCacheResponse> {
    return await this.controlClient.createCache(cacheName);
  }

  /**
   * deletes a cache and all the items within it
   * @param {string} cacheName - name of cache to delete
   * @returns Promise<DeleteCacheResponse>
   */
  public async deleteCache(cacheName: string): Promise<DeleteCacheResponse> {
    return await this.controlClient.deleteCache(cacheName);
  }

  /**
   * list all caches
   * nextToken is used to handle large paginated lists
   * @param {string | undefined} nextToken - token to continue paginating through the list
   * @returns Promise<ListCacheResponse>
   */
  public async listCaches(nextToken?: string): Promise<ListCachesResponse> {
    return await this.controlClient.listCaches(nextToken);
  }
}
