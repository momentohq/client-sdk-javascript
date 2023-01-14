import {InvalidArgumentError} from '../errors/errors';

export function validateCacheName(name: string) {
  if (!name.trim()) {
    throw new InvalidArgumentError('cache name must not be empty');
  }
}

export function validateSetName(name: string) {
  if (!name.trim()) {
    throw new InvalidArgumentError('set name must not be empty');
  }
}

export function validateDictionaryName(name: string) {
  if (!name.trim()) {
    throw new InvalidArgumentError('dictionary name must not be empty');
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
  ensureValidValue(value);
  if (ttl && ttl < 0) {
    throw new InvalidArgumentError('ttl must be a positive integer');
  }
}

export function ensureValidKey(key: unknown) {
  if (!key) {
    throw new InvalidArgumentError('key must not be empty');
  }
}

export function ensureValidField(field: unknown) {
  if (!field) {
    throw new InvalidArgumentError('field must not be empty');
  }
}

export function ensureValidValue(value: unknown) {
  if (!value) {
    throw new InvalidArgumentError('value must not be empty');
  }
}
