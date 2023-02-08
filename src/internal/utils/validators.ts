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
