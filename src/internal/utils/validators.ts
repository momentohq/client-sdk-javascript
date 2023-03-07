import {InvalidArgumentError} from '../../errors/errors';

export function validateCacheName(name: string) {
  if (isEmpty(name)) {
    throw new InvalidArgumentError('cache name must not be empty');
  }
}

export function validateSetName(name: string) {
  if (isEmpty(name)) {
    throw new InvalidArgumentError('set name must not be empty');
  }
}

export function validateSortedSetName(name: string) {
  if (isEmpty(name)) {
    throw new InvalidArgumentError('sorted set name must not be empty');
  }
}

export function validateSortedSetIndices(
  start_index: number,
  end_index?: number
) {
  if (end_index === undefined) {
    return;
  }
  if (start_index > 0 && end_index > 0 && start_index >= end_index) {
    throw new InvalidArgumentError('start index must be less than end index');
  }
  if (start_index < 0 && end_index < 0 && start_index >= end_index) {
    throw new InvalidArgumentError(
      'negative start index must be less than negative end index'
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

export function validateTtlMinutes(ttlMinutes: number) {
  if (ttlMinutes < 0) {
    throw new InvalidArgumentError('ttlMinutes must be positive');
  }
}

function isEmpty(str: string): boolean {
  return !str.trim();
}
