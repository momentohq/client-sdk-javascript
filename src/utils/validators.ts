import {InvalidArgumentError} from '../errors/errors';

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

export function ensureValidSetRequest(
  key: unknown,
  value: unknown,
  ttl: number
) {
  ensureValidKey(key);

  if (!value) {
    throw new InvalidArgumentError('value must not be empty');
  }

  if (ttl && ttl < 0) {
    throw new InvalidArgumentError('ttl must be a positive integer');
  }
}

export function ensureValidKey(key: unknown) {
  if (!key) {
    throw new InvalidArgumentError('key must not be empty');
  }
}

function isEmpty(str: string): boolean {
  return !str.trim();
}
