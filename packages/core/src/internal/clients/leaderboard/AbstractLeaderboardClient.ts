import {
  LeaderboardDelete,
  LeaderboardFetch,
  LeaderboardGetRank,
  LeaderboardLength,
  LeaderboardRemoveElements,
  LeaderboardUpsert,
} from '../../../index';
import {
  ILeaderboardClient,
  LeaderboardFetchByRankCallOptions,
  LeaderboardFetchByScoreCallOptions,
  LeaderboardGetRankCallOptions,
} from '../../../clients/ILeaderboardClient';
import {InternalLeaderboardClient} from './InternalLeaderboardClient';

export abstract class AbstractLeaderboardClient implements ILeaderboardClient {
  // making these protected until we fully abstract away the nodejs client
  protected readonly leaderboardClient: InternalLeaderboardClient;

  protected constructor(client: InternalLeaderboardClient) {
    this.leaderboardClient = client;
  }

  /**
   * Updates elements in a leaderboard or inserts elements if they do not already exist.
   * The leaderboard is also created if it does not already exist.
   * Note: can upsert a maximum of 8192 elements at a time.
   *
   * @param {string} cacheName - The cache containing the leaderboard.
   * @param {string} leaderboardName - The leaderboard to upsert to.
   * @param {Map<bigint|number, number>} elements - The ID->score pairs to add to the leaderboard.
   * @returns {Promise<LeaderboardUpsert.Response>} -
   * {@link LeaderboardUpsert.Success} on success.
   * {@link LeaderboardUpsert.Error} on failure.
   */
  public async leaderboardUpsert(
    cacheName: string,
    leaderboardName: string,
    elements: Map<bigint | number, number>
  ): Promise<LeaderboardUpsert.Response> {
    return await this.leaderboardClient.leaderboardUpsert(
      cacheName,
      leaderboardName,
      elements
    );
  }

  /**
   * Fetch the elements in the given leaderboard by score.
   * Note: can fetch a maximum of 8192 elements at a time.
   *
   * @param {string} cacheName - The cache containing the leaderboard.
   * @param {string} leaderboardName - The leaderboard to fetch from.
   * @param {LeaderboardFetchByScoreCallOptions} options
   * @param {number} [options.minScore] - The minimum score (inclusive) of the
   * elements to fetch. Defaults to negative infinity.
   * @param {number} [options.maxScore] - The maximum score (exclusive) of the
   * elements to fetch. Defaults to positive infinity.
   * @param {LeaderboardOrder} [options.order] - The order to fetch the elements in.
   * Defaults to ascending, meaning 0 is the lowest-scoring rank.
   * @param {bigint|number} [options.offset] - The number of elements to skip before
   * returning the first element. Defaults to 0. Note: this is not the score of
   * the first element to return, but the number of elements of the result set
   * to skip before returning the first element.
   * @param {bigint|number} [options.count] - The maximum number of elements to return.
   * Defaults to 8192, which is the maximum that can be fetched at a time.
   * @returns {Promise<LeaderboardFetch.Response>} -
   * {@link LeaderboardFetch.Success} containing the requested elements.
   * {@link LeaderboardFetch.Error} on failure.
   */
  public async leaderboardFetchByScore(
    cacheName: string,
    leaderboardName: string,
    options?: LeaderboardFetchByScoreCallOptions
  ): Promise<LeaderboardFetch.Response> {
    return await this.leaderboardClient.leaderboardFetchByScore(
      cacheName,
      leaderboardName,
      options?.order,
      options?.minScore,
      options?.maxScore,
      options?.offset,
      options?.count
    );
  }

  /**
   * Fetch the elements in the given leaderboard by index (rank).
   * Note: can fetch a maximum of 8192 elements at a time.
   *
   * @param {string} cacheName - The cache containing the leaderboard.
   * @param {string} leaderboardName - The leaderboard to fetch from.
   * @param {LeaderboardFetchByRankOptions} options
   * @param {bigint|number} [options.startRank] - The rank of the first element to
   * fetch. Defaults to 0. This rank is inclusive, ie the element at this rank
   * will be fetched.
   * @param {bigint|number} [options.endRank] - The rank of the last element to fetch.
   * This rank is exclusive, ie the element at this rank will not be fetched.
   * Defaults to startRank + 8192 in order to fetch the maximum 8192 elements per request.
   * @param {LeaderboardOrder} [options.order] - The order to fetch the elements in.
   * Defaults to ascending, meaning 0 is the lowest-scoring rank.
   * @returns {Promise<LeaderboardFetch.Response>} -
   * {@link LeaderboardFetch.Success} containing the requested elements.
   * {@link LeaderboardFetch.Error} on failure.
   */
  public async leaderboardFetchByRank(
    cacheName: string,
    leaderboardName: string,
    options?: LeaderboardFetchByRankCallOptions
  ): Promise<LeaderboardFetch.Response> {
    return await this.leaderboardClient.leaderboardFetchByRank(
      cacheName,
      leaderboardName,
      options?.startRank,
      options?.endRank,
      options?.order
    );
  }

  /**
   * Look up the rank of an element in the leaderboard given the element id.
   *
   * @param {string} cacheName - The cache containing the leaderboard.
   * @param {string} leaderboardName - The leaderboard to fetch the element from.
   * @param {bigint|number} id - The id of the element whose rank we are retrieving.
   * @param {LeaderboardGetRankCallOptions} options
   * @param {LeaderboardOrder} [options.order] - The order to fetch the elements in.
   * Defaults to ascending, meaning 0 is the lowest-scoring rank.
   * @returns {Promise<LeaderboardGetRank.Response>}
   * {@link LeaderboardGetRank.Success} containing the rank of the requested element when found.
   * {@link LeaderboardGetRank.Error} on failure.
   */
  public async leaderboardGetRank(
    cacheName: string,
    leaderboardName: string,
    id: bigint | number,
    options?: LeaderboardGetRankCallOptions
  ): Promise<LeaderboardGetRank.Response> {
    return await this.leaderboardClient.leaderboardGetRank(
      cacheName,
      leaderboardName,
      id,
      options?.order
    );
  }

  /**
   * Fetch length (number of items) of leaderboard
   * @param {string} cacheName - The cache containing the leaderboard.
   * @param {string} leaderboardName - The leaderboard to fetch the length of.
   * @returns {Promise<LeaderboardLength.Response>}
   * {@link LeaderboardLength.Success} containing the length if the leaderboard exists.
   * {@link LeaderboardLength.Error} on failure.
   */
  public async leaderboardLength(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardLength.Response> {
    return await this.leaderboardClient.leaderboardLength(
      cacheName,
      leaderboardName
    );
  }

  /**
   * Remove multiple elements from the given leaderboard
   * Note: can remove a maximum of 8192 elements at a time.
   *
   * @param {string} cacheName - The cache containing the leaderboard.
   * @param {string} leaderboardName - The leaderboard to remove elements from.
   * @param {Array<bigint|number>} ids - The IDs of the elements to remove from the leaderboard.
   * @returns {Promise<LeaderboardRemoveElements.Response>}
   * {@link LeaderboardRemoveElements.Success} if the elements were successfully removed.
   * {@link LeaderboardRemoveElements.Error} on failure.
   */
  public async leaderboardRemoveElements(
    cacheName: string,
    leaderboardName: string,
    ids: Array<bigint | number>
  ): Promise<LeaderboardRemoveElements.Response> {
    return await this.leaderboardClient.leaderboardRemoveElements(
      cacheName,
      leaderboardName,
      ids
    );
  }

  /**
   * Delete the given leaderboard
   * @param {string} cacheName - The cache containing the leaderboard.
   * @param {string} leaderboardName - The leaderboard to delete.
   * @returns {Promise<LeaderboardDelete.Response>}
   * {@link LeaderboardDelete.Success} on success.
   * {@link LeaderboardDelete.Error} on failure.
   */
  public async leaderboardDelete(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardDelete.Response> {
    return await this.leaderboardClient.leaderboardDelete(
      cacheName,
      leaderboardName
    );
  }
}
