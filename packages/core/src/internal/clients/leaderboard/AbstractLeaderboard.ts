import {
  ILeaderboard,
  LeaderboardFetchByRankCallOptions,
  LeaderboardFetchByScoreCallOptions,
  LeaderboardGetRankCallOptions,
} from '../../../clients/ILeaderboard';
import {
  LeaderboardDelete,
  LeaderboardFetch,
  LeaderboardLength,
  LeaderboardRemoveElements,
  LeaderboardUpsert,
} from '../../../messages/responses/leaderboard';
import {ILeaderboardDataClient} from './ILeaderboardDataClient';

export abstract class AbstractLeaderboard implements ILeaderboard {
  protected readonly cacheName: string;
  protected readonly leaderboardName: string;
  protected readonly dataClient: ILeaderboardDataClient;

  protected constructor(
    cacheName: string,
    leaderboardName: string,
    dataClient: ILeaderboardDataClient
  ) {
    this.cacheName = cacheName;
    this.leaderboardName = leaderboardName;
    this.dataClient = dataClient;
  }

  /**
   * Updates elements in a leaderboard or inserts elements if they do not already exist.
   * The leaderboard is also created if it does not already exist.
   * Note: can upsert a maximum of 8192 elements at a time.
   *
   * @param {Map<number, number>} elements - The ID->score pairs to add to the leaderboard.
   * @returns {Promise<LeaderboardUpsert.Response>} -
   * {@link LeaderboardUpsert.Success} on success.
   * {@link LeaderboardUpsert.Error} on failure.
   */
  public async upsert(
    elements: Record<number, number> | Map<number, number>
  ): Promise<LeaderboardUpsert.Response> {
    return await this.dataClient.upsert(
      this.cacheName,
      this.leaderboardName,
      elements
    );
  }

  /**
   * Fetch the elements in the given leaderboard by score.
   * Note: can fetch a maximum of 8192 elements at a time.
   *
   * @param {LeaderboardFetchByScoreCallOptions} options
   * @param {number} [options.minScore] - The minimum score (inclusive) of the
   * elements to fetch. Defaults to negative infinity.
   * @param {number} [options.maxScore] - The maximum score (exclusive) of the
   * elements to fetch. Defaults to positive infinity.
   * @param {LeaderboardOrder} [options.order] - The order to fetch the elements in.
   * Defaults to ascending, meaning 0 is the lowest-scoring rank.
   * @param {number} [options.offset] - The number of elements to skip before
   * returning the first element. Defaults to 0. Note: this is not the score of
   * the first element to return, but the number of elements of the result set
   * to skip before returning the first element.
   * @param {number} [options.count] - The maximum number of elements to return.
   * Defaults to 8192, which is the maximum that can be fetched at a time.
   * @returns {Promise<LeaderboardFetch.Response>} -
   * {@link LeaderboardFetch.Success} containing the requested elements.
   * {@link LeaderboardFetch.Error} on failure.
   */
  public async fetchByScore(
    options?: LeaderboardFetchByScoreCallOptions
  ): Promise<LeaderboardFetch.Response> {
    return await this.dataClient.fetchByScore(
      this.cacheName,
      this.leaderboardName,
      options?.minScore,
      options?.maxScore,
      options?.order,
      options?.offset,
      options?.count
    );
  }

  /**
   * Fetch the elements in the given leaderboard by index (rank).
   * Note: can fetch a maximum of 8192 elements at a time and rank
   * is 0-based (index begins at 0).
   *
   * @param {number} [startRank] - The rank of the first element to
   * fetch. This rank is inclusive, ie the element at this rank
   * will be fetched. Ranks can be used to manually paginate through the leaderboard
   * in batches of 8192 elements (e.g. request 0-8192, then 8192-16384, etc).
   * @param {number} [endRank] - The rank of the last element to fetch.
   * This rank is exclusive, ie the element at this rank will not be fetched.
   * Ranks can be used to manually paginate through the leaderboard
   * in batches of 8192 elements (e.g. request 0-8192, then 8192-16384, etc).
   * @param {LeaderboardFetchByRankOptions} options
   * @param {LeaderboardOrder} [options.order] - The order to fetch the elements in.
   * Defaults to ascending, meaning 0 is the lowest-scoring rank.
   * @returns {Promise<LeaderboardFetch.Response>} -
   * {@link LeaderboardFetch.Success} containing the requested elements.
   * {@link LeaderboardFetch.Error} on failure.
   */
  public async fetchByRank(
    startRank: number,
    endRank: number,
    options?: LeaderboardFetchByRankCallOptions
  ): Promise<LeaderboardFetch.Response> {
    return await this.dataClient.fetchByRank(
      this.cacheName,
      this.leaderboardName,
      startRank,
      endRank,
      options?.order
    );
  }

  /**
   * Look up the rank of an element in the leaderboard given the element id.
   * Note: rank is 0-based (index begins at 0).
   *
   * @param {number} ids - The ids of the elements whose rank we are retrieving.
   * @param {LeaderboardGetRankCallOptions} options
   * @param {LeaderboardOrder} [options.order] - The order to fetch the elements in.
   * Defaults to ascending, meaning 0 is the lowest-scoring rank.
   * @returns {Promise<LeaderboardFetch.Response>}
   * {@link LeaderboardFetch.Success} containing the requested elements.
   * {@link LeaderboardFetch.Error} on failure.
   */
  public async getRank(
    ids: Array<number>,
    options?: LeaderboardGetRankCallOptions
  ): Promise<LeaderboardFetch.Response> {
    return await this.dataClient.getRank(
      this.cacheName,
      this.leaderboardName,
      ids,
      options?.order
    );
  }

  /**
   * Fetch length (number of items) of leaderboard
   *
   * @returns {Promise<LeaderboardLength.Response>}
   * {@link LeaderboardLength.Success} containing the length if the leaderboard exists.
   * {@link LeaderboardLength.Error} on failure.
   */
  public async length(): Promise<LeaderboardLength.Response> {
    return await this.dataClient.length(this.cacheName, this.leaderboardName);
  }

  /**
   * Remove multiple elements from the given leaderboard
   * Note: can remove a maximum of 8192 elements at a time.
   *
   * @param {Array<number>} ids - The IDs of the elements to remove from the leaderboard.
   * @returns {Promise<LeaderboardRemoveElements.Response>}
   * {@link LeaderboardRemoveElements.Success} if the elements were successfully removed.
   * {@link LeaderboardRemoveElements.Error} on failure.
   */
  public async removeElements(
    ids: Array<number>
  ): Promise<LeaderboardRemoveElements.Response> {
    return await this.dataClient.removeElements(
      this.cacheName,
      this.leaderboardName,
      ids
    );
  }

  /**
   * Delete the given leaderboard
   *
   * @returns {Promise<LeaderboardDelete.Response>}
   * {@link LeaderboardDelete.Success} on success.
   * {@link LeaderboardDelete.Error} on failure.
   */
  public async delete(): Promise<LeaderboardDelete.Response> {
    return await this.dataClient.delete(this.cacheName, this.leaderboardName);
  }
}
