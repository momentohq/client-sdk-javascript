import {ControlClient} from './internal/control-client';
import {CacheClient} from './internal/cache-client';
import {decodeJwt} from './utils/jwt';
import {SetResponse} from './messages/set-response';
import {GetResponse} from './messages/get-response';
import {CreateCacheResponse} from './messages/create-cache-response';
import {DeleteCacheResponse} from './messages/delete-cache-response';
import {ListCachesResponse} from './messages/list-caches-response';
import {DeleteResponse} from './messages/delete-response';
import {CreateSigningKeyResponse} from './messages/create-signing-key-response';
import {RevokeSigningKeyResponse} from './messages/revoke-signing-key-response';
import {ListSigningKeysResponse} from './messages/list-signing-keys-response';
import {
  getLogger,
  initializeMomentoLogging,
  Logger,
  LoggerOptions,
} from './utils/logging';
import {range} from './utils/collections';

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
  private readonly dataClients: Array<CacheClient>;
  private nextDataClientIndex: number;
  private readonly controlClient: ControlClient;
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
    initializeMomentoLogging(options?.loggerOptions);
    this.logger = getLogger(this);
    const claims = decodeJwt(authToken);
    const controlEndpoint = claims.cp;
    const dataEndpoint = claims.c;

    // For high load, we get better performance with multiple clients.  Here we are setting a default,
    // hard-coded value for the number of clients to use, because we haven't yet designed the API for
    // users to use to configure tunables:
    // https://github.com/momentohq/dev-eco-issue-tracker/issues/85
    // The choice of 6 as the initial value is a rough guess at a reasonable default for the short-term,
    // based on load testing results captured in:
    // https://github.com/momentohq/oncall-tracker/issues/186
    const numClients = 6;
    this.dataClients = range(numClients).map(
      () =>
        new CacheClient({
          authToken,
          defaultTtlSeconds,
          endpoint: dataEndpoint,
          requestTimeoutMs: options?.requestTimeoutMs,
        })
    );
    // we will round-robin the requests through all of our clients.  Since javascript is single-threaded,
    // we don't have to worry about thread safety on this index variable.
    this.nextDataClientIndex = 0;

    this.controlClient = new ControlClient({
      endpoint: controlEndpoint,
      authToken,
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
    const client = this.getNextDataClient();
    return await client.get(cacheName, key);
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
    const client = this.getNextDataClient();
    return await client.set(cacheName, key, value, ttl);
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
    const client = this.getNextDataClient();
    return await client.delete(cacheName, key);
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
    const client = this.getNextDataClient();
    return await this.controlClient.createSigningKey(
      ttlMinutes,
      client.getEndpoint()
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
    const client = this.getNextDataClient();
    return await this.controlClient.listSigningKeys(
      client.getEndpoint(),
      nextToken
    );
  }

  private getNextDataClient(): CacheClient {
    const client = this.dataClients[this.nextDataClientIndex];
    this.nextDataClientIndex =
      (this.nextDataClientIndex + 1) % this.dataClients.length;
    return client;
  }
}
