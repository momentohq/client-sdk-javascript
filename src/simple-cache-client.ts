import {ControlClient} from './internal/control-client';
import {CacheClient} from './internal/cache-client';
import * as CreateCache from './messages/responses/create-cache';
import * as ListCaches from './messages/responses/list-caches';
import * as DeleteCache from './messages/responses/delete-cache';
import * as CreateSigningKey from './messages/responses/create-signing-key';
import * as ListSigningKeys from './messages/responses/list-signing-keys';
import * as RevokeSigningKey from './messages/responses/revoke-signing-key';
import * as CacheGet from './messages/responses/cache-get';
import * as CacheDelete from './messages/responses/cache-delete';
import * as CacheSet from './messages/responses/cache-set';
import * as CacheSetFetch from './messages/responses/cache-set-fetch';
import {getLogger, Logger} from './utils/logging';
import {range} from './utils/collections';
import {SimpleCacheConfiguration} from './config/configuration';
import {CredentialProvider} from './auth/credential-provider';
import {SimpleCacheClientProps} from './simple-cache-client-props';

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
  private readonly configuration: SimpleCacheConfiguration;
  private readonly credentialProvider: CredentialProvider;
  private readonly dataClients: Array<CacheClient>;
  private nextDataClientIndex: number;
  private readonly controlClient: ControlClient;
  private readonly logger: Logger;

  /**
   * Creates an instance of SimpleCacheClient.
   */
  constructor(props: SimpleCacheClientProps) {
    this.logger = getLogger(this);
    this.configuration = props.configuration;
    this.credentialProvider = props.credentialProvider;

    // For high load, we get better performance with multiple clients.  Here we are setting a default,
    // hard-coded value for the number of clients to use, because we haven't yet designed the API for
    // users to use to configure tunables:
    // https://github.com/momentohq/dev-eco-issue-tracker/issues/85
    // The choice of 6 as the initial value is a rough guess at a reasonable default for the short-term,
    // based on load testing results captured in:
    // https://github.com/momentohq/oncall-tracker/issues/186
    const numClients = 6;
    this.dataClients = range(numClients).map(() => new CacheClient(props));
    // we will round-robin the requests through all of our clients.  Since javascript is single-threaded,
    // we don't have to worry about thread safety on this index variable.
    this.nextDataClientIndex = 0;

    this.controlClient = new ControlClient({
      configuration: this.configuration,
      credentialProvider: this.credentialProvider,
    });
  }

  /**
   * Get the cache value stored for the given key.
   * @param {string} cacheName - Name of the cache to perform the lookup in.
   * @param {(string | Uint8Array)} key - The key to lookup.
   * @returns {Promise<CacheGet.Response>} - Promise containing the status
   * of the get operation (hit or miss) and the associated value.
   * @memberof SimpleCacheClient
   */
  public async get(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<CacheGet.Response> {
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
   * @returns {Promise<CacheSet.Response>} - Result of the set operation.
   * @memberof SimpleCacheClient
   */
  public async set(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    ttl?: number
  ): Promise<CacheSet.Response> {
    const client = this.getNextDataClient();
    return await client.set(cacheName, key, value, ttl);
  }

  /**
   * Remove the key from the cache.
   * @param {string} cacheName - Name of the cache to delete the key from.
   * @param {(string | Uint8Array)} key - The key to delete.
   * @returns {Promise<CacheDelete.Response>} - Promise containing the result of the
   * delete operation.
   * @memberof SimpleCacheClient
   */
  public async delete(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<CacheDelete.Response> {
    const client = this.getNextDataClient();
    return await client.delete(cacheName, key);
  }

  /**
   * Fetch the entire set from the cache.
   * @param {string} cacheName - Name of the cache to perform the lookup in.
   * @param {string} setName - The set to fetch.
   * @returns Promise<SetFetch.Response> - Promise containing the result of the fetch operation and the associated set.
   * @memberof SimpleCacheClient
   */
  public async setFetch(
    cacheName: string,
    setName: string
  ): Promise<CacheSetFetch.Response> {
    const client = this.getNextDataClient();
    return await client.setFetch(cacheName, setName);
  }

  /**
   * Create a cache if it does not exist.
   * @param {string} cacheName - Name of the cache to be created.
   * @returns {Promise<CreateCache.Response>} - Promise of the create cache result.
   * @memberof SimpleCacheClient
   */
  public async createCache(cacheName: string): Promise<CreateCache.Response> {
    return await this.controlClient.createCache(cacheName);
  }

  /**
   * Delete a cache and all items stored in it.
   * @param {string} cacheName - Name of the cache to delete.
   * @returns {Promise<DeleteCache.Response>} - Promise of the delete cache result.
   * @memberof SimpleCacheClient
   */
  public async deleteCache(cacheName: string): Promise<DeleteCache.Response> {
    return await this.controlClient.deleteCache(cacheName);
  }

  /**
   * List all caches.
   * @param {string} [nextToken] - A token to specify where to start paginating.
   * This is the NextToken from a previous response.
   * @returns {Promise<ListCaches.Response>} - Promise of the list cache response.
   * Contains the listed caches and a next token to continue listing.
   * @memberof SimpleCacheClient
   */
  public async listCaches(nextToken?: string): Promise<ListCaches.Response> {
    return await this.controlClient.listCaches(nextToken);
  }

  /**
   * Create a Momento signing key.
   * @param {number} ttlMinutes - The time to live in minutes until the Momento signing key expires.
   * @returns {Promise<CreateSigningKey.Response>} - Promise of create signing key
   * response. Contains endpoint and expiration.
   * @memberof SimpleCacheClient
   */
  public async createSigningKey(
    ttlMinutes: number
  ): Promise<CreateSigningKey.Response> {
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
   * @returns {Promise<RevokeSigningKey.Response>} - Revocation response (empty)
   * @memberof SimpleCacheClient
   */
  public async revokeSigningKey(
    keyId: string
  ): Promise<RevokeSigningKey.Response> {
    return await this.controlClient.revokeSigningKey(keyId);
  }

  /**
   * Lists all Momento signing keys for the provided auth token.
   * @param {string} [nextToken] - Token to continue paginating through the list.
   * @returns {Promise<ListSigningKeys.Response>} - Promise of the list signing keys response.
   * Contains the retrieved signing keys and a next token to continue listing.
   * @memberof SimpleCacheClient
   */
  public async listSigningKeys(
    nextToken?: string
  ): Promise<ListSigningKeys.Response> {
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
