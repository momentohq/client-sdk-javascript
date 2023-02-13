import {ControlClient} from './internal/control-client';
import {CacheClient} from './internal/cache-client';
import {
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
  CacheDictionaryRemoveField,
  CacheDictionaryRemoveFields,
  CacheDictionaryIncrement,
  CacheSetFetch,
  CacheSetAddElements,
  CacheSetAddElement,
  CacheSetRemoveElements,
  CacheSetRemoveElement,
  MomentoLogger,
} from '.';
import {range} from './internal/utils/collections';
import {SimpleCacheClientProps} from './simple-cache-client-props';
import {
  BackTruncatableCallOptions,
  CollectionCallOptions,
  FrontTruncatableCallOptions,
  ScalarCallOptions,
} from './utils/cache-call-options';

// Type aliases to differentiate the different methods' optional arguments.
type SetOptions = ScalarCallOptions;
type ListConcatenateBackOptions = FrontTruncatableCallOptions;
type ListConcatenateFrontOptions = BackTruncatableCallOptions;
type ListPushBackOptions = FrontTruncatableCallOptions;
type ListPushFrontOptions = BackTruncatableCallOptions;
type SetAddElementOptions = CollectionCallOptions;
type SetAddElementsOptions = CollectionCallOptions;
type DictionarySetFieldOptions = CollectionCallOptions;
type DictionarySetFieldsOptions = CollectionCallOptions;
type DictionaryIncrementOptions = CollectionCallOptions;

/**
 * Momento Simple Cache Client.
 *
 * Features include:
 * - Get, set, and delete data
 * - Create, delete, and list caches
 * - Create, revoke, and list signing keys
 */
export class SimpleCacheClient {
  private readonly logger: MomentoLogger;
  private readonly configuration: Configuration;
  private readonly credentialProvider: CredentialProvider;
  private readonly dataClients: Array<CacheClient>;
  private nextDataClientIndex: number;
  private readonly controlClient: ControlClient;

  /**
   * Creates an instance of SimpleCacheClient.
   */
  constructor(props: SimpleCacheClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.logger.info('Instantiating Momento SimpleCacheClient');
    this.configuration = props.configuration;
    this.credentialProvider = props.credentialProvider;

    // For high load, we get better performance with multiple clients.  Here we
    // are setting a default, hard-coded value for the number of clients to use,
    // because we haven't yet designed the API for users to use to configure
    // tunables:
    // https://github.com/momentohq/dev-eco-issue-tracker/issues/85
    // The choice of 6 as the initial value is a rough guess at a reasonable
    // default for the short-term, based on load testing results captured in:
    // https://github.com/momentohq/oncall-tracker/issues/186
    const numClients = 6;
    this.dataClients = range(numClients).map(() => new CacheClient(props));
    // We round-robin the requests through all of our clients.  Since javascript
    // is single-threaded, we don't have to worry about thread safety on this
    // index variable.
    this.nextDataClientIndex = 0;

    this.controlClient = new ControlClient({
      configuration: this.configuration,
      credentialProvider: this.credentialProvider,
    });
  }

  /**
   * Gets the value stored for the given key.
   *
   * @param {string} cacheName - The cache to perform the lookup in.
   * @param {string | Uint8Array} key - The key to look up.
   * @returns {Promise<CacheGet.Response>} - The result of the get operation
   * (hit, miss, or error) and the value.
   */
  public async get(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<CacheGet.Response> {
    const client = this.getNextDataClient();
    return await client.get(cacheName, key);
  }

  /**
   * Associates the given key with the given value. If a value for the key is
   * already present it is replaced with the new value.
   *
   * @param {string} cacheName - The cache to store the value in.
   * @param {string | Uint8Array} key - The key to set.
   * @param {string | Uint8Array} value - The value to be stored.
   * @param {SetOptions} [options]
   * @param {number} [options.ttl] - The time to live for the item in the cache.
   * Uses the client's default TTL if this is not supplied.
   * @returns {Promise<CacheSet.Response>} - The result of the set operation
   * (success or error).
   */
  public async set(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    options?: SetOptions
  ): Promise<CacheSet.Response> {
    const client = this.getNextDataClient();
    return await client.set(cacheName, key, value, options?.ttl);
  }

  /**
   * Removes the given key from the cache.
   *
   * @param {string} cacheName - The cache to delete from.
   * @param {string | Uint8Array} key - The key to delete.
   * @returns {Promise<CacheDelete.Response>} - The result of the delete
   * operation (success or error).
   */
  public async delete(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<CacheDelete.Response> {
    const client = this.getNextDataClient();
    return await client.delete(cacheName, key);
  }

  /**
   * Adds multiple elements to the back of the given list. Creates the list if
   * it does not already exist.
   *
   * @param {string} cacheName - The cache to store the list in.
   * @param {string} listName - The list to add to.
   * @param {string[] | Uint8Array[]} values - The elements to add to the list.
   * @param {ListConcatenateBackOptions} [options]
   * @param {number} [options.truncateFrontToSize] - If the list exceeds this
   * length, remove excess from the front of the list. Must be positive.
   * @param {CollectionTtl} [options.ttl] - How the TTL should be managed.
   * Refreshes the list's TTL using the client's default if this is not
   * supplied.
   * @returns {Promise<CacheListConcatenateBack.Response>} - The result of the
   * add operation (success or error).
   */
  public async listConcatenateBack(
    cacheName: string,
    listName: string,
    values: string[] | Uint8Array[],
    options?: ListConcatenateBackOptions
  ): Promise<CacheListConcatenateBack.Response> {
    const client = this.getNextDataClient();
    return await client.listConcatenateBack(
      cacheName,
      listName,
      values,
      options?.truncateFrontToSize,
      options?.ttl
    );
  }

  /**
   * Adds multiple elements to the front of the given list. Creates the list if
   * it does not already exist.
   *
   * @param {string} cacheName - The cache to store the list in.
   * @param {string} listName - The list to add to.
   * @param {string[] | Uint8Array[]} values - The elements to add to the list.
   * @param {ListConcatenateFrontOptions} [options]
   * @param {number} [options.truncateBackToSize] - If the list exceeds this
   * length, remove excess from the back of the list. Must be positive.
   * @param {CollectionTtl} [options.ttl] - How the TTL should be managed.
   * Refreshes the list's TTL using the client's default if this is not
   * supplied.
   * @returns {Promise<CacheListConcatenateFront.Response>} - The result of the
   * add operation (success or error).
   */
  public async listConcatenateFront(
    cacheName: string,
    listName: string,
    values: string[] | Uint8Array[],
    options?: ListConcatenateFrontOptions
  ): Promise<CacheListConcatenateFront.Response> {
    const client = this.getNextDataClient();
    return await client.listConcatenateFront(
      cacheName,
      listName,
      values,
      options?.truncateBackToSize,
      options?.ttl
    );
  }

  /**
   * Fetches all elements of the given list.
   *
   * @param {string} cacheName - The cache containing the list.
   * @param {string} listName - The list to fetch.
   * @returns {Promise<CacheListFetch.Response>} - The result of the fetch
   * operation (hit, miss, or error) and the list elements.
   */
  public async listFetch(
    cacheName: string,
    listName: string
  ): Promise<CacheListFetch.Response> {
    const client = this.getNextDataClient();
    return await client.listFetch(cacheName, listName);
  }

  /**
   * Gets the number of elements in the given list.
   *
   * @param {string} cacheName - The cache containing the list.
   * @param {string} listName - The list to get the length of.
   * @returns {Promise<CacheListLength.Response>} - The result of the get
   * operation (hit, miss, or error) and the list length.
   */
  public async listLength(
    cacheName: string,
    listName: string
  ): Promise<CacheListLength.Response> {
    const client = this.getNextDataClient();
    return await client.listLength(cacheName, listName);
  }

  /**
   * Gets and removes the last value from the given list.
   *
   * @param {string} cacheName - The cache containing the list.
   * @param {string} listName - The list to pop.
   * @returns {Promise<CacheListPopBack.Response>} - The result of the pop
   * operation (hit, miss, or error) and the removed element.
   */
  public async listPopBack(
    cacheName: string,
    listName: string
  ): Promise<CacheListPopBack.Response> {
    const client = this.getNextDataClient();
    return await client.listPopBack(cacheName, listName);
  }

  /**
   * Gets and removes the first value from the given list.
   *
   * @param {string} cacheName - The cache containing the list.
   * @param {string} listName - The list to pop.
   * @returns {Promise<CacheListPopFront.Response>} - The result of the pop
   * operation (hit, miss, or error) and the removed element.
   */
  public async listPopFront(
    cacheName: string,
    listName: string
  ): Promise<CacheListPopFront.Response> {
    const client = this.getNextDataClient();
    return await client.listPopFront(cacheName, listName);
  }

  /**
   * Adds an element to the back of the given list. Creates the list if
   * it does not already exist.
   *
   * @param {string} cacheName - The cache to store the list in.
   * @param {string} listName - The list to push to.
   * @param {string | Uint8Array} value - The value to push.
   * @param {ListPushBackOptions} [options]
   * @param {number} [options.truncateFrontToSize] - If the list exceeds this
   * length, remove excess from the front of the list. Must be positive.
   * @param {CollectionTtl} [options.ttl] - How the TTL should be managed.
   * Refreshes the list's TTL using the client's default if this is not
   * supplied.
   * @returns {Promise<CacheListPushBack.Response>} - The result of the push
   * operation (success or error).
   */
  public async listPushBack(
    cacheName: string,
    listName: string,
    value: string | Uint8Array,
    options?: ListPushBackOptions
  ): Promise<CacheListPushBack.Response> {
    const client = this.getNextDataClient();
    return await client.listPushBack(
      cacheName,
      listName,
      value,
      options?.truncateFrontToSize,
      options?.ttl
    );
  }

  /**
   * Adds an element to the front of the given list. Creates the list if
   * it does not already exist.
   *
   * @param {string} cacheName - The cache to store the list in.
   * @param {string} listName - The list to push to.
   * @param {string | Uint8Array} value - The value to push.
   * @param {ListPushFrontOptions} [options]
   * @param {number} [options.truncateBackToSize] - If the list exceeds this
   * length, remove excess from the end of the list. Must be positive.
   * @param {CollectionTtl} [options.ttl] - How the TTL should be managed.
   * Refreshes the list's TTL using the client's default if this is not
   * supplied.
   * @returns {Promise<CacheListPushFront.Response>} - The result of the push
   * operation (success or error).
   */
  public async listPushFront(
    cacheName: string,
    listName: string,
    value: string | Uint8Array,
    options?: ListPushFrontOptions
  ): Promise<CacheListPushFront.Response> {
    const client = this.getNextDataClient();
    return await client.listPushFront(
      cacheName,
      listName,
      value,
      options?.truncateBackToSize,
      options?.ttl
    );
  }

  /**
   * Removes all elements from the given list equal to the given value.
   *
   * @param {string} cacheName - The cache containing the list.
   * @param {string} listName - The list to remove from.
   * @param {string | Uint8Array} value - The value to remove.
   * @returns {Promise<CacheListRemoveValue.Response>} - The result of the
   * remove operation (success or error).
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
   * Fetches all elements of the given set
   *
   * @param {string} cacheName - The cache containing the set.
   * @param {string} setName - The set to fetch.
   * @returns {Promise<CacheSetFetch.Response>} - The result of the fetch
   * operation (hit, miss, or error) and the set elements.
   */
  public async setFetch(
    cacheName: string,
    setName: string
  ): Promise<CacheSetFetch.Response> {
    const client = this.getNextDataClient();
    return await client.setFetch(cacheName, setName);
  }

  /**
   * Adds an element to the given set. Creates the set if it does not already
   * exist.
   *
   * @remarks
   * After this operation the set will contain the union of the element passed
   * in and the original elements of the set.
   *
   * @param {string} cacheName - The cache to store the set in.
   * @param {string} setName - The set to add to.
   * @param {string | Uint8Array} element - The element to add.
   * @param {SetAddElementOptions} options
   * @param {CollectionTtl} [options.ttl] - How the TTL should be managed.
   * Refreshes the set's TTL using the client's default if this is not supplied.
   * @returns {Promise<CacheSetAddElement.Response>} - The result of the add
   * operation (success or error).
   */
  public async setAddElement(
    cacheName: string,
    setName: string,
    element: string | Uint8Array,
    options?: SetAddElementOptions
  ): Promise<CacheSetAddElement.Response> {
    return (
      await this.setAddElements(
        cacheName,
        setName,
        [element] as string[] | Uint8Array[],
        options
      )
    ).toSingularResponse();
  }

  /**
   * Adds multiple elements to the given set. Creates the set if it does not
   * already exist.
   *
   * @remarks
   * After this operation, the set will contain the union of the elements passed
   * in and the original elements of the set.
   *
   * @param {string} cacheName - The cache to store the set in.
   * @param {string} setName - The set to add to.
   * @param {string[] | Uint8Array[]} elements - The elements to add.
   * @param {SetAddElementsOptions} options
   * @param {CollectionTtl} [options.ttl] - How the TTL should be managed.
   * Refreshes the set's TTL using the client's default if this is not supplied.
   * @returns {Promise<CacheSetAddElements.Response>} - The result of the add
   * operation (success or error).
   */
  public async setAddElements(
    cacheName: string,
    setName: string,
    elements: string[] | Uint8Array[],
    options?: SetAddElementsOptions
  ): Promise<CacheSetAddElements.Response> {
    const client = this.getNextDataClient();
    return await client.setAddElements(
      cacheName,
      setName,
      elements,
      options?.ttl
    );
  }

  /**
   * Removes an element from the given set.
   *
   * @param {string} cacheName - The cache containing the set.
   * @param {string} setName - The set to remove from.
   * @param {string | Uint8Array} element - The element to remove.
   * @returns {Promise<CacheSetRemoveElement.Response>} - The result of the
   * remove operation (success or error).
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
   * Removes multiple elements from the given set.
   *
   * @param {string} cacheName - The cache containing the set.
   * @param {string} setName - The set to remove from.
   * @param {string[] | Uint8Array[]} elements - The elements to remove.
   * @returns {Promise<CacheSetRemoveElements.Response>} - The result of the
   * remove operation (success or error).
   */
  public async setRemoveElements(
    cacheName: string,
    setName: string,
    elements: string[] | Uint8Array[]
  ): Promise<CacheSetRemoveElements.Response> {
    const client = this.getNextDataClient();
    return await client.setRemoveElements(cacheName, setName, elements);
  }

  /**
   * Creates a cache if it does not exist.
   *
   * @param {string} cacheName - The cache to be created.
   * @returns {Promise<CreateCache.Response>} - The result of the create cache
   * operation (success or error).
   */
  public async createCache(cacheName: string): Promise<CreateCache.Response> {
    return await this.controlClient.createCache(cacheName);
  }

  /**
   * Deletes a cache and all items stored in it.
   *
   * @param {string} cacheName - The cache to delete.
   * @returns {Promise<DeleteCache.Response>} - The result of the delete cache
   * operation (success or error).
   */
  public async deleteCache(cacheName: string): Promise<DeleteCache.Response> {
    return await this.controlClient.deleteCache(cacheName);
  }

  /**
   * Lists all caches.
   *
   * @returns {Promise<ListCaches.Response>} - The result of the list caches
   * operation (success or error) and the list of caches.
   */
  public async listCaches(): Promise<ListCaches.Response> {
    return await this.controlClient.listCaches();
  }

  /**
   * Fetches all elements of the given dictionary.
   *
   * @param {string} cacheName - The cache to perform the lookup in.
   * @param {string} dictionaryName - The dictionary to fetch.
   * @returns {Promise<CacheDictionaryFetch.Response>} - The result of the fetch
   * operation (hit, miss, or error) and the dictionary elements.
   */
  public async dictionaryFetch(
    cacheName: string,
    dictionaryName: string
  ): Promise<CacheDictionaryFetch.Response> {
    const client = this.getNextDataClient();
    return await client.dictionaryFetch(cacheName, dictionaryName);
  }

  /**
   * Adds an element to the given dictionary. Creates the dictionary if it does
   * not already exist.
   *
   * @param {string} cacheName - The cache to store the dictionary in.
   * @param {string} dictionaryName - The dictionary to add to.
   * @param {string | Uint8Array} field - The field to set.
   * @param {string | Uint8Array} value - The value to store.
   * @param {DictionarySetFieldOptions} options
   * @param {CollectionTtl} [options.ttl] - How the TTL should be managed.
   * Refreshes the dictionary's TTL using the client's default if this is not
   * supplied.
   * @returns {Promise<CacheDictionarySetField.Response>} - The result of the
   * set operation (success or error).
   */
  public async dictionarySetField(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array,
    value: string | Uint8Array,
    options?: DictionarySetFieldOptions
  ): Promise<CacheDictionarySetField.Response> {
    const client = this.getNextDataClient();
    return await client.dictionarySendField(
      cacheName,
      dictionaryName,
      field,
      value,
      options?.ttl
    );
  }

  /**
   * Adds multiple elements to the given dictionary. Creates the dictionary if
   * it does not already exist.
   *
   * @param {string} cacheName - The cache to store the dictionary in.
   * @param {string} dictionaryName - The dictionary to add to.
   * @param {Map<string | Uint8Array, string | Uint8Array>} elements - The
   * elements to set.
   * @param {DictionarySetFieldsOptions} options
   * @param {CollectionTtl} [options.ttl] - How the TTL should be managed.
   * Refreshes the dictionary's TTL using the client's default if this is not
   * supplied.
   * @returns {Promise<CacheDictionarySetFields.Response>} - The result of the
   * set operation (success or error).
   */
  public async dictionarySetFields(
    cacheName: string,
    dictionaryName: string,
    elements:
      | Map<string | Uint8Array, string | Uint8Array>
      | Record<string, string | Uint8Array>,
    options?: DictionarySetFieldsOptions
  ): Promise<CacheDictionarySetFields.Response> {
    const client = this.getNextDataClient();
    return await client.dictionarySetFields(
      cacheName,
      dictionaryName,
      elements,
      options?.ttl
    );
  }

  /**
   * Gets the value stored for the given dictionary and field.
   *
   * @param {string} cacheName - The cache containing the dictionary.
   * @param {string} dictionaryName - The dictionary to look up.
   * @param {string | Uint8Array} field - The field to look up.
   * @returns {Promise<CacheDictionaryGetField.Response>} - The result of the
   * get operation (hit, miss, or error) and the element.
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
   * Gets multiple values from the given dictionary.
   *
   * @param {string} cacheName - The cache containing the dictionary.
   * @param {string} dictionaryName - The dictionary to look up.
   * @param {string[] | Uint8Array[]} fields - The fields to look up.
   * @returns {Promise<CacheDictionaryGetFields.Response>} - The result of the
   * get operation (hit, miss, or error) and the elements.
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
   * Removes an element from the given dictionary.
   *
   * @remarks
   * Performs a no-op if the dictionary or field does not exist.
   *
   * @param {string} cacheName - The cache containing the dictionary.
   * @param {string} dictionaryName - The dictionary to remove from.
   * @param {string | Uint8Array} field - The field to remove.
   * @returns {Promise<CacheDictionaryRemoveField.Response>} - The result of the
   * remove operation (success or error).
   */
  public async dictionaryRemoveField(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array
  ): Promise<CacheDictionaryRemoveField.Response> {
    const client = this.getNextDataClient();
    return await client.dictionaryRemoveField(cacheName, dictionaryName, field);
  }

  /**
   * Removes multiple fields from the given dictionary.
   *
   * @remarks
   * Performs a no-op if the dictionary or fields do not exist.
   *
   * @param {string} cacheName - The cache containing the dictionary.
   * @param {string} dictionaryName - The dictionary to remove from.
   * @param {string[] | Uint8Array[]} fields - The fields to remove.
   * @returns {Promise<CacheDictionaryRemoveFields.Response>} - The result of
   * the remove operation (success or error).
   */
  public async dictionaryRemoveFields(
    cacheName: string,
    dictionaryName: string,
    fields: string[] | Uint8Array[]
  ): Promise<CacheDictionaryRemoveFields.Response> {
    const client = this.getNextDataClient();
    return await client.dictionaryRemoveFields(
      cacheName,
      dictionaryName,
      fields
    );
  }

  /**
   * Adds an integer quantity to a dictionary value.
   *
   * @remarks
   * Incrementing the value of a missing field sets the value to amount.
   * Incrementing a value that was not set using this method or is not the
   * string representation of an integer results in a
   * FailedPreconditionException error.
   *
   * @param {string} cacheName - The cache containing the dictionary.
   * @param {string} dictionaryName - The dictionary to set.
   * @param {string | Uint8Array} field - The field to increment.
   * @param {number} amount - The quantity to add to the value. May be positive,
   * negative, or zero. Defaults to 1.
   * @param {DictionaryIncrementOptions} options
   * @param {CollectionTtl} [options.ttl] - How the TTL should be managed.
   * Refreshes the dictionary's TTL using the client's default if this is not
   * supplied.
   * @returns {Promise<CacheDictionaryIncrement>} - The result of the increment
   * operation (success or error).
   */
  public async dictionaryIncrement(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array,
    amount = 1,
    options?: DictionaryIncrementOptions
  ): Promise<CacheDictionaryIncrement.Response> {
    const client = this.getNextDataClient();
    return await client.dictionaryIncrement(
      cacheName,
      dictionaryName,
      field,
      amount,
      options?.ttl
    );
  }

  /**
   * Creates a Momento signing key.
   *
   * @param {number} ttlMinutes - The time to live in minutes until the Momento
   * signing key expires.
   * @returns {Promise<CreateSigningKey.Response>} - The result of the create
   * signing key operation (success or error) containing the key, key ID,
   * endpoint, and expiration date.
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
   * @remarks
   * All tokens signed by this key will be invalid.
   *
   * @param {string} keyId - The ID of the key to revoke.
   * @returns {Promise<RevokeSigningKey.Response>} - The result of the revoke
   * signing key operation (success or error).
   */
  public async revokeSigningKey(
    keyId: string
  ): Promise<RevokeSigningKey.Response> {
    return await this.controlClient.revokeSigningKey(keyId);
  }

  /**
   * Lists all Momento signing keys for the provided auth token.
   *
   * @returns {Promise<ListSigningKeys.Response>} - The result of the revoke
   * signing key operation (success or error) containing the keys.
   */
  public async listSigningKeys(): Promise<ListSigningKeys.Response> {
    const client = this.getNextDataClient();
    return await this.controlClient.listSigningKeys(client.getEndpoint());
  }

  private getNextDataClient(): CacheClient {
    const client = this.dataClients[this.nextDataClientIndex];
    this.nextDataClientIndex =
      (this.nextDataClientIndex + 1) % this.dataClients.length;
    return client;
  }
}
