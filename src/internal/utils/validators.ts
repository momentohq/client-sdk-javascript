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

export function isBase64(str: string): boolean {
  return btoa(atob(str)) === str;
}
