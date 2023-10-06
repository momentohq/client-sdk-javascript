import {
  LeaderboardDelete,
  LeaderboardFetch,
  LeaderboardLength,
  LeaderboardRemoveElements,
  LeaderboardUpsert,
} from '../../../messages/responses/leaderboard';
import {
  LeaderboardFetchByRankCallOptions,
  LeaderboardFetchByScoreCallOptions,
  LeaderboardGetRankCallOptions,
} from '../../../utils/cache-call-options';

export interface InternalLeaderboardClient {
  /**
   * Updates elements in a leaderboard or inserts elements if they do not already exist.
   * The leaderboard is also created if it does not already exist.
   * Note: can upsert a maximum of 8192 elements at a time.
   *
   * @param {Map<bigint|number, number>} elements - The ID->score pairs to add to the leaderboard.
   * @returns {Promise<LeaderboardUpsert.Response>} -
   * {@link LeaderboardUpsert.Success} on success.
   * {@link LeaderboardUpsert.Error} on failure.
   */
  leaderboardUpsert(
    elements: Record<number, number> | Map<number, number>
  ): Promise<LeaderboardUpsert.Response>;

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
   * @param {bigint|number} [options.offset] - The number of elements to skip before
   * returning the first element. Defaults to 0. Note: this is not the score of
   * the first element to return, but the number of elements of the result set
   * to skip before returning the first element.
   * @param {bigint|number} [options.count] - The maximum number of elements to return.
   * Defaults to 8192, which is the maximum that can be fetched at a time.
   * @returns {Promise<LeaderboardFetch.Response>} -
   * {@link LeaderboardFetch.Found} containing the requested elements.
   * {@link LeaderboardFetch.NotFound} when requested elements were not found.
   * {@link LeaderboardFetch.Error} on failure.
   */
  leaderboardFetchByScore(
    options?: LeaderboardFetchByScoreCallOptions
  ): Promise<LeaderboardFetch.Response>;

  /**
   * Fetch the elements in the given leaderboard by index (rank).
   * Note: can fetch a maximum of 8192 elements at a time and rank
   * is 0-based (index begins at 0).
   *
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
   * {@link LeaderboardFetch.Found} containing the requested elements.
   * {@link LeaderboardFetch.NotFound} when requested elements were not found.
   * {@link LeaderboardFetch.Error} on failure.
   */
  leaderboardFetchByRank(
    options?: LeaderboardFetchByRankCallOptions
  ): Promise<LeaderboardFetch.Response>;

  /**
   * Look up the rank of an element in the leaderboard given the element id.
   * Note: rank is 0-based (index begins at 0).
   *
   * @param {bigint|number} ids - The ids of the elements whose rank we are retrieving.
   * @param {LeaderboardGetRankCallOptions} options
   * @param {LeaderboardOrder} [options.order] - The order to fetch the elements in.
   * Defaults to ascending, meaning 0 is the lowest-scoring rank.
   * @returns {Promise<LeaderboardFetch.Response>}
   * {@link LeaderboardFetch.Found} containing the requested elements.
   * {@link LeaderboardFetch.NotFound} when requested elements were not found.
   * {@link LeaderboardFetch.Error} on failure.
   */
  leaderboardGetRank(
    ids: Array<number>,
    options?: LeaderboardGetRankCallOptions
  ): Promise<LeaderboardFetch.Response>;

  /**
   * Fetch length (number of items) of leaderboard
   *
   * @returns {Promise<LeaderboardLength.Response>}
   * {@link LeaderboardLength.Success} containing the length if the leaderboard exists.
   * {@link LeaderboardLength.Error} on failure.
   */
  leaderboardLength(): Promise<LeaderboardLength.Response>;

  /**
   * Remove multiple elements from the given leaderboard
   * Note: can remove a maximum of 8192 elements at a time.
   *
   * @param {Array<bigint|number>} ids - The IDs of the elements to remove from the leaderboard.
   * @returns {Promise<LeaderboardRemoveElements.Response>}
   * {@link LeaderboardRemoveElements.Success} if the elements were successfully removed.
   * {@link LeaderboardRemoveElements.Error} on failure.
   */
  leaderboardRemoveElements(
    ids: Array<number>
  ): Promise<LeaderboardRemoveElements.Response>;

  /**
   * Delete the given leaderboard
   *
   * @returns {Promise<LeaderboardDelete.Response>}
   * {@link LeaderboardDelete.Success} on success.
   * {@link LeaderboardDelete.Error} on failure.
   */
  leaderboardDelete(): Promise<LeaderboardDelete.Response>;
}
