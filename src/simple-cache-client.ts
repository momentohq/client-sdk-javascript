import {ControlClient} from './internal/control-client';
import {CacheClient} from './internal/cache-client';
import {
  CollectionTtl,
  Configuration,
  CredentialProvider,
  CreateCache,
  ListCaches,
  DeleteCache,
  CreateSigningKey,
  ListSigningKeys,
  RevokeSigningKey,
  CacheGet,
  CacheDelete,
  CacheListConcatenateBack,
  CacheListConcatenateFront,
  CacheListFetch,
  CacheListLength,
  CacheListPopBack,
  CacheListPopFront,
  CacheListPushBack,
  CacheListPushFront,
  CacheListRemoveValue,
  CacheSet,
  CacheDictionaryFetch,
  CacheDictionarySetField,
  CacheDictionarySetFields,
  CacheDictionaryGetField,
  CacheDictionaryGetFields,
  CacheDictionaryIncrement,
  CacheSetFetch,
  CacheSetAddElements,
  CacheSetAddElement,
  CacheSetRemoveElements,
  CacheSetRemoveElement,
} from '.';
import {initializeMomentoLogging} from './utils/logging';
import {range} from './utils/collections';
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
  private readonly configuration: Configuration;
  private readonly credentialProvider: CredentialProvider;
  private readonly dataClients: Array<CacheClient>;
  private nextDataClientIndex: number;
  private readonly controlClient: ControlClient;

  /**
   * Creates an instance of SimpleCacheClient.
   */
  constructor(props: SimpleCacheClientProps) {
    initializeMomentoLogging(props.configuration.getLoggerOptions());
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
   * Add multiple values to the end of a list. If the list does not exist it
   * will be created.
   *
   * @param {string} cacheName - Name of the cache to store the list in.
   * @param {string} listName - The list to add to.
   * @param {string[] | Uint8Array[]} values - The values to add to the list.
   * @param {CollectionTtl} [ttl] - How the ttl should be managed. Defaults to the client's TTL.
   * @param {number} [truncateFrontToSize] - If the list exceeds this length, remove excess from the start of the list. Must be positive.
   * @returns {Promise<CacheListConcatenateBack.Response>}
   */
  public async listConcatenateBack(
    cacheName: string,
    listName: string,
    values: string[] | Uint8Array[],
    ttl?: CollectionTtl,
    truncateFrontToSize?: number
  ): Promise<CacheListConcatenateBack.Response> {
    const client = this.getNextDataClient();
    return await client.listConcatenateBack(
      cacheName,
      listName,
      values,
      ttl,
      truncateFrontToSize
    );
  }

  /**
   * Add multiple values to the start of a list. If the list does not exist it
   * will be created.
   *
   * @param {string} cacheName - Name of the cache to store the list in.
   * @param {string} listName - The list to add to.
   * @param {string[] | Uint8Array[]} values - The values to add to the list.
   * @param {CollectionTtl} [ttl] - How the ttl should be managed. Defaults to the client's TTL.
   * @param {number} [truncateBackToSize] - If the list exceeds this length, remove excess from the end of the list. Must be positive.
   * @returns {Promise<CacheListConcatenateFront.Response>}
   */
  public async listConcatenateFront(
    cacheName: string,
    listName: string,
    values: string[] | Uint8Array[],
    ttl?: CollectionTtl,
    truncateBackToSize?: number
  ): Promise<CacheListConcatenateFront.Response> {
    const client = this.getNextDataClient();
    return await client.listConcatenateFront(
      cacheName,
      listName,
      values,
      ttl,
      truncateBackToSize
    );
  }

  /**
   * Fetch the entire list.
   * @param {string} cacheName - Name of the cache to fetch the list from.
   * @param {string} listName - The list to fetch.
   * @returns {Promise<CacheListFetch.Response>}
   */
  public async listFetch(
    cacheName: string,
    listName: string
  ): Promise<CacheListFetch.Response> {
    const client = this.getNextDataClient();
    return await client.listFetch(cacheName, listName);
  }

  /**
   * Get the number of values in a list.
   * @param {string} cacheName - Name of the cache with the list.
   * @param {string} listName - The list to get the length of.
   */
  public async listLength(
    cacheName: string,
    listName: string
  ): Promise<CacheListLength.Response> {
    const client = this.getNextDataClient();
    return await client.listLength(cacheName, listName);
  }

  /**
   * Get and remove the last value from a list.
   * @param {string} cacheName - Name of the cache with the list.
   * @param {string} listName - The list to pop.
   * @returns {Promise<CacheListPopBack.Response>}
   */
  public async listPopBack(
    cacheName: string,
    listName: string
  ): Promise<CacheListPopBack.Response> {
    const client = this.getNextDataClient();
    return await client.listPopBack(cacheName, listName);
  }

  /**
   * Get and remove the first value from a list.
   * @param {string} cacheName - Name of the cache with the list.
   * @param {string} listName - The list to pop.
   * @returns {Promise<CacheListPopFront.Response>}
   */
  public async listPopFront(
    cacheName: string,
    listName: string
  ): Promise<CacheListPopFront.Response> {
    const client = this.getNextDataClient();
    return await client.listPopFront(cacheName, listName);
  }

  /**
   * Add a value to the beginning of a list.
   * @param {string} cacheName - Name of the cache with the list.
   * @param {string} listName - The list to push to.
   * @param {string | Uint8Array} - The value to push.
   * @param {CollectionTtl} [ttl] - How the ttl should be managed. Defaults to the client's TTL.
   * @param {number} [truncateFrontToSize] - If the list exceeds this length, remove excess from the start of the list. Must be positive.
   * @return {Promise<CacheListPushBack.Response>}
   */
  public async listPushBack(
    cacheName: string,
    listName: string,
    value: string | Uint8Array,
    ttl?: CollectionTtl,
    truncateFrontToSize?: number
  ): Promise<CacheListPushBack.Response> {
    const client = this.getNextDataClient();
    return await client.listPushBack(
      cacheName,
      listName,
      value,
      ttl,
      truncateFrontToSize
    );
  }

  /**
   * Add a value to the end of a list.
   * @param {string} cacheName - Name of the cache with the list.
   * @param {string} listName - The list to push to.
   * @param {string | Uint8Array} - The value to push.
   * @param {CollectionTtl} [ttl] - How the ttl should be managed. Defaults to the client's TTL.
   * @param {number} [truncateBackToSize] - If the list exceeds this length, remove excess from the end of the list. Must be positive.
   * @return {Promise<CacheListPushFront.Response>}
   */
  public async listPushFront(
    cacheName: string,
    listName: string,
    value: string | Uint8Array,
    ttl?: CollectionTtl,
    truncateBackToSize?: number
  ): Promise<CacheListPushFront.Response> {
    const client = this.getNextDataClient();
    return await client.listPushFront(
      cacheName,
      listName,
      value,
      ttl,
      truncateBackToSize
    );
  }

  /**
   * Removes all elements from the list equal to the value.
   * @param {string} cacheName - Name of the cache with the list.
   * @param {string} listName - The list to remove elements from.
   * @param {string | Uint8Array} value - The value to remove.
   * @returns {Promise<CacheListRemoveValue.Response>}
   */
  public async listRemoveValue(
    cacheName: string,
    listName: string,
    value: string | Uint8Array
  ): Promise<CacheListRemoveValue.Response> {
    const client = this.getNextDataClient();
    return await client.listRemoveValue(cacheName, listName, value);
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
   * Add an element to a set in the cache.
   *
   * After this operation, the set will contain the union
   * of the element passed in and the elements of the set.
   * @param {string} cacheName - Name of the cache to store the set in.
   * @param {string} setName - The set to add elements to.
   * @param {(string | Uint8Array)} element - The data to add to the set.
   * @param {CollectionTtl} [ttl] - TTL for the set in cache. This TTL takes precedence over the TTL used when initializing a cache client. Defaults to client TTL.
   */
  public async setAddElement(
    cacheName: string,
    setName: string,
    element: string | Uint8Array,
    ttl?: CollectionTtl
  ): Promise<CacheSetAddElement.Response> {
    return (
      await this.setAddElements(
        cacheName,
        setName,
        [element] as string[] | Uint8Array[],
        ttl
      )
    ).toSingularResponse();
  }

  /**
   * Add several elements to a set in the cache.
   *
   * After this operation, the set will contain the union
   * of the elements passed in and the elements of the set.
   * @param {string} cacheName - Name of the cache to store the set in.
   * @param {string} setName - The set to add elements to.
   * @param {(string[] | Uint8Array[])} elements - The data to add to the set.
   * @param {CollectionTtl} [ttl] - TTL for the set in cache. This TTL takes precedence over the TTL used when initializing a cache client. Defaults to client TTL.
   */
  public async setAddElements(
    cacheName: string,
    setName: string,
    elements: string[] | Uint8Array[],
    ttl?: CollectionTtl
  ): Promise<CacheSetAddElements.Response> {
    const client = this.getNextDataClient();
    return await client.setAddElements(cacheName, setName, elements, ttl);
  }

  /**
   * Remove an element from a set.
   *
   * @param {string} cacheName - Name of the cache to store the set in.
   * @param {string} setName - The set to remove the element from.
   * @param {(string | Uint8Array)} element - The data to remove from the set.
   */
  public async setRemoveElement(
    cacheName: string,
    setName: string,
    element: string | Uint8Array
  ): Promise<CacheSetRemoveElement.Response> {
    return (
      await this.setRemoveElements(cacheName, setName, [element] as
        | string[]
        | Uint8Array[])
    ).toSingularResponse();
  }

  /**
   * Remove elements from a set.
   *
   * @param {string} cacheName - Name of the cache to store the set in.
   * @param {string} setName - The set to remove the element from.
   * @param {(string[] | Uint8Array[])} elements - The data to remove from the set.
   */
  public async setRemoveElements(
    cacheName: string,
    setName: string,
    elements: string[] | Uint8Array[]
  ): Promise<CacheSetRemoveElements.Response> {
    const client = this.getNextDataClient();
    return await client.setRemoveElements(cacheName, setName, elements);
  }

  // TODO add support for adding/removing a single element to/from a set.
  // https://github.com/momentohq/client-sdk-javascript/issues/170

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
   * Fetch the entire dictionary from the cache.
   * @param {string} cacheName - Name of the cache to perform the lookup in.
   * @param {string} dictionaryName - The dictionary to fetch.
   * @returns {Promise<DictionaryFetch.Response>}- Promise containing the result of the fetch operation and the associated dictionary.
   * @memberof SimpleCacheClient
   */
  public async dictionaryFetch(
    cacheName: string,
    dictionaryName: string
  ): Promise<CacheDictionaryFetch.Response> {
    const client = this.getNextDataClient();
    return await client.dictionaryFetch(cacheName, dictionaryName);
  }

  /**
   * Add an element to a set in the cache.
   * After this operation, the set will contain the union of the element passed in and the elements of the set.
   * @param {string} cacheName - Name of the cache to store the dictionary in.
   * @param {string} dictionaryName - The dictionary to set.
   * @param {string | Uint8Array} items - The field in the dictionary to set.
   * @param {string | Uint8Array} value - The value to be stored.
   * @param {CollectionTtl} ttl -  TTL for the dictionary in cache. This TTL takes precedence over the TTL used when initializing a cache client. Defaults to client TTL.
   * @returns {Promise<CacheDictionarySetField.Response>}- Promise containing the result of the cache operation.
   * @memberof SimpleCacheClient
   */
  public async dictionarySetField(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array,
    value: string | Uint8Array,
    ttl?: CollectionTtl
  ): Promise<CacheDictionarySetField.Response> {
    const client = this.getNextDataClient();
    return await client.dictionarySendField(
      cacheName,
      dictionaryName,
      field,
      value,
      ttl
    );
  }

  /**
   * Set several dictionary field-value pairs in the cache.
   * @param {string} cacheName - Name of the cache to store the dictionary in.
   * @param {string} dictionaryName - The dictionary to set.
   * @param {Map<string | Uint8Array, string | Uint8Array>} items - The field-value pairs in the dictionary to set.
   * @param {CollectionTtl} ttl -  TTL for the dictionary in cache. This TTL takes precedence over the TTL used when initializing a cache client. Defaults to client TTL.
   * @returns {Promise<CacheDictionarySetFields.Response>}- Promise containing the result of the cache operation.
   * @memberof SimpleCacheClient
   */
  public async dictionarySetFields(
    cacheName: string,
    dictionaryName: string,
    items:
      | Map<string | Uint8Array, string | Uint8Array>
      | Record<string, string | Uint8Array>,
    ttl?: CollectionTtl
  ): Promise<CacheDictionarySetFields.Response> {
    const client = this.getNextDataClient();
    return await client.dictionarySendFields(
      cacheName,
      dictionaryName,
      items,
      ttl
    );
  }

  /**
   * Get the cache value stored for the given dictionary and field.
   * @param {string} cacheName - Name of the cache to perform the lookup in.
   * @param {string} dictionaryName - The dictionary to look up.
   * @param {string | Uint8Array} field - The field in the dictionary to lookup.
   * @returns {Promise<CacheDictionaryGetField>}- Promise containing the status of the get operation and the associated value.
   */
  public async dictionaryGetField(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array
  ): Promise<CacheDictionaryGetField.Response> {
    const client = this.getNextDataClient();
    return await client.dictionaryGetField(cacheName, dictionaryName, field);
  }

  /**
   * Get several values from a dictionary.
   * @param {string} cacheName - Name of the cache to perform the lookup in.
   * @param {string} dictionaryName - The dictionary to look up.
   * @param {string[] | Uint8Array[]} fields - The field in the dictionary to lookup.
   * @returns {Promise<CacheDictionaryGetField>}- Promise containing the status and associated value for each field.
   */
  public async dictionaryGetFields(
    cacheName: string,
    dictionaryName: string,
    fields: string[] | Uint8Array[]
  ): Promise<CacheDictionaryGetFields.Response> {
    const client = this.getNextDataClient();
    return await client.dictionaryGetFields(cacheName, dictionaryName, fields);
  }

  /**
   * Remove a field from a dictionary.
   * Performs a no-op if dictionaryName or field does not exist.
   * @param {string} cacheName - Name of the cache to perform the lookup in.
   * @param {string} dictionaryName - Name of the dictionary to remove the field from.
   * @param {string | Uint8Array} field - Name of the field to remove from the dictionary.
   * @returns {Promise<CacheDictionaryRemoveField>}- Promise containing the result of the cache operation.
   */
  public async dictionaryRemoveField(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array
  ): Promise<CacheDictionaryGetField.Response> {
    const client = this.getNextDataClient();
    return await client.dictionaryRemoveField(cacheName, dictionaryName, field);
  }

  /**
   * Remove fields from a dictionary.
   * Performs a no-op if dictionaryName or field does not exist.
   * @param {string} cacheName - Name of the cache to perform the lookup in.
   * @param {string} dictionaryName - Name of the dictionary to remove the field from.
   * @param {string[] | Uint8Array[]} fields - Name of the fields to remove from the dictionary.
   * @returns {Promise<CacheDictionaryRemoveFields>}- Promise containing the result of the cache operation.
   */
  public async dictionaryRemoveFields(
    cacheName: string,
    dictionaryName: string,
    fields: string[] | Uint8Array[]
  ): Promise<CacheDictionaryGetFields.Response> {
    const client = this.getNextDataClient();
    return await client.dictionaryRemoveFields(
      cacheName,
      dictionaryName,
      fields
    );
  }

  /**
   * Add an integer quantity to a dictionary value.
   * Incrementing the value of a missing field sets the value to amount.
   * Incrementing a value that was not set using this method or not the string representation of an integer
   * results in an error with FailedPreconditionException.
   * @param {string} cacheName - Name of the cache to perform the lookup in.
   * @param {string} dictionaryName - The dictionary to set.
   * @param {string | Uint8Array} field - Name of the field to increment from the dictionary.
   * @param {number} amount - The quantity to add to the value. May be positive, negative, or zero. Defaults to 1.
   * @param {CollectionTtl} ttl - TTL for the dictionary in cache. This TTL takes precedence over the TTL used when initializing a cache client. Defaults to client TTL.
   * @returns {Promise<CacheDictionaryIncrement>}- Promise containing the result of the cache operation.
   */
  public async dictionaryIncrement(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array,
    amount = 1,
    ttl?: CollectionTtl
  ): Promise<CacheDictionaryIncrement.Response> {
    const client = this.getNextDataClient();
    return await client.dictionaryIncrement(
      cacheName,
      dictionaryName,
      field,
      amount,
      ttl
    );
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
