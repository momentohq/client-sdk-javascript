import {
  AllCacheItems,
  CachePermission,
  Permission,
  Permissions,
  PredefinedScope,
} from './permission-scope';

export interface CacheItemKey {
  key: string;
}

export interface CacheItemKeyPrefix {
  keyPrefix: string;
}

export function isCacheItemKey(
  cacheItem: CacheItemSelector
): cacheItem is CacheItemKey {
  if (cacheItem === AllCacheItems) {
    return false;
  }
  if (typeof cacheItem === 'string') {
    return true;
  }
  return 'key' in cacheItem;
}

export function isCacheItemKeyPrefix(
  cacheItem: CacheItemSelector
): cacheItem is CacheItemKeyPrefix {
  if (cacheItem === AllCacheItems) {
    return false;
  }
  if (typeof cacheItem === 'string') {
    return false;
  }
  return 'keyPrefix' in cacheItem;
}

export type CacheItemSelector =
  | typeof AllCacheItems
  | CacheItemKey
  | CacheItemKeyPrefix
  | string;

export interface DisposableTokenCachePermission extends CachePermission {
  /**
   * Scope the token permissions to select cache items
   */
  item: CacheItemSelector;
}

export function isDisposableTokenCachePermission(p: Permission): boolean {
  return (
    'role' in p &&
    'cache' in p &&
    'item' in p &&
    !('topic' in p) &&
    !('func' in p)
  );
}

export function asDisposableTokenCachePermission(
  p: Permission
): DisposableTokenCachePermission {
  if (!isDisposableTokenCachePermission(p)) {
    throw new Error(
      `permission is not a DisposableTokenCachePermission object: ${JSON.stringify(
        p
      )}`
    );
  }
  return p as DisposableTokenCachePermission;
}

export interface DisposableTokenCachePermissions {
  permissions: Array<DisposableTokenCachePermission>;
}

export type DisposableTokenScope =
  | Permissions
  | PredefinedScope
  | DisposableTokenCachePermissions;

export interface DisposableTokenProps {
  tokenId?: string;
}

function isDisposableTokenPermissionObject(p: Permission): boolean {
  return isDisposableTokenCachePermission(p);
}

export function isDisposableTokenPermissionsObject(
  scope: DisposableTokenScope
): boolean {
  if (!('permissions' in scope)) {
    return false;
  }
  const permissions = scope.permissions;
  return permissions.every(p => isDisposableTokenPermissionObject(p));
}

export function asDisposableTokenPermissionsObject(
  scope: DisposableTokenScope
): DisposableTokenCachePermissions {
  if (!isDisposableTokenPermissionsObject(scope)) {
    throw new Error(
      `Token scope is not a DisposableToken permissions object: ${JSON.stringify(
        scope
      )}`
    );
  }
  return scope as DisposableTokenCachePermissions;
}
