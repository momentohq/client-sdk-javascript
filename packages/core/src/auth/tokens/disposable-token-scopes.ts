import {CacheRole, CacheSelector, DisposableTokenScope} from './token-scope';

export * from './token-scopes';

export function cacheKeyReadWrite(
  cacheSelector: CacheSelector,
  key: string
): DisposableTokenScope {
  return {
    permissions: [{role: CacheRole.ReadWrite, cache: cacheSelector, item: key}],
  };
}

export function cacheKeyPrefixReadWrite(
  cacheSelector: CacheSelector,
  keyPrefix: string
): DisposableTokenScope {
  return {
    permissions: [
      {
        role: CacheRole.ReadWrite,
        cache: cacheSelector,
        item: {keyPrefix: keyPrefix},
      },
    ],
  };
}

export function cacheKeyReadOnly(
  cacheSelector: CacheSelector,
  key: string
): DisposableTokenScope {
  return {
    permissions: [{role: CacheRole.ReadOnly, cache: cacheSelector, item: key}],
  };
}

export function cacheKeyPrefixReadOnly(
  cacheSelector: CacheSelector,
  keyPrefix: string
): DisposableTokenScope {
  return {
    permissions: [
      {
        role: CacheRole.ReadOnly,
        cache: cacheSelector,
        item: {keyPrefix: keyPrefix},
      },
    ],
  };
}

export function cacheKeyWriteOnly(
  cacheSelector: CacheSelector,
  key: string
): DisposableTokenScope {
  return {
    permissions: [{role: CacheRole.WriteOnly, cache: cacheSelector, item: key}],
  };
}

export function cacheKeyPrefixWriteOnly(
  cacheSelector: CacheSelector,
  keyPrefix: string
): DisposableTokenScope {
  return {
    permissions: [
      {
        role: CacheRole.WriteOnly,
        cache: cacheSelector,
        item: {keyPrefix: keyPrefix},
      },
    ],
  };
}
