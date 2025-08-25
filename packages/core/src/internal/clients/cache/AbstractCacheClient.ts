import {
  CreateCache,
  DeleteCache,
  ListCaches,
  CacheFlush,
  CacheGet,
  CacheSet,
  CacheDelete,
  CacheIncrement,
  IncrementOptions,
  CacheSetIfNotExists,
  SetIfNotExistsOptions,
  SetIfAbsentOptions,
  SetIfPresentOptions,
  SetIfEqualOptions,
  SetIfNotEqualOptions,
  SetIfPresentAndNotEqualOptions,
  SetIfAbsentOrEqualOptions,
  SetIfPresentAndHashEqualOptions,
  SetIfPresentAndHashNotEqualOptions,
  SetIfAbsentOrHashEqualOptions,
  SetIfAbsentOrHashNotEqualOptions,
  CacheSetFetch,
  CacheSetAddElement,
  CacheSetAddElements,
  CacheSetContainsElement,
  CacheSetContainsElements,
  CacheSetRemoveElement,
  CacheSetRemoveElements,
  CacheListFetch,
  CacheListLength,
  CacheListPushFront,
  CacheListPushBack,
  CacheListConcatenateBack,
  CacheListConcatenateFront,
  CacheListPopBack,
  CacheListPopFront,
  CacheListRemoveValue,
  CacheListRetain,
  CacheDictionarySetField,
  CacheDictionarySetFields,
  CacheDictionaryGetField,
  CacheDictionaryGetFields,
  CacheDictionaryIncrement,
  CacheDictionaryFetch,
  CacheDictionaryRemoveField,
  CacheDictionaryRemoveFields,
  CacheDictionaryLength,
  CacheSortedSetFetch,
  CacheSortedSetPutElement,
  CacheSortedSetPutElements,
  CacheSortedSetGetRank,
  CacheSortedSetGetScore,
  CacheSortedSetGetScores,
  CacheSortedSetIncrementScore,
  CacheSortedSetRemoveElement,
  CacheSortedSetRemoveElements,
  CacheSortedSetLength,
  CacheSortedSetLengthByScore,
  CacheSortedSetUnionStore,
  SortedSetOrder,
  CacheItemGetTtl,
  CacheItemGetType,
  CacheKeyExists,
  CacheKeysExist,
  CacheUpdateTtl,
  CacheIncreaseTtl,
  CacheDecreaseTtl,
  CacheGetBatch,
  CacheSetBatch,
  InvalidArgumentError,
  CacheSetIfAbsent,
  CacheSetIfPresent,
  CacheSetIfEqual,
  CacheSetIfNotEqual,
  CacheSetIfPresentAndNotEqual,
  CacheSetIfAbsentOrEqual,
  CacheSetSample,
  CacheSetPop,
  CacheSetLength,
  CacheGetWithHash,
  CacheSetWithHash,
  CacheSetIfPresentAndHashEqual,
  CacheSetIfPresentAndHashNotEqual,
  CacheSetIfAbsentOrHashEqual,
  CacheSetIfAbsentOrHashNotEqual,
} from '../../../index';
import {
  ListFetchCallOptions,
  ListRetainCallOptions,
  SetBatchItem,
  SortedSetSource,
} from '../../../utils';
import {
  ICacheClient,
  SetOptions,
  SetAddElementOptions,
  SetAddElementsOptions,
  ListPushFrontOptions,
  ListPushBackOptions,
  ListConcatenateBackOptions,
  ListConcatenateFrontOptions,
  DictionarySetFieldOptions,
  DictionarySetFieldsOptions,
  DictionaryIncrementOptions,
  SortedSetFetchByRankOptions,
  SortedSetPutElementOptions,
  SortedSetPutElementsOptions,
  SortedSetFetchByScoreOptions,
  SortedSetGetRankOptions,
  SortedSetIncrementOptions,
  SortedSetLengthByScoreOptions,
  SortedSetUnionStoreOptions,
  SetBatchOptions,
  GetOptions,
  GetBatchOptions,
  GetWithHashOptions,
  SetWithHashOptions,
  SetFetchOptions,
  DeleteOptions,
  ListLengthOptions,
  ListPopBackOptions,
  ListPopFrontOptions,
  ListRemoveValueOptions,
  SetContainsElementsOptions,
  SetRemoveElementsOptions,
  SetSampleOptions,
  SetPopOptions,
  SetLengthOptions,
  DictionaryFetchOptions,
  DictionaryGetFieldOptions,
  DictionaryRemoveFieldOptions,
  DictionaryLengthOptions,
  SortedSetGetScoreOptions,
  SortedSetRemoveElementOptions,
  SortedSetLengthOptions,
  ItemGetTypeOptions,
  ItemGetTtlOptions,
  KeyExistsOptions,
  UpdateTtlOptions,
  IncreaseTtlOptions,
  DecreaseTtlOptions,
} from '../../../clients/ICacheClient';
import {CacheOptions, IControlClient} from './IControlClient';
import {IDataClient} from './IDataClient';
import {IPingClient} from './IPingClient';
import {IMomentoCache} from '../../../clients/IMomentoCache';
import {MomentoCache} from './momento-cache';

export abstract class AbstractCacheClient implements ICacheClient {
  // making these protected until we fully abstract away the nodejs client
  protected readonly controlClient: IControlClient;
  protected readonly dataClients: IDataClient[];
  // TODO: Make pingClient required if and when the nodejs side starts adding
  //  one as well
  protected readonly pingClient?: IPingClient;
  private nextDataClientIndex: number;

  protected constructor(
    controlClient: IControlClient,
    dataClients: IDataClient[],
    pingClient?: IPingClient
  ) {
    this.controlClient = controlClient;
    this.dataClients = dataClients;
    this.pingClient = pingClient;

    // We round-robin the requests through all of our clients.  Since javascript
    // is single-threaded, we don't have to worry about thread safety on this
    // index variable.
    this.nextDataClientIndex = 0;
  }

  public cache(cacheName: string): IMomentoCache {
    return new MomentoCache(this, cacheName);
  }

  /**
   * Ping the service to verify it is up and running
   */
  public async ping(): Promise<void> {
    return await this.pingClient?.ping();
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
  public async createCache(
    cacheName: string,
    options?: CacheOptions
  ): Promise<CreateCache.Response> {
    return await this.controlClient.createCache(cacheName, options);
  }

  /**
   * Deletes a cache and all items stored in it.
   *
   * @param {string} cacheName - The cache to delete.
   * @returns {Promise<DeleteCache.Response>} -
   * {@link DeleteCache.Success} on success.
   * {@link DeleteCache.Error} on failure.
   */
  public async deleteCache(
    cacheName: string,
    options?: CacheOptions
  ): Promise<DeleteCache.Response> {
    return await this.controlClient.deleteCache(cacheName, options);
  }

  /**
   * Lists all caches.
   *
   * @returns {Promise<ListCaches.Response>} -
   * {@link ListCaches.Success} containing the list on success.
   * {@link ListCaches.Error} on failure.
   */
  public async listCaches(
    options?: CacheOptions
  ): Promise<ListCaches.Response> {
    return await this.controlClient.listCaches(options);
  }

  /**
   * Gets the value stored for the given key.
   *
   * @param {string} cacheName - The cache to perform the lookup in.
   * @param {string | Uint8Array} key - The key to look up.
   * @param {GetOptions} [options]
   * @param {decompress} [options.decompress=false] - Whether to decompress the value. Overrides the client-wide
   * automatic decompression setting.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheGet.Response>} -
   * {@link CacheGet.Hit} containing the value if one is found.
   * {@link CacheGet.Miss} if the key does not exist.
   * {@link CacheGet.Error} on failure.
   */
  public async get(
    cacheName: string,
    key: string | Uint8Array,
    options?: GetOptions
  ): Promise<CacheGet.Response> {
    return await this.getNextDataClient().get(cacheName, key, options);
  }

  /**
   * Gets the value stored for the given key and its hash.
   *
   * @param {string} cacheName - The cache to perform the lookup in.
   * @param {string | Uint8Array} key - The key to look up.
   * @param {GetOptions} [options]
   * @param {decompress} [options.decompress=false] - Whether to decompress the value. Overrides the client-wide
   * automatic decompression setting.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheGet.Response>} -
   * {@link CacheGetWithHash.Hit} containing the value and hash if one is found.
   * {@link CacheGetWithHash.Miss} if the key does not exist.
   * {@link CacheGetWithHash.Error} on failure.
   */
  public async getWithHash(
    cacheName: string,
    key: string | Uint8Array,
    options?: GetWithHashOptions
  ): Promise<CacheGetWithHash.Response> {
    return await this.getNextDataClient().getWithHash(cacheName, key, options);
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
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * Uses the client's default TTL if this is not supplied.
   * @param {boolean} [options.compress=false] - Whether to compress the value. Defaults to false.
   * @returns {Promise<CacheSet.Response>} -
   * {@link CacheSet.Success} on success.
   * {@link CacheSet.Error} on failure.
   */
  public async set(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    options?: SetOptions
  ): Promise<CacheSet.Response> {
    // this typeof check wouldn't be necessary in TS, but it can help catch bugs in JS code at runtime.
    if (typeof options === 'number') {
      throw new InvalidArgumentError(
        'Options must be an object with a ttl property.'
      );
    }
    const client = this.getNextDataClient();
    return await client.set(cacheName, key, value, options);
  }

  /**
   * Associates the given key with the given value. If a value for the key is
   * already present it is replaced with the new value. Returns the hash of the value.
   *
   * @param {string} cacheName - The cache to store the value in.
   * @param {string | Uint8Array} key - The key to set.
   * @param {string | Uint8Array} value - The value to be stored.
   * @param {SetWithHashOptions} [options]
   * @param {number} [options.ttl] - The time to live for the item in the cache.
   * Uses the client's default TTL if this is not supplied.
   * @param {boolean} [options.compress=false] - Whether to compress the value. Defaults to false.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSet.Response>} -
   * {@link CacheSetWithHash.Stored} on success containing the hash of the value stored.
   * {@link CacheSetWithHash.NotStored} on not storing the new value.
   * {@link CacheSetWithHash.Error} on failure.
   */
  public async setWithHash(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    options?: SetWithHashOptions
  ): Promise<CacheSetWithHash.Response> {
    const client = this.getNextDataClient();
    return await client.setWithHash(cacheName, key, value, options);
  }

  /**
   * Removes the given key from the cache. The key can represent a single value
   * or a collection.
   *
   * @param {string} cacheName - The cache to delete from.
   * @param {string | Uint8Array} key - The key to delete.
   * @param {DeleteOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheDelete.Response>} -
   * {@link CacheDelete.Success} on success.
   * {@link CacheDelete.Error} on failure.
   */
  public async delete(
    cacheName: string,
    key: string | Uint8Array,
    options?: DeleteOptions
  ): Promise<CacheDelete.Response> {
    const client = this.getNextDataClient();
    return await client.delete(cacheName, key, options?.abortSignal);
  }

  /**
   * Gets the value stored for the given keys.
   *
   * @param {string} cacheName - The cache to perform the lookup in.
   * @param {string[] | Uint8Array[]} keys - The list of keys to look up.
   * @param {GetBatchOptions} [options]
   * @param {decompress} [options.decompress=false] - Whether to decompress the value. Overrides the client-wide
   * automatic decompression setting.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheGetBatch.Response>} -
   * {@link CacheGetBatch.Success} containing the values if they were found.
   * {@link CacheGetBatch.Error} on failure.
   */
  public async getBatch(
    cacheName: string,
    keys: Array<string | Uint8Array>,
    options?: GetBatchOptions
  ): Promise<CacheGetBatch.Response> {
    return await this.getNextDataClient().getBatch(cacheName, keys, options);
  }

  /**
   * Associates the given keys with the given values. If a value for the key is
   * already present it is replaced with the new value.
   *
   * @param {string} cacheName - The cache to store the values in.
   * @param {Record<string, string | Uint8Array | SetBatchItem> | Map<string | Uint8Array, string | Uint8Array | SetBatchItem>} items - The key-value pairs to be stored, with the option to set a TTL per item.
   * @param {SetBatchOptions} [options]
   * @param {number} [options.ttl] - The time to live for the items in the cache.
   * Uses the client's default TTL if this is not supplied.
   * @param {boolean} [options.compress=false] - Whether to compress the value. Defaults to false.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSetBatch.Response>} -
   * {@link CacheSetBatch.Success} on success.
   * {@link CacheSetBatch.Error} on failure.
   */
  public async setBatch(
    cacheName: string,
    items:
      | Record<string, string | Uint8Array>
      | Map<string | Uint8Array, string | Uint8Array>
      | Array<SetBatchItem>,
    options?: SetBatchOptions
  ): Promise<CacheSetBatch.Response> {
    const client = this.getNextDataClient();
    return await client.setBatch(cacheName, items, options);
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
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheListConcatenateBack.Response>} -
   * {@link CacheListConcatenateBack.Success} on success.
   * {@link CacheListConcatenateBack.Error} on failure.
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
      options?.ttl,
      options?.abortSignal
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
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheListConcatenateFront.Response>} -
   * {@link CacheListConcatenateFront.Success} on success.
   * {@link CacheListConcatenateFront.Error} on failure.
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
      options?.ttl,
      options?.abortSignal
    );
  }

  /**
   * Fetches all elements of the given list.
   *
   * @param {string} cacheName - The cache containing the list.
   * @param {string} listName - The list to fetch.
   * @param {ListFetchCallOptions} [options]
   * @param {number} [options.startIndex] - Start inclusive index for fetch operation.
   * @param {number} [options.endIndex] - End exclusive index for fetch operation.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheListFetch.Response>} -
   * {@link CacheListFetch.Hit} containing the list elements if the list exists.
   * {@link CacheListFetch.Miss} if the list does not exist.
   * {@link CacheListFetch.Error} on failure.
   */
  public async listFetch(
    cacheName: string,
    listName: string,
    options?: ListFetchCallOptions
  ): Promise<CacheListFetch.Response> {
    const client = this.getNextDataClient();
    return await client.listFetch(
      cacheName,
      listName,
      options?.startIndex,
      options?.endIndex,
      options?.abortSignal
    );
  }

  /**
   * Gets the number of elements in the given list.
   *
   * @param {string} cacheName - The cache containing the list.
   * @param {string} listName - The list to get the length of.
   * @param {ListLengthOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheListLength.Response>} -
   * {@link CacheListLength.Hit} containing the length if the list exists.
   * {@link CacheListLength.Miss} if the list does not exist.
   * {@link CacheListLength.Error} on failure.
   */
  public async listLength(
    cacheName: string,
    listName: string,
    options?: ListLengthOptions
  ): Promise<CacheListLength.Response> {
    const client = this.getNextDataClient();
    return await client.listLength(cacheName, listName, options?.abortSignal);
  }

  /**
   * Gets and removes the last value from the given list.
   *
   * @param {string} cacheName - The cache containing the list.
   * @param {string} listName - The list to pop.
   * @param {ListPopBackOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheListPopBack.Response>} -
   * {@link CacheListPopBack.Hit} containing the element if the list exists.
   * {@link CacheListPopBack.Miss} if the list does not exist.
   * {@link CacheListPopBack.Error} on failure.
   */
  public async listPopBack(
    cacheName: string,
    listName: string,
    options?: ListPopBackOptions
  ): Promise<CacheListPopBack.Response> {
    const client = this.getNextDataClient();
    return await client.listPopBack(cacheName, listName, options?.abortSignal);
  }

  /**
   * Gets and removes the first value from the given list.
   *
   * @param {string} cacheName - The cache containing the list.
   * @param {string} listName - The list to pop.
   * @param {ListPopFrontOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheListPopFront.Response>} -
   * {@link CacheListPopFront.Hit} containing the element if the list exists.
   * {@link CacheListPopFront.Miss} if the list does not exist.
   * {@link CacheListPopFront.Error} on failure.
   */
  public async listPopFront(
    cacheName: string,
    listName: string,
    options?: ListPopFrontOptions
  ): Promise<CacheListPopFront.Response> {
    const client = this.getNextDataClient();
    return await client.listPopFront(cacheName, listName, options?.abortSignal);
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
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheListPushBack.Response>} -
   * {@link CacheListPushBack.Success} containing the list's new length on
   * success.
   * {@link CacheListPushBack.Error} on failure.
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
      options?.ttl,
      options?.abortSignal
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
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheListPushFront.Response>} -
   * {@link CacheListPushFront.Success} containing the list's new length on
   * success.
   * {@link CacheListPushFront.Error} on failure.
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
      options?.ttl,
      options?.abortSignal
    );
  }

  /**
   * Removes all elements from the given list equal to the given value.
   *
   * @param {string} cacheName - The cache containing the list.
   * @param {string} listName - The list to remove from.
   * @param {string | Uint8Array} value - The value to remove.
   * @param {ListRemoveValueOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheListRemoveValue.Response>} -
   * {@link CacheListRemoveValue.Success} on success. Removing an element that
   * does not occur in the list or removing from a non-existent list counts as a
   * success.
   * {@link CacheListRemoveValue.Error} on failure.
   */
  public async listRemoveValue(
    cacheName: string,
    listName: string,
    value: string | Uint8Array,
    options?: ListRemoveValueOptions
  ): Promise<CacheListRemoveValue.Response> {
    const client = this.getNextDataClient();
    return await client.listRemoveValue(
      cacheName,
      listName,
      value,
      options?.abortSignal
    );
  }

  /**
   * Retains slice of elements of a given list, deletes the rest of the list
   * that isn't being retained. Returns a Success or Error.
   *
   * @param {string} cacheName - The cache containing the list.
   * @param {string} listName - The list to retain a slice of.
   * @param {ListRetainCallOptions} [options]
   * @param {number} [options.startIndex] - Start inclusive index for fetch
   * operation. Defaults to start of array if not given, 0.
   * @param {number} [options.endIndex] - End exclusive index for fetch
   * operation. Defaults to end of array if not given.
   * @param {CollectionTtl} [options.ttl] - How the TTL should be managed.
   * Refreshes the list's TTL using the client's default if this is not
   * supplied.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheListRetain.Response>} -
   * {@link CacheListRetain.Success} on success.
   * {@link CacheListRetain.Error} on failure.
   */
  public async listRetain(
    cacheName: string,
    listName: string,
    options?: ListRetainCallOptions
  ): Promise<CacheListRetain.Response> {
    const client = this.getNextDataClient();
    return await client.listRetain(
      cacheName,
      listName,
      options?.startIndex,
      options?.endIndex,
      options?.ttl,
      options?.abortSignal
    );
  }

  /**
   * Fetches all elements of the given set
   *
   * @param {string} cacheName - The cache containing the set.
   * @param {string} setName - The set to fetch.
   * @param {SetFetchOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSetFetch.Response>} -
   * {@link CacheSetFetch.Hit} containing the set elements if the set exists.
   * {@link CacheSetFetch.Miss} if the set does not exist.
   * {@link CacheSetFetch.Error} on failure.
   */
  public async setFetch(
    cacheName: string,
    setName: string,
    options?: SetFetchOptions
  ): Promise<CacheSetFetch.Response> {
    const client = this.getNextDataClient();
    return await client.setFetch(cacheName, setName, options?.abortSignal);
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
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSetAddElement.Response>} -
   * {@link CacheSetAddElement.Success} on success.
   * {@link CacheSetAddElement.Error} on failure.
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
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSetAddElements.Response>} -
   * {@link CacheSetAddElements.Success} on success.
   * {@link CacheSetAddElements.Error} on failure.
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
      options?.ttl,
      options?.abortSignal
    );
  }

  /**
   * Tests if the given set contains the given element.
   * @param cacheName - The cache containing the set.
   * @param setName - The set to check.
   * @param element - The element to check for.
   * @param {SetContainsElementsOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSetContainsElement.Response>} -
   * {@link CacheSetContainsElement.Hit} if the set exists and contains the element.
   * {@link CacheSetContainsElement.Miss} if the set does not contain the element.
   * {@link CacheSetContainsElement.Error} on failure.
   */
  public async setContainsElement(
    cacheName: string,
    setName: string,
    element: string | Uint8Array,
    options?: SetContainsElementsOptions
  ): Promise<CacheSetContainsElement.Response> {
    const client = this.getNextDataClient();
    return await client.setContainsElement(
      cacheName,
      setName,
      element,
      options?.abortSignal
    );
  }

  /**
   * Tests if the given set contains the given elements.
   * @param cacheName - The cache containing the set.
   * @param setName - The set to check.
   * @param elements - The elements to check for.
   * @param {SetContainsElementsOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSetContainsElements.Response>} -
   * {@link CacheSetContainsElements.Hit} containing the elements to their presence in the cache.
   * {@link CacheSetContainsElements.Miss} if the set does not contain the elements.
   * {@link CacheSetContainsElements.Error} on failure.
   */
  public async setContainsElements(
    cacheName: string,
    setName: string,
    elements: string[] | Uint8Array[],
    options?: SetContainsElementsOptions
  ): Promise<CacheSetContainsElements.Response> {
    const client = this.getNextDataClient();
    return await client.setContainsElements(
      cacheName,
      setName,
      elements,
      options?.abortSignal
    );
  }

  /**
   * Removes an element from the given set.
   *
   * @param {string} cacheName - The cache containing the set.
   * @param {string} setName - The set to remove from.
   * @param {string | Uint8Array} element - The element to remove.
   * @param {SetRemoveElementsOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSetRemoveElement.Response>} -
   * {@link CacheSetRemoveElement.Success} on success. Removing an element that
   * does not occur in the set or removing from a non-existent set counts as a
   * success.
   * {@link CacheSetRemoveElement.Error} on failure.
   */
  public async setRemoveElement(
    cacheName: string,
    setName: string,
    element: string | Uint8Array,
    options?: SetRemoveElementsOptions
  ): Promise<CacheSetRemoveElement.Response> {
    return (
      await this.setRemoveElements(
        cacheName,
        setName,
        [element] as string[] | Uint8Array[],
        options
      )
    ).toSingularResponse();
  }

  /**
   * Removes multiple elements from the given set.
   *
   * @param {string} cacheName - The cache containing the set.
   * @param {string} setName - The set to remove from.
   * @param {string[] | Uint8Array[]} elements - The elements to remove.
   * @param {SetRemoveElementsOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSetRemoveElements.Response>} -
   * {@link CacheSetRemoveElements.Success} on success. Removing elements that
   * do not occur in the set or removing from a non-existent set counts as a
   * success.
   * {@link CacheSetRemoveElements.Error} on failure.
   */
  public async setRemoveElements(
    cacheName: string,
    setName: string,
    elements: string[] | Uint8Array[],
    options?: SetRemoveElementsOptions
  ): Promise<CacheSetRemoveElements.Response> {
    const client = this.getNextDataClient();
    return await client.setRemoveElements(
      cacheName,
      setName,
      elements,
      options?.abortSignal
    );
  }

  /**
   * Fetch a random sample of elements from the set.
   * Returns a different random sample for each call.
   *
   * @param {string} cacheName - The cache containing the set.
   * @param {string} setName - The set to remove from.
   * @param {number} limit - The maximum number of elements to return.
   * If the set contains fewer than 'limit' elements, the entire set will be returned.
   * @param {SetSampleOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSetSample.Response>} -
   * {@link CacheSetSample.Hit} containing the set elements if the set exists.
   * {@link CacheSetSample.Miss} if the set does not exist.
   * {@link CacheSetSample.Error} on failure.
   */
  public async setSample(
    cacheName: string,
    setName: string,
    limit: number,
    options?: SetSampleOptions
  ): Promise<CacheSetSample.Response> {
    const client = this.getNextDataClient();
    return await client.setSample(
      cacheName,
      setName,
      limit,
      options?.abortSignal
    );
  }

  /**
   * Pops a random sample of elements from the set.
   *
   * @param {string} cacheName - The cache containing the set.
   * @param {string} setName - The set to remove from.
   * @param {number} count - The maximum number of elements to return.
   * @param {SetPopOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * If the set contains fewer than 'limit' elements, the entire set will be returned.
   * @returns {Promise<CacheSetPop.Response>} -
   * {@link CacheSetPop.Hit} containing the set elements if the set exists.
   * {@link CacheSetPop.Miss} if the set does not exist.
   * {@link CacheSetPop.Error} on failure.
   */
  public async setPop(
    cacheName: string,
    setName: string,
    count: number,
    options?: SetPopOptions
  ): Promise<CacheSetPop.Response> {
    const client = this.getNextDataClient();
    return await client.setPop(cacheName, setName, count, options?.abortSignal);
  }

  /**
   * Get the number of elements in the set.
   *
   * @param {string} cacheName - The cache containing the set.
   * @param {string} setName - The set to remove from.
   * @param {SetLengthOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSetLength.Response>} -
   * {@link CacheSetLength.Hit} containing the set elements if the set exists.
   * {@link CacheSetLength.Miss} if the set does not exist.
   * {@link CacheSetLength.Error} on failure.
   */
  public async setLength(
    cacheName: string,
    setName: string,
    options?: SetLengthOptions
  ): Promise<CacheSetLength.Response> {
    const client = this.getNextDataClient();
    return await client.setLength(cacheName, setName, options?.abortSignal);
  }

  /**
   * Associates the given key with the given value if key is not already present in the cache.
   *
   * @deprecated Use setIfAbsent instead.
   * @param {string} cacheName - The cache to store the value in.
   * @param {string | Uint8Array} key - The key to set.
   * @param {string | Uint8Array} field - The value to be stored.
   * @param {SetIfNotExistsOptions} [options]
   * @param {number} [options.ttl] - The time to live for the item in the cache.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * Uses the client's default TTL if this is not supplied.
   * @returns {Promise<CacheSetIfNotExists.Response>} -
   * {@link CacheSetIfNotExists.Stored} on storing the new value.
   * {@link CacheSetIfNotExists.NotStored} on not storing the new value.
   * {@link CacheSetIfNotExists.Error} on failure.
   */
  public async setIfNotExists(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    options?: SetIfNotExistsOptions
  ): Promise<CacheSetIfNotExists.Response> {
    const client = this.getNextDataClient();
    return await client.setIfNotExists(
      cacheName,
      key,
      field,
      options?.ttl,
      options?.abortSignal
    );
  }

  /**
   * Associates the given key with the given value if key is not already present in the cache.
   *
   * @param {string} cacheName - The cache to store the value in.
   * @param {string | Uint8Array} key - The key to set.
   * @param {string | Uint8Array} field - The value to be stored.
   * @param {SetIfAbsentOptions} [options]
   * @param {number} [options.ttl] - The time to live for the item in the cache.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * Uses the client's default TTL if this is not supplied.
   * @param {boolean} [options.compress=false] - Whether to compress the value. Defaults to false.
   * @returns {Promise<CacheSetIfAbsent.Response>} -
   * {@link CacheSetIfAbsent.Stored} on storing the new value.
   * {@link CacheSetIfAbsent.NotStored} on not storing the new value.
   * {@link CacheSetIfAbsent.Error} on failure.
   */
  public async setIfAbsent(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    options?: SetIfAbsentOptions
  ): Promise<CacheSetIfAbsent.Response> {
    const client = this.getNextDataClient();
    return await client.setIfAbsent(cacheName, key, field, options);
  }

  /**
   * Associates the given key with the given value if the key is present in the cache.
   *
   * @param {string} cacheName - The cache to store the value in.
   * @param {string | Uint8Array} key - The key to set.
   * @param {string | Uint8Array} field - The value to be stored.
   * @param {SetIfPresentOptions} [options]
   * @param {number} [options.ttl] - The time to live for the item in the cache.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * Uses the client's default TTL if this is not supplied.
   * @returns {Promise<CacheSetIfPresent.Response>} -
   * {@link CacheSetIfPresent.Stored} on storing the new value.
   * {@link CacheSetIfPresent.NotStored} on not storing the new value.
   * {@link CacheSetIfPresent.Error} on failure.
   */
  public async setIfPresent(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    options?: SetIfPresentOptions
  ): Promise<CacheSetIfPresent.Response> {
    const client = this.getNextDataClient();
    return await client.setIfPresent(
      cacheName,
      key,
      field,
      options?.ttl,
      options?.abortSignal
    );
  }

  /**
   * Associates the given key with the given value if the key is present in the cache
   * and its value is equal to the supplied `equal` value.
   *
   * @param {string} cacheName - The cache to store the value in.
   * @param {string | Uint8Array} key - The key to set.
   * @param {string | Uint8Array} field - The value to be stored.
   * @param {string | Uint8Array} equal - The value to compare to the cached value.
   * @param {SetIfEqualOptions} [options]
   * @param {number} [options.ttl] - The time to live for the item in the cache.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * Uses the client's default TTL if this is not supplied.
   * @returns {Promise<CacheSetIfEqual.Response>} -
   * {@link CacheSetIfEqual.Stored} on storing the new value.
   * {@link CacheSetIfEqual.NotStored} on not storing the new value.
   * {@link CacheSetIfEqual.Error} on failure.
   */
  public async setIfEqual(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    equal: string | Uint8Array,
    options?: SetIfEqualOptions
  ): Promise<CacheSetIfEqual.Response> {
    const client = this.getNextDataClient();
    return await client.setIfEqual(
      cacheName,
      key,
      field,
      equal,
      options?.ttl,
      options?.abortSignal
    );
  }

  /**
   * Associates the given key with the given value if the key does not exist in the cache or
   * if the value for the key is not equal to the supplied `notEqual` parameter.
   *
   * @param {string} cacheName - The cache to store the value in.
   * @param {string | Uint8Array} key - The key to set.
   * @param {string | Uint8Array} field - The value to be stored.
   * @param {string | Uint8Array} notEqual - The value to compare to the cached value.
   * @param {SetIfNotEqualOptions} [options]
   * @param {number} [options.ttl] - The time to live for the item in the cache.
   * Uses the client's default TTL if this is not supplied.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSetIfNotEqual.Response>} -
   * {@link CacheSetIfNotEqual.Stored} on storing the new value.
   * {@link CacheSetIfNotEqual.NotStored} on not storing the new value.
   * {@link CacheSetIfNotEqual.Error} on failure.
   */
  public async setIfNotEqual(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    notEqual: string | Uint8Array,
    options?: SetIfNotEqualOptions
  ): Promise<CacheSetIfNotEqual.Response> {
    const client = this.getNextDataClient();
    return await client.setIfNotEqual(
      cacheName,
      key,
      field,
      notEqual,
      options?.ttl,
      options?.abortSignal
    );
  }

  /**
   * Associates the given key with the given value if key is present in the cache
   * and its value is not equal to the supplied `notEqual` value.
   *
   * @param {string} cacheName - The cache to store the value in.
   * @param {string | Uint8Array} key - The key to set.
   * @param {string | Uint8Array} field - The value to be stored.
   * @param {string | Uint8Array} notEqual - The value to compare to the cached value.
   * @param {SetIfAbsentOptions} [options]
   * @param {number} [options.ttl] - The time to live for the item in the cache.
   * Uses the client's default TTL if this is not supplied.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSetIfPresentAndNotEqual.Response>} -
   * {@link CacheSetIfPresentAndNotEqual.Stored} on storing the new value.
   * {@link CacheSetIfPresentAndNotEqual.NotStored} on not storing the new value.
   * {@link CacheSetIfPresentAndNotEqual.Error} on failure.
   */
  public async setIfPresentAndNotEqual(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    notEqual: string | Uint8Array,
    options?: SetIfPresentAndNotEqualOptions
  ): Promise<CacheSetIfPresentAndNotEqual.Response> {
    const client = this.getNextDataClient();
    return await client.setIfPresentAndNotEqual(
      cacheName,
      key,
      field,
      notEqual,
      options?.ttl,
      options?.abortSignal
    );
  }

  /**
   * Associates the given key with the given value if key is absent or if the key is
   * present and its value is equal to the given value.
   *
   * @param {string} cacheName - The cache to store the value in.
   * @param {string | Uint8Array} key - The key to set.
   * @param {string | Uint8Array} field - The value to be stored.
   * @param {string | Uint8Array} equal - The value to compare to the cached value.
   * @param {SetIfAbsentOrEqualOptions} [options]
   * @param {number} [options.ttl] - The time to live for the item in the cache.
   * Uses the client's default TTL if this is not supplied.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSetIfAbsentOrEqual.Response>} -
   * {@link CacheSetIfAbsentOrEqual.Stored} on storing the new value.
   * {@link CacheSetIfAbsentOrEqual.NotStored} on not storing the new value.
   * {@link CacheSetIfAbsentOrEqual.Error} on failure.
   */
  public async setIfAbsentOrEqual(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    equal: string | Uint8Array,
    options?: SetIfAbsentOrEqualOptions
  ): Promise<CacheSetIfAbsentOrEqual.Response> {
    const client = this.getNextDataClient();
    return await client.setIfAbsentOrEqual(
      cacheName,
      key,
      field,
      equal,
      options?.ttl,
      options?.abortSignal
    );
  }

  /**
   * Associates the given key with the given value if key is present in the cache
   * and its hash is equal to the supplied 'hashEqual' hash.
   *
   * @param {string} cacheName - The cache to store the value in.
   * @param {string | Uint8Array} key - The key to set.
   * @param {string | Uint8Array} value - The value to be stored.
   * @param {Uint8Array} hashEqual - The hash to compare to the cached hash.
   * @param {SetIfPresentAndHashEqualOptions} [options]
   * @param {number} [options.ttl] - The time to live for the item in the cache.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * Uses the client's default TTL if this is not supplied.
   * @returns {Promise<CacheSetIfPresentAndHashEqual.Response>} -
   * {@link CacheSetIfPresentAndHashEqual.Stored} on storing the new value.
   * {@link CacheSetIfPresentAndHashEqual.NotStored} on not storing the new value.
   * {@link CacheSetIfPresentAndHashEqual.Error} on failure.
   */
  public async setIfPresentAndHashEqual(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    hashEqual: Uint8Array,
    options?: SetIfPresentAndHashEqualOptions
  ): Promise<CacheSetIfPresentAndHashEqual.Response> {
    const client = this.getNextDataClient();
    return await client.setIfPresentAndHashEqual(
      cacheName,
      key,
      value,
      hashEqual,
      options?.ttl,
      options?.abortSignal
    );
  }

  /**
   * Associates the given key with the given value if key is present in the cache
   * and its hash is not equal to the supplied 'hashNotEqual' hash.
   *
   * @param {string} cacheName - The cache to store the value in.
   * @param {string | Uint8Array} key - The key to set.
   * @param {string | Uint8Array} value - The value to be stored.
   * @param {Uint8Array} hashNotEqual - The hash to compare to the cached hash.
   * @param {SetIfPresentAndHashNotEqualOptions} [options]
   * @param {number} [options.ttl] - The time to live for the item in the cache.
   * Uses the client's default TTL if this is not supplied.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSetIfPresentAndHashNotEqual.Response>} -
   * {@link CacheSetIfPresentAndHashNotEqual.Stored} on storing the new value.
   * {@link CacheSetIfPresentAndHashNotEqual.NotStored} on not storing the new value.
   * {@link CacheSetIfPresentAndHashNotEqual.Error} on failure.
   */
  public async setIfPresentAndHashNotEqual(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    hashNotEqual: Uint8Array,
    options?: SetIfPresentAndHashNotEqualOptions
  ): Promise<CacheSetIfPresentAndHashNotEqual.Response> {
    const client = this.getNextDataClient();
    return await client.setIfPresentAndHashNotEqual(
      cacheName,
      key,
      value,
      hashNotEqual,
      options?.ttl,
      options?.abortSignal
    );
  }

  /**
   * Associates the given key with the given value if key is absent or if the key is
   * present and its value's hash is equal to the given 'hashEqual' hash.
   *
   * @param {string} cacheName - The cache to store the value in.
   * @param {string | Uint8Array} key - The key to set.
   * @param {string | Uint8Array} value - The value to be stored.
   * @param {string | Uint8Array} hashEqual - The value to compare to the cached value.
   * @param {setIfAbsentOrHashEqualOptions} [options]
   * @param {number} [options.ttl] - The time to live for the item in the cache.
   * Uses the client's default TTL if this is not supplied.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSetIfAbsentOrHashEqual.Response>} -
   * {@link CacheSetIfAbsentOrHashEqual.Stored} on storing the new value.
   * {@link CacheSetIfAbsentOrHashEqual.NotStored} on not storing the new value.
   * {@link CacheSetIfAbsentOrHashEqual.Error} on failure.
   */
  public async setIfAbsentOrHashEqual(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    hashEqual: Uint8Array,
    options?: SetIfAbsentOrHashEqualOptions
  ): Promise<CacheSetIfAbsentOrHashEqual.Response> {
    const client = this.getNextDataClient();
    return await client.setIfAbsentOrHashEqual(
      cacheName,
      key,
      value,
      hashEqual,
      options?.ttl,
      options?.abortSignal
    );
  }

  /**
   * Associates the given key with the given value if key is absent or if the key is
   * present and its value's hash is not equal to the given 'hashNotEqual' hash.
   *
   * @param {string} cacheName - The cache to store the value in.
   * @param {string | Uint8Array} key - The key to set.
   * @param {string | Uint8Array} value - The value to be stored.
   * @param {string | Uint8Array} hashNotEqual - The value to compare to the cached value.
   * @param {SetIfAbsentOrHashNotEqualOptions} [options]
   * @param {number} [options.ttl] - The time to live for the item in the cache.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * Uses the client's default TTL if this is not supplied.
   * @returns {Promise<CacheSetIfAbsentOrHashNotEqual.Response>} -
   * {@link CacheSetIfAbsentOrHashNotEqual.Stored} on storing the new value.
   * {@link CacheSetIfAbsentOrHashNotEqual.NotStored} on not storing the new value.
   * {@link CacheSetIfAbsentOrHashNotEqual.Error} on failure.
   */
  public async setIfAbsentOrHashNotEqual(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    hashNotEqual: Uint8Array,
    options?: SetIfAbsentOrHashNotEqualOptions
  ): Promise<CacheSetIfAbsentOrHashNotEqual.Response> {
    const client = this.getNextDataClient();
    return await client.setIfAbsentOrHashNotEqual(
      cacheName,
      key,
      value,
      hashNotEqual,
      options?.ttl,
      options?.abortSignal
    );
  }

  /**
   * Flushes / clears all the items of the given cache
   *
   * @param {string} cacheName - The cache to be flushed.
   * @returns {Promise<CacheFlush.Response>} -
   * {@link CacheFlush.Success} on success.
   * {@link CacheFlush.Error} on failure.
   */
  public async flushCache(
    cacheName: string,
    options?: CacheOptions
  ): Promise<CacheFlush.Response> {
    return await this.controlClient.flushCache(cacheName, options);
  }

  /**
   * Fetches all elements of the given dictionary.
   *
   * @param {string} cacheName - The cache to perform the lookup in.
   * @param {string} dictionaryName - The dictionary to fetch.
   * @param {DictionaryFetchOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheDictionaryFetch.Response>} -
   * {@link CacheDictionaryFetch.Hit} containing the dictionary elements if the
   * dictionary exists.
   * {@link CacheDictionaryFetch.Miss} if the dictionary does not exist.
   * {@link CacheDictionaryFetch.Error} on failure.
   */
  public async dictionaryFetch(
    cacheName: string,
    dictionaryName: string,
    options?: DictionaryFetchOptions
  ): Promise<CacheDictionaryFetch.Response> {
    const client = this.getNextDataClient();
    return await client.dictionaryFetch(
      cacheName,
      dictionaryName,
      options?.abortSignal
    );
  }

  /**
   * Adds an integer quantity to a field value.
   *
   * @remarks
   * Incrementing the value of a missing field sets the value to amount.
   *
   * @param {string} cacheName - The cache containing the field.
   * @param {string | Uint8Array} field - The field to increment.
   * @param {number} amount - The quantity to add to the value. May be positive,
   * negative, or zero. Defaults to 1.
   * @param {IncrementOptions} options
   * @param {CollectionTtl} [options.ttl] - How the TTL should be managed.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheIncrement>} -
   * {@link CacheIncrement.Success} containing the incremented value
   * on success.
   * {@link CacheIncrement.Error} on failure. Incrementing a value
   * that was not set using this method or is not the string representation of
   * an integer results in a failure with a FailedPreconditionException error.
   */
  public async increment(
    cacheName: string,
    field: string | Uint8Array,
    amount = 1,
    options?: IncrementOptions
  ): Promise<CacheIncrement.Response> {
    const client = this.getNextDataClient();
    return await client.increment(
      cacheName,
      field,
      amount,
      options?.ttl,
      options?.abortSignal
    );
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
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheDictionarySetField.Response>} -
   * {@link CacheDictionarySetField.Success} on success.
   * {@link CacheDictionarySetField.Error} on failure.
   */
  public async dictionarySetField(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array,
    value: string | Uint8Array,
    options?: DictionarySetFieldOptions
  ): Promise<CacheDictionarySetField.Response> {
    const client = this.getNextDataClient();
    return await client.dictionarySetField(
      cacheName,
      dictionaryName,
      field,
      value,
      options?.ttl,
      options?.abortSignal
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
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheDictionarySetFields.Response>} -
   * {@link CacheDictionarySetFields.Success} on success.
   * {@link CacheDictionarySetFields.Error} on failure.
   */
  public async dictionarySetFields(
    cacheName: string,
    dictionaryName: string,
    elements:
      | Map<string | Uint8Array, string | Uint8Array>
      | Record<string, string | Uint8Array>
      | Array<[string, string | Uint8Array]>,
    options?: DictionarySetFieldsOptions
  ): Promise<CacheDictionarySetFields.Response> {
    const client = this.getNextDataClient();
    return await client.dictionarySetFields(
      cacheName,
      dictionaryName,
      elements,
      options?.ttl,
      options?.abortSignal
    );
  }

  /**
   * Gets the value stored for the given dictionary and field.
   *
   * @param {string} cacheName - The cache containing the dictionary.
   * @param {string} dictionaryName - The dictionary to look up.
   * @param {string | Uint8Array} field - The field to look up.
   * @param {DictionaryGetFieldOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheDictionaryGetField.Response>} -
   * {@link CacheDictionaryGetField.Hit} containing the dictionary element if
   * one is found.
   * {@link CacheDictionaryGetField.Miss} if the dictionary does not exist.
   * {@link CacheDictionaryGetField.Error} on failure.
   */
  public async dictionaryGetField(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array,
    options?: DictionaryGetFieldOptions
  ): Promise<CacheDictionaryGetField.Response> {
    const client = this.getNextDataClient();
    return await client.dictionaryGetField(
      cacheName,
      dictionaryName,
      field,
      options?.abortSignal
    );
  }

  /**
   * Gets multiple values from the given dictionary.
   *
   * @param {string} cacheName - The cache containing the dictionary.
   * @param {string} dictionaryName - The dictionary to look up.
   * @param {string[] | Uint8Array[]} fields - The fields to look up.
   * @param {DictionaryGetFieldOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheDictionaryGetFields.Response>} -
   * {@link CacheDictionaryGetFields.Hit} containing the dictionary elements if
   * the dictionary exists.
   * {@link CacheDictionaryGetFields.Miss} if the dictionary does not exist.
   * {@link CacheDictionaryGetFields.Error} on failure.
   */
  public async dictionaryGetFields(
    cacheName: string,
    dictionaryName: string,
    fields: string[] | Uint8Array[],
    options?: DictionaryGetFieldOptions
  ): Promise<CacheDictionaryGetFields.Response> {
    const client = this.getNextDataClient();
    return await client.dictionaryGetFields(
      cacheName,
      dictionaryName,
      fields,
      options?.abortSignal
    );
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
   * @param {DictionaryRemoveFieldOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheDictionaryRemoveField.Response>} -
   * {@link CacheDictionaryRemoveField.Success} on success.
   * {@link CacheDictionaryRemoveField.Error} on failure.
   */
  public async dictionaryRemoveField(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array,
    options?: DictionaryRemoveFieldOptions
  ): Promise<CacheDictionaryRemoveField.Response> {
    const client = this.getNextDataClient();
    return await client.dictionaryRemoveField(
      cacheName,
      dictionaryName,
      field,
      options?.abortSignal
    );
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
   * @param {DictionaryRemoveFieldOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheDictionaryRemoveFields.Response>} -
   * {@link CacheDictionaryRemoveFields.Success} on success.
   * {@link CacheDictionaryRemoveFields.Error} on failure.
   */
  public async dictionaryRemoveFields(
    cacheName: string,
    dictionaryName: string,
    fields: string[] | Uint8Array[],
    options?: DictionaryRemoveFieldOptions
  ): Promise<CacheDictionaryRemoveFields.Response> {
    const client = this.getNextDataClient();
    return await client.dictionaryRemoveFields(
      cacheName,
      dictionaryName,
      fields,
      options?.abortSignal
    );
  }

  /**
   * Adds an integer quantity to a dictionary value.
   *
   * @remarks
   * Incrementing the value of a missing field sets the value to amount.
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
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheDictionaryIncrement.Response>} -
   * {@link CacheDictionaryIncrement.Success} containing the incremented value
   * on success.
   * {@link CacheDictionaryIncrement.Error} on failure. Incrementing a value
   * that was not set using this method or is not the string representation of
   * an integer results in a failure with a FailedPreconditionException error.
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
      options?.ttl,
      options?.abortSignal
    );
  }

  /**
   * Gets the number of elements in the given dictionary.
   *
   * @param {string} cacheName - The cache containing the dictionary.
   * @param {string} dictionaryName - The dictionary to get the length of.
   * @param {DictionaryLengthOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheDictionaryLength.Response>} -
   * {@link CacheDictionaryLength.Hit} containing the length if the dictionary exists.
   * {@link CacheDictionaryLength.Miss} if the dictionary does not exist.
   * {@link CacheDictionaryLength.Error} on failure.
   */
  public async dictionaryLength(
    cacheName: string,
    dictionaryName: string,
    options?: DictionaryLengthOptions
  ): Promise<CacheDictionaryLength.Response> {
    const client = this.getNextDataClient();
    return await client.dictionaryLength(
      cacheName,
      dictionaryName,
      options?.abortSignal
    );
  }

  /**
   * Adds an element to the given sorted set. If the element already exists, its
   * score is updated. Creates the sorted set if it does not exist.
   *
   * @param {string} cacheName - The cache containing the sorted set.
   * @param {string} sortedSetName - The sorted set to add to.
   * @param {string | Uint8Array} value - The value to add.
   * @param {number} score - The score to assign to the value.
   * @param {SortedSetPutElementOptions} options
   * @param {CollectionTtl} [options.ttl] - How the TTL should be managed.
   * Refreshes the sorted set's TTL using the client's default if this is not
   * supplied.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSortedSetPutElement.Response>} -
   * {@link CacheSortedSetPutElement.Success} on success.
   * {@link CacheSortedSetPutElement.Error} on failure.
   * @returns
   */
  public async sortedSetPutElement(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array,
    score: number,
    options?: SortedSetPutElementOptions
  ): Promise<CacheSortedSetPutElement.Response> {
    const client = this.getNextDataClient();
    return await client.sortedSetPutElement(
      cacheName,
      sortedSetName,
      value,
      score,
      options?.ttl,
      options?.abortSignal
    );
  }

  /**
   * Adds elements to the given sorted set. For any values that already exist, it
   * the score is updated. Creates the sorted set if it does not exist.
   *
   * @param {string} cacheName - The cache containing the sorted set.
   * @param {string} sortedSetName - The sorted set to add to.
   * @param {Map<string | Uint8Array, number>| Record<string, number>} elements - The value->score pairs to add to the sorted set.
   * @param {SortedSetPutElementOptions} options
   * @param {CollectionTtl} [options.ttl] - How the TTL should be managed.
   * Refreshes the sorted set's TTL using the client's default if this is not
   * supplied.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSortedSetPutElements.Response>} -
   * {@link CacheSortedSetPutElements.Success} on success.
   * {@link CacheSortedSetPutElements.Error} on failure.
   * @returns
   */
  public async sortedSetPutElements(
    cacheName: string,
    sortedSetName: string,
    elements:
      | Map<string | Uint8Array, number>
      | Record<string, number>
      | Array<[string, number]>,
    options?: SortedSetPutElementsOptions
  ): Promise<CacheSortedSetPutElements.Response> {
    const client = this.getNextDataClient();
    return await client.sortedSetPutElements(
      cacheName,
      sortedSetName,
      elements,
      options?.ttl,
      options?.abortSignal
    );
  }

  /**
   * Fetch the elements in the given sorted set by index (rank).
   *
   * @param {string} cacheName - The cache containing the sorted set.
   * @param {string} sortedSetName - The sorted set to fetch from.
   * @param {SortedSetFetchByRankOptions} options
   * @param {number} [options.startRank] - The rank of the first element to
   * fetch. Defaults to 0. This rank is inclusive, ie the element at this rank
   * will be fetched.
   * @param {number} [options.endRank] - The rank of the last element to fetch.
   * This rank is exclusive, ie the element at this rank will not be fetched.
   * Defaults to null, which fetches up until and including the last element.
   * @param {SortedSetOrder} [options.order] - The order to fetch the elements in.
   * Defaults to ascending.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSortedSetFetch.Response>}
   * {@link CacheSortedSetFetch.Hit} containing the requested elements when found.
   * {@link CacheSortedSetFetch.Miss} when the sorted set does not exist.
   * {@link CacheSortedSetFetch.Error} on failure.
   */
  public async sortedSetFetchByRank(
    cacheName: string,
    sortedSetName: string,
    options?: SortedSetFetchByRankOptions
  ): Promise<CacheSortedSetFetch.Response> {
    const client = this.getNextDataClient();
    return await client.sortedSetFetchByRank(
      cacheName,
      sortedSetName,
      options?.order ?? SortedSetOrder.Ascending,
      options?.startRank ?? 0,
      options?.endRank,
      options?.abortSignal
    );
  }

  /**
   * Fetch the elements in the given sorted set by score.
   *
   * @param {string} cacheName - The cache containing the sorted set.
   * @param {string} sortedSetName - The sorted set to fetch from.
   * @param {SortedSetFetchByScoreOptions} options
   * @param {number} [options.minScore] - The minimum score (inclusive) of the
   * elements to fetch. Defaults to negative infinity.
   * @param {number} [options.maxScore] - The maximum score (inclusive) of the
   * elements to fetch. Defaults to positive infinity.
   * @param {SortedSetOrder} [options.order] - The order to fetch the elements in.
   * Defaults to ascending.
   * @param {number} [options.offset] - The number of elements to skip before
   * returning the first element. Defaults to 0. Note: this is not the rank of
   * the first element to return, but the number of elements of the result set
   * to skip before returning the first element.
   * @param {number} [options.count] - The maximum number of elements to return.
   * Defaults to undefined, which returns all elements.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSortedSetFetch.Response>} -
   * {@link CacheSortedSetFetch.Hit} containing the requested elements when found.
   * {@link CacheSortedSetFetch.Miss} when the sorted set does not exist.
   * {@link CacheSortedSetFetch.Error} on failure.
   */
  public async sortedSetFetchByScore(
    cacheName: string,
    sortedSetName: string,
    options?: SortedSetFetchByScoreOptions
  ): Promise<CacheSortedSetFetch.Response> {
    const client = this.getNextDataClient();
    return await client.sortedSetFetchByScore(
      cacheName,
      sortedSetName,
      options?.order ?? SortedSetOrder.Ascending,
      options?.minScore,
      options?.maxScore,
      options?.offset,
      options?.count,
      options?.abortSignal
    );
  }

  /**
   * Look up the rank of an element in the sorted set, by the value of the element.
   *
   * @param {string} cacheName - The cache containing the sorted set.
   * @param {string} sortedSetName - The sorted set to fetch from.
   * @param {string | Uint8Array} value - The value of the element whose rank we are retrieving.
   * @param {SortedSetGetRankOptions} options
   * @param {SortedSetOrder} [options.order] - The order in which sorted set will be sorted to determine the rank.
   * Defaults to ascending.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSortedSetGetRank.Response>}
   * {@link CacheSortedSetGetRank.Hit} containing the rank of the requested elements when found.
   * {@link CacheSortedSetGetRank.Miss} when the element does not exist.
   * {@link CacheSortedSetGetRank.Error} on failure.
   */
  public async sortedSetGetRank(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array,
    options?: SortedSetGetRankOptions
  ): Promise<CacheSortedSetGetRank.Response> {
    const client = this.getNextDataClient();
    return await client.sortedSetGetRank(
      cacheName,
      sortedSetName,
      value,
      options?.order,
      options?.abortSignal
    );
  }

  /**
   * Look up the score of an element in the sorted set, by the value of the element.
   *
   * @param {string} cacheName - The cache containing the sorted set.
   * @param {string} sortedSetName - The sorted set to fetch from.
   * @param {string | Uint8Array} value - The value of the element whose score we are retrieving.
   * @param {SortedSetGetScoreOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSortedSetGetScore.Response>}
   * {@link CacheSortedSetGetScore.Hit} containing the score of the requested element when found.
   * {@link CacheSortedSetGetScore.Miss} when the element or collection does not exist.
   * {@link CacheSortedSetGetScore.Error} on failure.
   */
  public async sortedSetGetScore(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array,
    options?: SortedSetGetScoreOptions
  ): Promise<CacheSortedSetGetScore.Response> {
    const client = this.getNextDataClient();
    return await client.sortedSetGetScore(
      cacheName,
      sortedSetName,
      value,
      options?.abortSignal
    );
  }

  /**
   * Look up the scores of multiple elements in the sorted set, by the value of the elements.
   *
   * @param {string} cacheName - The cache containing the sorted set.
   * @param {string} sortedSetName - The sorted set to fetch from.
   * @param {string[] | Uint8Array[]} values - The values of the elements whose scores we are retrieving.
   * @param {SortedSetGetScoreOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSortedSetGetScores.Response>}
   * {@link CacheSortedSetGetScores.Hit} containing the scores of the requested elements when found.
   * {@link CacheSortedSetGetScores.Miss} when the element or collection does not exist.
   * {@link CacheSortedSetGetScores.Error} on failure.
   */
  public async sortedSetGetScores(
    cacheName: string,
    sortedSetName: string,
    values: string[] | Uint8Array[],
    options?: SortedSetGetScoreOptions
  ): Promise<CacheSortedSetGetScores.Response> {
    const client = this.getNextDataClient();
    return await client.sortedSetGetScores(
      cacheName,
      sortedSetName,
      values,
      options?.abortSignal
    );
  }

  /**
   * Increment the score of an element in the sorted set.
   *
   * @param {string} cacheName - The cache containing the sorted set.
   * @param {string} sortedSetName - The sorted set to fetch from.
   * @param {string | Uint8Array} value - The value of the element whose score we are incrementing.
   * @param {number} amount - The quantity to add to the score. May be positive,
   * negative, or zero. Defaults to 1.
   * @param {SortedSetIncrementOptions} options
   * @param {CollectionTtl} [options.ttl] - How the TTL should be managed.
   * Refreshes the sorted set's TTL using the client's default if this is not
   * supplied.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSortedSetIncrementScore.Response>} -
   * {@link CacheSortedSetIncrementScore.Success} containing the incremented score
   * on success.
   * {@link CacheSortedSetIncrementScore.Error} on failure. Incrementing a score
   * that was not set using this method or is not the string representation of
   * an integer results in a failure with a FailedPreconditionException error.
   */
  public async sortedSetIncrementScore(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array,
    amount?: number,
    options?: SortedSetIncrementOptions
  ): Promise<CacheSortedSetIncrementScore.Response> {
    const client = this.getNextDataClient();
    return await client.sortedSetIncrementScore(
      cacheName,
      sortedSetName,
      value,
      amount || 1,
      options?.ttl,
      options?.abortSignal
    );
  }

  /**
   * Remove an element from the sorted set
   * @param {string} cacheName - The cache containing the sorted set.
   * @param {string} sortedSetName - The sorted set to remove from.
   * @param {string | Uint8Array} value - The value of the element to remove from the set.
   * @param {SortedSetRemoveElementOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSortedSetRemoveElement.Response>}
   * {@link CacheSortedSetRemoveElement.Success} if the element was successfully removed
   * {@link CacheSortedSetIncrementScore.Error} on failure
   */
  public async sortedSetRemoveElement(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array,
    options?: SortedSetRemoveElementOptions
  ): Promise<CacheSortedSetRemoveElement.Response> {
    const client = this.getNextDataClient();
    return await client.sortedSetRemoveElement(
      cacheName,
      sortedSetName,
      value,
      options?.abortSignal
    );
  }

  /**
   * Remove multiple elements from the sorted set
   * @param {string} cacheName - The cache containing the sorted set.
   * @param {string} sortedSetName - The sorted set to remove from.
   * @param {string | Uint8Array} values - The values of the elements to remove from the set.
   * @param {SortedSetRemoveElementOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSortedSetRemoveElement.Response>}
   * {@link CacheSortedSetRemoveElement.Success} if the elements were successfully removed
   * {@link CacheSortedSetIncrementScore.Error} on failure
   */
  public async sortedSetRemoveElements(
    cacheName: string,
    sortedSetName: string,
    values: string[] | Uint8Array[],
    options?: SortedSetRemoveElementOptions
  ): Promise<CacheSortedSetRemoveElements.Response> {
    const client = this.getNextDataClient();
    return await client.sortedSetRemoveElements(
      cacheName,
      sortedSetName,
      values,
      options?.abortSignal
    );
  }

  /**
   * Fetch length (number of items) of sorted set
   * @param {string} cacheName - The cache containing the sorted set.
   * @param {string} sortedSetName - The sorted set name.
   * @param {SortedSetLengthOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSortedSetLength.Response>}
   * {@link CacheSortedSetLength.Hit} containing the length if the sorted set exists.
   * {@link CacheSortedSetLength.Miss} if the sorted set does not exist.
   * {@link CacheSortedSetLength.Error} on failure.
   */
  public async sortedSetLength(
    cacheName: string,
    sortedSetName: string,
    options?: SortedSetLengthOptions
  ): Promise<CacheSortedSetLength.Response> {
    const client = this.getNextDataClient();
    return await client.sortedSetLength(
      cacheName,
      sortedSetName,
      options?.abortSignal
    );
  }

  /**
   * Fetch length (number of items) of sorted set within the provided score range
   * @param {string} cacheName - The cache containing the sorted set.
   * @param {string} sortedSetName - The sorted set name.
   * @param {SortedSetLengthByScoreOptions} options - Optional parameter for specifying the score range to search in.
   * @param {number} [options.minScore] - The lower bound on the score range to search in.
   * @param {number} [options.maxScore] - The upper bound on the score range to search in.
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSortedSetLengthByScore.Response>}
   * {@link CacheSortedSetLengthByScore.Hit} containing the length if the sorted set exists.
   * {@link CacheSortedSetLengthByScore.Miss} if the sorted set does not exist.
   * {@link CacheSortedSetLengthByScore.Error} on failure.
   */
  public async sortedSetLengthByScore(
    cacheName: string,
    sortedSetName: string,
    options?: SortedSetLengthByScoreOptions
  ): Promise<CacheSortedSetLengthByScore.Response> {
    const client = this.getNextDataClient();
    return await client.sortedSetLengthByScore(
      cacheName,
      sortedSetName,
      options?.minScore,
      options?.maxScore,
      options?.abortSignal
    );
  }
  /**
   * Computes the union of all source sets and stores the result in itself. Returns the number of elements in the set after
   * sotring the result of the union
   * @param {string} cacheName - The cache containing the sorted set.
   * @param {string} sortedSetName - The sorted set name.
   * @param {SortedSetSource[]} sources - The array of source sets that will be unioned
   * @param {SortedSetAggregate} [options.aggregate] - The aggregate function to use to combine shared elements
   * @param {CollectionTtl} [options.ttl] - If the set does not exist, it is created with the given `ttl`.
   *                                 If it exists, it is overwritten with the result and its ttl is set to the given `ttl`
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheSortedSetUnionStore.Response>}
   * {@link CacheSortedSetUnionStore.Success} containing the length of the set which contains the result of the union.
   * {@link CacheSortedSetUnionStore.Error} on failure.
   */
  public async sortedSetUnionStore(
    cacheName: string,
    sortedSetName: string,
    sources: SortedSetSource[],
    options?: SortedSetUnionStoreOptions
  ): Promise<CacheSortedSetUnionStore.Response> {
    const client = this.getNextDataClient();
    return await client.sortedSetUnionStore(
      cacheName,
      sortedSetName,
      sources,
      options?.aggregate,
      options?.ttl,
      options?.abortSignal
    );
  }
  /**
   * Return the type of the key in the cache
   * @param {string} cacheName - The cache containing the key.
   * @param {string} key - The key for which type is requested.
   * @param {ItemGetTypeOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheItemGetType.Response>}
   * {@link CacheItemGetType.Hit} containing type of key when found.
   * {@link CacheItemGetType.Miss} when the key does not exist.
   * {@link CacheItemGetType.Error} on failure.
   */
  public async itemGetType(
    cacheName: string,
    key: string | Uint8Array,
    options?: ItemGetTypeOptions
  ): Promise<CacheItemGetType.Response> {
    const client = this.getNextDataClient();
    return await client.itemGetType(cacheName, key, options?.abortSignal);
  }

  /**
   * Return the remaining ttl of the key in the cache in milliseconds.
   * @param {string} cacheName - The cache containing the key.
   * @param {string} key - The key for which the ttl remaining is requested.
   * @param {ItemGetTtlOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheItemGetTtl.Response>}
   * {@link CacheItemGetTtl.Hit} containing ttl remaining of key when found.
   * {@link CacheItemGetTtl.Miss} when the key does not exist.
   * {@link CacheItemGetTtl.Error} on failure.
   */
  public async itemGetTtl(
    cacheName: string,
    key: string | Uint8Array,
    options?: ItemGetTtlOptions
  ): Promise<CacheItemGetTtl.Response> {
    const client = this.getNextDataClient();
    return await client.itemGetTtl(cacheName, key, options?.abortSignal);
  }

  /**
   * Check if the provided key exists in the cache
   * @param {string} cacheName - The cache to look in.
   * @param {string | Uint8Array} key - The key to look up.
   * @param {KeyExistsOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheKeyExists.Response>}
   * {@link CacheKeyExists.Success} returns boolean indicating whether the key was found.
   * {@link CacheKeyExists.Error} on failure.
   */
  public async keyExists(
    cacheName: string,
    key: string | Uint8Array,
    options?: KeyExistsOptions
  ): Promise<CacheKeyExists.Response> {
    const client = this.getNextDataClient();
    return await client.keyExists(cacheName, key, options?.abortSignal);
  }

  /**
   * Check if the provided keys exist in the cache
   * @param {string} cacheName - The cache to look in.
   * @param {string[] | Uint8Array[]} keys - The keys to look up.
   * @param {KeyExistsOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheKeysExist.Response>}
   * {@link CacheKeysExist.Success} returns list of booleans indicating whether each key was found.
   * {@link CacheKeysExist.Error} on failure.
   */
  public async keysExist(
    cacheName: string,
    keys: string[] | Uint8Array[],
    options?: KeyExistsOptions
  ): Promise<CacheKeysExist.Response> {
    const client = this.getNextDataClient();
    return await client.keysExist(cacheName, keys, options?.abortSignal);
  }

  /**
   * Update the ttl of the key in the cache in milliseconds.
   * @param {string} cacheName - The cache containing the key.
   * @param {string} key - The key for which the ttl remaining is requested.
   * @param {number} ttlMilliseconds - The ttl in milliseconds that should overwrite the current ttl.
   * @param {UpdateTtlOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheUpdateTtl.Response>}
   * {@link CacheUpdateTtl.Set} when the ttl was successfully overwritten.
   * {@link CacheUpdateTtl.Miss} when the key does not exist.
   * {@link CacheUpdateTtl.Error} on failure.
   */
  public async updateTtl(
    cacheName: string,
    key: string | Uint8Array,
    ttlMilliseconds: number,
    options?: UpdateTtlOptions
  ): Promise<CacheUpdateTtl.Response> {
    const client = this.getNextDataClient();
    return await client.updateTtl(
      cacheName,
      key,
      ttlMilliseconds,
      options?.abortSignal
    );
  }

  /**
   * Increase the ttl of the key in the cache in milliseconds.
   * @param {string} cacheName - The cache containing the key.
   * @param {string} key - The key for which the ttl remaining is requested.
   * @param {number} ttlMilliseconds - The ttl in milliseconds that should
   * overwrite the current ttl. Should be greater than the current ttl.
   * @param {IncreaseTtlOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheIncreaseTtl.Response>}
   * {@link CacheIncreaseTtl.Set} when the ttl was successfully increased.
   * {@link CacheIncreaseTtl.Miss} when the key does not exist.
   * {@link CacheIncreaseTtl.Error} on failure.
   */
  public async increaseTtl(
    cacheName: string,
    key: string | Uint8Array,
    ttlMilliseconds: number,
    options?: IncreaseTtlOptions
  ): Promise<CacheIncreaseTtl.Response> {
    const client = this.getNextDataClient();
    return await client.increaseTtl(
      cacheName,
      key,
      ttlMilliseconds,
      options?.abortSignal
    );
  }

  /**
   * Decrease the ttl of the key in the cache in milliseconds.
   * @param {string} cacheName - The cache containing the key.
   * @param {string} key - The key for which the ttl remaining is requested.
   * @param {number} ttlMilliseconds - The ttl in milliseconds that should
   * overwrite the current ttl. Should be less than the current ttl.
   * @param {DecreaseTtlOptions} options
   * @param {AbortSignal} options.abortSignal - The signal to cancel the operation
   * @returns {Promise<CacheDecreaseTtl.Response>}
   * {@link CacheDecreaseTtl.Set} when the ttl was successfully decreased.
   * {@link CacheDecreaseTtl.Miss} when the key does not exist.
   * {@link CacheDecreaseTtl.Error} on failure.
   */
  public async decreaseTtl(
    cacheName: string,
    key: string | Uint8Array,
    ttlMilliseconds: number,
    options?: DecreaseTtlOptions
  ): Promise<CacheDecreaseTtl.Response> {
    const client = this.getNextDataClient();
    return await client.decreaseTtl(
      cacheName,
      key,
      ttlMilliseconds,
      options?.abortSignal
    );
  }

  private getNextDataClient(): IDataClient {
    const client = this.dataClients[this.nextDataClientIndex];
    this.nextDataClientIndex =
      (this.nextDataClientIndex + 1) % this.dataClients.length;
    return client;
  }

  abstract close(): void;
}
