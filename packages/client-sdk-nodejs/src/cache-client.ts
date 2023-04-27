import {ControlClient} from './internal/control-client';
import {DataClient} from './internal/data-client';
import {
  CreateSigningKey,
  ListSigningKeys,
  RevokeSigningKey,
  CacheSortedSetFetch,
  CacheSortedSetGetRank,
  CacheSortedSetGetScore,
  CacheSortedSetGetScores,
  CacheSortedSetIncrementScore,
  CacheSortedSetRemoveElement,
  CacheSortedSetRemoveElements,
  CacheSortedSetPutElement,
  CacheSortedSetPutElements,
  CacheFlush,
  MomentoLogger,
  SortedSetOrder,
} from '.';
import {
  CollectionCallOptions,
  SortedSetFetchByRankCallOptions,
  SortedSetFetchByScoreCallOptions,
} from '@gomomento/sdk-core/dist/src/utils';
import {CacheClientProps} from './cache-client-props';
import {range} from '@gomomento/sdk-core/dist/src/internal/utils';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/internal/clients/cache/ICacheClient';
import {AbstractCacheClient} from '@gomomento/sdk-core/dist/src/internal/clients/cache/AbstractCacheClient';

// Type aliases to differentiate the different methods' optional arguments.
type SortedSetPutElementOptions = CollectionCallOptions;
type SortedSetPutElementsOptions = CollectionCallOptions;
type SortedSetFetchByRankOptions = SortedSetFetchByRankCallOptions;
type SortedSetFetchByScoreOptions = SortedSetFetchByScoreCallOptions;
type SortedSetIncrementOptions = CollectionCallOptions;

/**
 * Momento Cache Client.
 *
 * Features include:
 * - Get, set, and delete data
 * - Create, delete, and list caches
 * - Create, revoke, and list signing keys
 */
export class CacheClient extends AbstractCacheClient implements ICacheClient {
  private readonly logger: MomentoLogger;
  private readonly notYetAbstractedControlClient: ControlClient;

  /**
   * Creates an instance of CacheClient.
   */
  constructor(props: CacheClientProps) {
    const controlClient = new ControlClient({
      configuration: props.configuration,
      credentialProvider: props.credentialProvider,
    });

    // For high load, we get better performance with multiple clients.  Here we
    // are setting a default, hard-coded value for the number of clients to use,
    // because we haven't yet designed the API for users to use to configure
    // tunables:
    // https://github.com/momentohq/dev-eco-issue-tracker/issues/85
    // The choice of 6 as the initial value is a rough guess at a reasonable
    // default for the short-term, based on load testing results captured in:
    // https://github.com/momentohq/oncall-tracker/issues/186
    const numClients = 6;
    const dataClients = range(numClients).map(() => new DataClient(props));
    super(controlClient, dataClients);

    this.notYetAbstractedControlClient = controlClient;

    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.logger.info('Creating Momento CacheClient');
  }

  /**
   * Flushes / clears all the items of the given cache
   *
   * @param {string} cacheName - The cache to be flushed.
   * @returns {Promise<CacheFlush.Response>} -
   * {@link CacheFlush.Success} on success.
   * {@link CacheFlush.Error} on failure.
   */
  public async flushCache(cacheName: string): Promise<CacheFlush.Response> {
    return await this.notYetAbstractedControlClient.flushCache(cacheName);
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
      options?.ttl
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
   * @returns {Promise<CacheSortedSetPutElements.Response>} -
   * {@link CacheSortedSetPutElements.Success} on success.
   * {@link CacheSortedSetPutElements.Error} on failure.
   * @returns
   */
  public async sortedSetPutElements(
    cacheName: string,
    sortedSetName: string,
    elements: Map<string | Uint8Array, number> | Record<string, number>,
    options?: SortedSetPutElementsOptions
  ): Promise<CacheSortedSetPutElements.Response> {
    const client = this.getNextDataClient();
    return await client.sortedSetPutElements(
      cacheName,
      sortedSetName,
      elements,
      options?.ttl
    );
  }

  // sorted set put values

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
      options?.endRank
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
      options?.count
    );
  }

  /**
   * Look up the rank of an element in the sorted set, by the value of the element.
   *
   * @param {string} cacheName - The cache containing the sorted set.
   * @param {string} sortedSetName - The sorted set to fetch from.
   * @param {string | Uint8Array} value - The value of the element whose rank we are retrieving.
   * @returns {Promise<CacheSortedSetGetRank.Response>}
   * {@link CacheSortedGetRank.Hit} containing the rank of the requested elements when found.
   * {@link CacheSortedGetRank.Miss} when the element does not exist.
   * {@link CacheSortedGetRank.Error} on failure.
   */
  public async sortedSetGetRank(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array
  ): Promise<CacheSortedSetGetRank.Response> {
    const client = this.getNextDataClient();
    return await client.sortedSetGetRank(cacheName, sortedSetName, value);
  }

  /**
   * Look up the score of an element in the sorted set, by the value of the element.
   *
   * @param {string} cacheName - The cache containing the sorted set.
   * @param {string} sortedSetName - The sorted set to fetch from.
   * @param {string | Uint8Array} value - The value of the element whose score we are retrieving.
   * @returns {Promise<CacheSortedSetGetScore.Response>}
   * {@link CacheSortedGetScore.Hit} containing the score of the requested element when found.
   * {@link CacheSortedGetScore.Miss} when the element or collection does not exist.
   * {@link CacheSortedGetScore.Error} on failure.
   */
  public async sortedSetGetScore(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array
  ): Promise<CacheSortedSetGetScore.Response> {
    const client = this.getNextDataClient();
    return await client.sortedSetGetScore(cacheName, sortedSetName, value);
  }

  /**
   * Look up the scores of multiple elements in the sorted set, by the value of the elements.
   *
   * @param {string} cacheName - The cache containing the sorted set.
   * @param {string} sortedSetName - The sorted set to fetch from.
   * @param {string[] | Uint8Array[]} values - The values of the elements whose scores we are retrieving.
   * @returns {Promise<CacheSortedSetGetScores.Response>}
   * {@link CacheSortedGetScores.Hit} containing the scores of the requested elements when found.
   * {@link CacheSortedGetScores.Miss} when the element or collection does not exist.
   * {@link CacheSortedGetScores.Error} on failure.
   */
  public async sortedSetGetScores(
    cacheName: string,
    sortedSetName: string,
    values: string[] | Uint8Array[]
  ): Promise<CacheSortedSetGetScores.Response> {
    const client = this.getNextDataClient();
    return await client.sortedSetGetScores(cacheName, sortedSetName, values);
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
    amount = 1,
    options?: SortedSetIncrementOptions
  ): Promise<CacheSortedSetIncrementScore.Response> {
    const client = this.getNextDataClient();
    return await client.sortedSetIncrementScore(
      cacheName,
      sortedSetName,
      value,
      amount,
      options?.ttl
    );
  }

  /**
   * Remove an element from the sorted set
   * @param {string} cacheName - The cache containing the sorted set.
   * @param {string} sortedSetName - The sorted set to remove from.
   * @param {string | Uint8Array} value - The value of the element to remove from the set.
   * @returns {Promise<CacheSortedSetRemoveElement.Response>}
   * {@link CacheSortedSetRemoveElement.Success} if the element was successfully removed
   * {@link CacheSortedSetIncrementScore.Error} on failure
   */
  public async sortedSetRemoveElement(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array
  ): Promise<CacheSortedSetRemoveElement.Response> {
    const client = this.getNextDataClient();
    return await client.sortedSetRemoveElement(cacheName, sortedSetName, value);
  }

  /**
   * Remove multiple elements from the sorted set
   * @param {string} cacheName - The cache containing the sorted set.
   * @param {string} sortedSetName - The sorted set to remove from.
   * @param {string | Uint8Array} values - The values of the elements to remove from the set.
   * @returns {Promise<CacheSortedSetRemoveElement.Response>}
   * {@link CacheSortedSetRemoveElement.Success} if the elements were successfully removed
   * {@link CacheSortedSetIncrementScore.Error} on failure
   */
  public async sortedSetRemoveElements(
    cacheName: string,
    sortedSetName: string,
    values: string[] | Uint8Array[]
  ): Promise<CacheSortedSetRemoveElements.Response> {
    const client = this.getNextDataClient();
    return await client.sortedSetRemoveElements(
      cacheName,
      sortedSetName,
      values
    );
  }

  /**
   * Creates a Momento signing key.
   *
   * @param {number} ttlMinutes - The time to live in minutes until the Momento
   * signing key expires.
   * @returns {Promise<CreateSigningKey.Response>} -
   * {@link CreateSigningKey.Success} containing the key, key ID, endpoint, and
   * expiration date on success.
   * {@link CreateSigningKey.Error} on failure.
   */
  public async createSigningKey(
    ttlMinutes: number
  ): Promise<CreateSigningKey.Response> {
    const client = this.getNextDataClient();
    return await this.notYetAbstractedControlClient.createSigningKey(
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
   * @returns {Promise<RevokeSigningKey.Response>} -
   * {@link RevokeSigningKey.Success} on success.
   * {@link RevokeSigningKey.Error} on failure.
   */
  public async revokeSigningKey(
    keyId: string
  ): Promise<RevokeSigningKey.Response> {
    return await this.notYetAbstractedControlClient.revokeSigningKey(keyId);
  }

  /**
   * Lists all Momento signing keys for the provided auth token.
   *
   * @returns {Promise<ListSigningKeys.Response>} -
   * {@link ListSigningKeys.Success} containing the keys on success.
   * {@link ListSigningKeys.Error} on failure.
   */
  public async listSigningKeys(): Promise<ListSigningKeys.Response> {
    const client = this.getNextDataClient();
    return await this.notYetAbstractedControlClient.listSigningKeys(
      client.getEndpoint()
    );
  }

  protected getNextDataClient(): DataClient {
    const client = this.dataClients[this.nextDataClientIndex];
    this.nextDataClientIndex =
      (this.nextDataClientIndex + 1) % this.dataClients.length;
    return client as DataClient;
  }
}

/**
 * @deprecated use {CacheClient} instead
 */
export class SimpleCacheClient extends CacheClient {}
