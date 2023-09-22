import {
  LeaderboardDelete,
  LeaderboardFetch,
  LeaderboardGetRank,
  LeaderboardLength,
  LeaderboardRemoveElements,
  LeaderboardUpsert,
  SortedSetOrder,
} from '../../../index';
import {
  ILeaderboardClient,
  LeaderboardFetchByRankOptions,
  LeaderboardFetchByScoreOptions,
} from '../../../clients/ILeaderboardClient';
import {InternalLeaderboardClient} from './InternalLeaderboardClient';

export interface BaseLeaderboardClientProps {
  createLeaderboardClient: () => InternalLeaderboardClient;
}
export abstract class AbstractLeaderboardClient implements ILeaderboardClient {
  // making these protected until we fully abstract away the nodejs client
  protected readonly leaderboardClient: InternalLeaderboardClient;

  protected constructor(props: BaseLeaderboardClientProps) {
    this.leaderboardClient = props.createLeaderboardClient();
  }

  /**
   * Updates elements in a leaderboard or inserts elements if they do not already exist.
   * The leaderboard is also created if it does not already exist.
   *
   * @param {string} cacheName - The cache containing the leaderboard.
   * @param {string} leaderboardName - The leaderboard to upsert to.
   * @param {Map<bigint, number>} elements - The ID->score pairs to add to the leaderboard.
   * @returns {Promise<LeaderboardUpsert.Response>} -
   * {@link LeaderboardUpsert.Success} on success.
   * {@link LeaderboardUpsert.Error} on failure.
   */
  public async leaderboardUpsert(
    cacheName: string,
    leaderboardName: string,
    elements: Map<bigint, number>
  ): Promise<LeaderboardUpsert.Response> {
    return await this.leaderboardClient.leaderboardUpsert(
      cacheName,
      leaderboardName,
      elements
    );
  }

  /**
   * Fetch the elements in the given leaderboard by score.
   *
   * @param {string} cacheName - The cache containing the leaderboard.
   * @param {string} leaderboardName - The leaderboard to fetch from.
   * @param {LeaderboardFetchByScoreOptions} options
   * @param {number} [options.minScore] - The minimum score (inclusive) of the
   * elements to fetch. Defaults to negative infinity.
   * @param {number} [options.maxScore] - The maximum score (inclusive) of the
   * elements to fetch. Defaults to positive infinity.
   * @param {SortedSetOrder} [options.order] - The order to fetch the elements in.
   * Defaults to ascending.
   * @param {number} [options.offset] - The number of elements to skip before
   * returning the first element. Defaults to 0. Note: this is not the score of
   * the first element to return, but the number of elements of the result set
   * to skip before returning the first element.
   * @param {number} [options.count] - The maximum number of elements to return.
   * Defaults to undefined, which returns all elements.
   * @returns {Promise<LeaderboardFetch.Response>} -
   * {@link LeaderboardFetch.Success} containing the requested elements.
   * {@link LeaderboardFetch.Error} on failure.
   */
  public async leaderboardFetchByScore(
    cacheName: string,
    leaderboardName: string,
    options?: LeaderboardFetchByScoreOptions
  ): Promise<LeaderboardFetch.Response> {
    return await this.leaderboardClient.leaderboardFetchByScore(
      cacheName,
      leaderboardName,
      options?.order ?? SortedSetOrder.Ascending,
      options?.minScore,
      options?.maxScore,
      options?.offset,
      options?.count
    );
  }

  /**
   * Fetch the elements in the given leaderboard by index (rank).
   *
   * @param {string} cacheName - The cache containing the leaderboard.
   * @param {string} leaderboardName - The leaderboard to fetch from.
   * @param {LeaderboardFetchByRankOptions} options
   * @param {number} [options.startRank] - The rank of the first element to
   * fetch. Defaults to 0. This rank is inclusive, ie the element at this rank
   * will be fetched.
   * @param {number} [options.endRank] - The rank of the last element to fetch.
   * This rank is exclusive, ie the element at this rank will not be fetched.
   * Defaults to null, which fetches up until and including the last element.
   * @param {SortedSetOrder} [options.order] - The order to fetch the elements in.
   * Defaults to ascending.
   * @returns {Promise<LeaderboardFetch.Response>} -
   * {@link LeaderboardFetch.Success} containing the requested elements.
   * {@link LeaderboardFetch.Error} on failure.
   */
  public async leaderboardFetchByRank(
    cacheName: string,
    leaderboardName: string,
    options?: LeaderboardFetchByRankOptions
  ): Promise<LeaderboardFetch.Response> {
    return await this.leaderboardClient.leaderboardFetchByRank(
      cacheName,
      leaderboardName,
      options?.startRank ?? 0,
      options?.endRank,
      options?.order ?? SortedSetOrder.Ascending
    );
  }

  /**
   * Look up the rank of an element in the leaderboard, by the id of the element.
   *
   * @param {string} cacheName - The cache containing the leaderboard.
   * @param {string} leaderboardName - The leaderboard to fetch the element from.
   * @param {bigint} elementId - The id of the element whose rank we are retrieving.
   * @returns {Promise<LeaderboardGetRank.Response>}
   * {@link LeaderboardGetRank.Success} containing the rank of the requested element when found.
   * {@link LeaderboardGetRank.Error} on failure.
   */
  public async leaderboardGetRank(
    cacheName: string,
    leaderboardName: string,
    elementId: bigint
  ): Promise<LeaderboardGetRank.Response> {
    return await this.leaderboardClient.leaderboardGetRank(
      cacheName,
      leaderboardName,
      elementId
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
   * @param {string} cacheName - The cache containing the leaderboard.
   * @param {string} leaderboardName - The leaderboard to remove elements from.
   * @param {Array<bigint>} elementIds - The IDs of the elements to remove from the leaderboard.
   * @returns {Promise<LeaderboardRemoveElements.Response>}
   * {@link LeaderboardRemoveElements.Success} if the elements were successfully removed.
   * {@link LeaderboardRemoveElements.Error} on failure.
   */
  public async leaderboardRemoveElements(
    cacheName: string,
    leaderboardName: string,
    elementIds: Array<bigint>
  ): Promise<LeaderboardRemoveElements.Response> {
    return await this.leaderboardClient.leaderboardRemoveElements(
      cacheName,
      leaderboardName,
      elementIds
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
