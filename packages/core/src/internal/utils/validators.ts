import {InvalidArgumentError} from '../../errors';
import {ExpiresIn, SortedSetSource} from '../../utils';
import {decodeFromBase64, encodeToBase64} from './string';

export function validateStoreName(name: string) {
  if (isEmpty(name)) {
    throw new InvalidArgumentError('store name must not be empty');
  }
}

export function validateCacheName(name: string) {
  if (isEmpty(name)) {
    throw new InvalidArgumentError('cache name must not be empty');
  }
}

export function validateCacheKeyOrPrefix(name: string) {
  if (isEmpty(name)) {
    throw new InvalidArgumentError('cache key or key prefix must not be empty');
  }
}

export function validateSetName(name: string) {
  if (isEmpty(name)) {
    throw new InvalidArgumentError('set name must not be empty');
  }
}

export function validateSetSampleLimit(limit: number) {
  if (limit < 0) {
    throw new InvalidArgumentError('limit must be non-negative (>= 0)');
  }
}

export function validateSetPopCount(count: number) {
  if (count < 1) {
    throw new InvalidArgumentError('count must be positive (> 0)');
  }
}

export function validateSortedSetName(name: string) {
  if (isEmpty(name)) {
    throw new InvalidArgumentError('sorted set name must not be empty');
  }
}

export function validateSortedSetRanks(start_rank: number, end_rank?: number) {
  if (end_rank === undefined) {
    return;
  }
  if (start_rank > 0 && end_rank > 0 && start_rank > end_rank) {
    throw new InvalidArgumentError('start rank must be less than end rank');
  }
  if (start_rank < 0 && end_rank < 0 && start_rank >= end_rank) {
    throw new InvalidArgumentError(
      'negative start rank must be less than negative end rank'
    );
  }
}

export function validateSortedSetScores(minScore?: number, maxScore?: number) {
  if (minScore === undefined) return;
  if (maxScore === undefined) return;
  if (minScore > maxScore) {
    throw new InvalidArgumentError(
      'minScore must be less than or equal to maxScore'
    );
  }
}

export function validateSortedSetOffset(offset: number) {
  if (offset < 0) {
    throw new InvalidArgumentError('offset must be non-negative (>= 0)');
  }
}

export function validateSortedSetCount(count: number) {
  if (count < 1) {
    throw new InvalidArgumentError('count must be strictly positive (> 0)');
  }
}

export function validateDictionaryName(name: string) {
  if (isEmpty(name)) {
    throw new InvalidArgumentError('dictionary name must not be empty');
  }
}

export function validateListName(name: string) {
  if (isEmpty(name)) {
    throw new InvalidArgumentError('list name must not be empty');
  }
}

export function validateListSliceStartEnd(
  startIndex?: number,
  endIndex?: number
) {
  if (startIndex === undefined || endIndex === undefined) return;
  // can't validate bounds for start and index of either or are negative without list length
  if (startIndex > 0 || endIndex < 0) return;
  if (endIndex <= startIndex) {
    throw new InvalidArgumentError(
      'endIndex (exclusive) must be larger than startIndex (inclusive)'
    );
  }
}

export function validateTopicName(name: string) {
  if (isEmpty(name)) {
    throw new InvalidArgumentError('topic name must not be empty');
  }
}

export function validateWebhookName(name: string) {
  if (isEmpty(name)) {
    throw new InvalidArgumentError('webhook name must not be empty');
  }
}

export function validateIndexName(name: string) {
  if (isEmpty(name)) {
    throw new InvalidArgumentError('index name must not be empty');
  }
}

export function validateNumDimensions(numDimensions: number) {
  if (numDimensions <= 0) {
    throw new InvalidArgumentError('numDimensions must be greater than zero');
  }
}

export function validateTopK(topK: number) {
  if (topK <= 0) {
    throw new InvalidArgumentError('topK must be greater than zero');
  }
}

export function validateTtlMinutes(ttlMinutes: number) {
  if (ttlMinutes < 0 || !Number.isSafeInteger(ttlMinutes)) {
    throw new InvalidArgumentError('ttlMinutes must be a positive integer');
  }
}

// Currently accepting ttl in seconds, but if someone requests support for millis,
// the validator will need to check for Number.isSafeInteger(ttl * 1000).
export function validateTtlSeconds(ttl: number) {
  if (ttl < 0 || !Number.isSafeInteger(ttl)) {
    throw new InvalidArgumentError(
      `ttl must be a positive integer, received ${ttl}`
    );
  }
}

export function validateValidForSeconds(validForSeconds: number) {
  if (validForSeconds < 0) {
    throw new InvalidArgumentError('validForSeconds must be positive');
  }
}

export function validateTimeout(timeout: number) {
  if (timeout < 0) {
    throw new InvalidArgumentError('timeout must be positive');
  }
}

export function validateDisposableTokenExpiry(expiresIn: ExpiresIn) {
  if (!expiresIn.doesExpire()) {
    throw new InvalidArgumentError('disposable tokens must have an expiry');
  }
  if (expiresIn.seconds() < 0) {
    throw new InvalidArgumentError('disposable token expiry must be positive');
  }
  if (expiresIn.seconds() > 60 * 60) {
    // 60 seconds * 60 minutes
    throw new InvalidArgumentError(
      'disposable tokens must expire within 1 hour'
    );
  }
}

export function validateDisposableTokenTokenID(tokenId: string) {
  if (tokenId.length > 64) {
    throw new InvalidArgumentError(
      'TokenID must be less than or equal to 64 characters.'
    );
  }
}

function isEmpty(str: string): boolean {
  return !str.trim();
}

export function isBase64(str: string): boolean {
  try {
    return encodeToBase64(decodeFromBase64(str)) === str;
  } catch (e) {
    return false;
  }
}

export function validateLeaderboardName(name: string) {
  if (isEmpty(name)) {
    throw new InvalidArgumentError('leaderboard name must not be empty');
  }
}

export function validateLeaderboardRanks(start_rank: number, end_rank: number) {
  if (start_rank > 0 && end_rank > 0 && start_rank >= end_rank) {
    throw new InvalidArgumentError('start rank must be less than end rank');
  }
  if (start_rank < 0 || end_rank < 0) {
    throw new InvalidArgumentError('ranks must be positive');
  }
}

export function validateLeaderboardOffset(offset: number) {
  if (offset < 0) {
    throw new InvalidArgumentError('offset must be non-negative (>= 0)');
  }
}

export function validateLeaderboardCount(count: number) {
  if (count < 1) {
    throw new InvalidArgumentError('count must be strictly positive (> 0)');
  }
}

export function validateLeaderboardNumberOfElements(numElements: number) {
  if (numElements < 1) {
    throw new InvalidArgumentError('must provide at least one element');
  }
}

export function validateMaxConcurrentRequests(limit: number) {
  if (limit < 1) {
    throw new InvalidArgumentError(
      'concurrent requests limit must be strictly positive (> 0)'
    );
  }
}

export function validateSortedSetSources(sources: SortedSetSource[]) {
  if (!sources) {
    throw new InvalidArgumentError('At least one sources is required');
  }
  for (const source of sources) {
    const {sortedSetName, weight} = source;

    if (typeof sortedSetName !== 'string' || sortedSetName.length === 0) {
      throw new InvalidArgumentError(
        'sortedSetName must be a non-empty string'
      );
    }

    if (!Number.isFinite(weight)) {
      throw new InvalidArgumentError('weight must be a finite number');
    }
  }
}
