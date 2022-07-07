import {Momento} from './Momento';
import {MomentoCache} from './MomentoCache';
import {decodeJwt} from './utils/jwt';
import {SetResponse} from './messages/SetResponse';
import {GetResponse} from './messages/GetResponse';
import {CreateCacheResponse} from './messages/CreateCacheResponse';
import {DeleteCacheResponse} from './messages/DeleteCacheResponse';
import {ListCachesResponse} from './messages/ListCachesResponse';
import {DeleteResponse} from './messages/DeleteResponse';
import {CreateSigningKeyResponse} from './messages/CreateSigningKeyResponse';
import {RevokeSigningKeyResponse} from './messages/RevokeSigningKeyResponse';
import {ListSigningKeysResponse} from './messages/ListSigningKeysResponse';
import {getLogger, Logger, LoggerOptions} from './utils/logging';

export interface SimpleCacheClientOptions {
  /**
   * @param {number} [requestTimeoutMs] - A timeout in milliseconds for get and set operations
   * to complete. Defaults to 5 seconds. If the request takes longer than this value, it
   * will be terminated and throw a TimeoutError.
   */
  requestTimeoutMs?: number;
  /**
   * @param {LoggerOptions} [loggerOptions] - optional configuration settings to control logging
   * output.
   */
  loggerOptions?: LoggerOptions;
}

/**
 * Momento Simple Cache Client.
 *
 * Features include:
 * - Get, set, and delete data
 * - Create, delete, and list caches
 * - Create, revoke, and list signing keys
 * @export
 * @class SimpleCacheClient
 */
export class SimpleCacheClient {
  private readonly dataClient: MomentoCache;
  private readonly controlClient: Momento;
  private readonly logger: Logger;

  /**
   * Creates an instance of SimpleCacheClient.
   * @param {string} authToken - Momento token to authenticate requests with Simple Cache Service.
   * @param {number} defaultTtlSeconds - A default time to live, in seconds, for cache objects
   * created by this client.
   * @param {SimpleCacheClientOptions} options - additional configuration options for the cache client.
   * @memberof SimpleCacheClient
   */
  constructor(
    authToken: string,
    defaultTtlSeconds: number,
    options?: SimpleCacheClientOptions
  ) {
    this.logger = getLogger(this, options?.loggerOptions);
    const claims = decodeJwt(authToken);
    const controlEndpoint = claims.cp;
    const dataEndpoint = claims.c;
    this.dataClient = new MomentoCache({
      authToken,
      defaultTtlSeconds,
      endpoint: dataEndpoint,
      requestTimeoutMs: options?.requestTimeoutMs,
      loggerOptions: options?.loggerOptions,
    });

    this.controlClient = new Momento({
      endpoint: controlEndpoint,
      authToken,
      loggerOptions: options?.loggerOptions,
    });
  }

  /**
   * Get the cache value stored for the given key.
   * @param {string} cacheName - Name of the cache to perform the lookup in.
   * @param {(string | Uint8Array)} key - The key to lookup.
   * @returns {Promise<GetResponse>} - Promise containing the status
   * of the get operation (hit or miss) and the associated value.
   * @memberof SimpleCacheClient
   */
  public async get(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<GetResponse> {
    return await this.dataClient.get(cacheName, key);
  }

  /**
   * Sets the value in cache with a given time to live (TTL) seconds.
   * If a value for this key is already present it will be replaced by the new value.
   * @param {string} cacheName - Name of the cache to store the item in.
   * @param {(string | Uint8Array)} key - The key to set.
   * @param {(string | Uint8Array)} value - The value to be stored.
   * @param {number} [ttl] - Time to live (TTL) for the item in Cache.
   * This TTL takes precedence over the TTL used when initializing a cache client.
   * @returns {Promise<SetResponse>} - Result of the set operation.
   * @memberof SimpleCacheClient
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
   * Remove the key from the cache.
   * @param {string} cacheName - Name of the cache to delete the key from.
   * @param {(string | Uint8Array)} key - The key to delete.
   * @returns {Promise<DeleteResponse>} - Promise containing the result of the
   * delete operation.
   * @memberof SimpleCacheClient
   */
  public async delete(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<DeleteResponse> {
    return await this.dataClient.delete(cacheName, key);
  }

  /**
   * Create a cache if it does not exist.
   * @param {string} cacheName - Name of the cache to be created.
   * @returns {Promise<CreateCacheResponse>} - Promise of the create cache result.
   * @memberof SimpleCacheClient
   */
  public async createCache(cacheName: string): Promise<CreateCacheResponse> {
    return await this.controlClient.createCache(cacheName);
  }

  /**
   * Delete a cache and all items stored in it.
   * @param {string} cacheName - Name of the cache to delete.
   * @returns {Promise<DeleteCacheResponse>} - Promise of the delete cache result.
   * @memberof SimpleCacheClient
   */
  public async deleteCache(cacheName: string): Promise<DeleteCacheResponse> {
    return await this.controlClient.deleteCache(cacheName);
  }

  /**
   * List all caches.
   * @param {string} [nextToken] - A token to specify where to start paginating.
   * This is the NextToken from a previous response.
   * @returns {Promise<ListCacheResponse>} - Promise of the list cache response.
   * Contains the listed caches and a next token to continue listing.
   * @memberof SimpleCacheClient
   */
  public async listCaches(nextToken?: string): Promise<ListCachesResponse> {
    return await this.controlClient.listCaches(nextToken);
  }

  /**
   * Create a Momento signing key.
   * @param {number} ttlMinutes - The time to live in minutes until the Momento signing key expires.
   * @returns {Promise<CreateSigningKeyResponse>} - Promise of create signing key
   * response. Contains endpoint and expiration.
   * @memberof SimpleCacheClient
   */
  public async createSigningKey(
    ttlMinutes: number
  ): Promise<CreateSigningKeyResponse> {
    return await this.controlClient.createSigningKey(
      ttlMinutes,
      this.dataClient.getEndpoint()
    );
  }

  /**
   * Revokes a Momento signing key.
   *
   * All tokens signed by this key will be invalid.
   * @param {string} keyId  - The ID of the Momento signing key to revoke.
   * @returns {Promise<RevokeSigningKeyResponse>} - Revocation response (empty)
   * @memberof SimpleCacheClient
   */
  public async revokeSigningKey(
    keyId: string
  ): Promise<RevokeSigningKeyResponse> {
    return await this.controlClient.revokeSigningKey(keyId);
  }

  /**
   * Lists all Momento signing keys for the provided auth token.
   * @param {string} [nextToken] - Token to continue paginating through the list.
   * @returns {Promise<ListSigningKeysResponse>} - Promise of the list signing keys response.
   * Contains the retrieved signing keys and a next token to continue listing.
   * @memberof SimpleCacheClient
   */
  public async listSigningKeys(
    nextToken?: string
  ): Promise<ListSigningKeysResponse> {
    return await this.controlClient.listSigningKeys(
      this.dataClient.getEndpoint(),
      nextToken
    );
  }
}
