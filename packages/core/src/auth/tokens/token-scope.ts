export enum CacheRole {
  ReadWrite = 'readwrite',
  ReadOnly = 'readonly',
  WriteOnly = 'writeonly',
}

export const AllCaches = Symbol();
export const AllTopics = Symbol();
export const AllCacheItems = Symbol();

export interface CacheName {
  name: string;
}
export function isCacheName(
  cache: CacheName | typeof AllCaches
): cache is CacheName {
  if (cache === AllCaches) {
    return false;
  }
  return 'name' in cache;
}
export type CacheSelector = typeof AllCaches | CacheName | string;

export interface CachePermission {
  role: CacheRole;
  /**
   * Scope the token permissions to select caches
   */
  cache: CacheSelector;
}

export function isCachePermission(p: Permission): boolean {
  return 'role' in p && 'cache' in p && !('topic' in p);
}

export function asCachePermission(p: Permission): CachePermission {
  if (!isCachePermission(p)) {
    throw new Error(
      `permission is not a CachePermission object: ${JSON.stringify(p)}`
    );
  }
  return p as CachePermission;
}

export enum TopicRole {
  PublishSubscribe = 'publishsubscribe',
  SubscribeOnly = 'subscribeonly',
  PublishOnly = 'publishonly',
}

export interface TopicName {
  name: string;
}
export function isTopicName(
  topic: TopicName | typeof AllTopics
): topic is TopicName {
  if (topic === AllTopics) {
    return false;
  }
  return 'name' in topic;
}
export type TopicSelector = typeof AllTopics | TopicName | string;

export interface TopicPermission {
  role: TopicRole;
  /**
   * Scope the token permissions to select caches
   */
  cache: CacheSelector;
  /**
   * Scope the token permissions to select topics
   */
  topic: TopicSelector;
}

export function isTopicPermission(p: Permission): boolean {
  return 'role' in p && 'cache' in p && 'topic' in p;
}

export function asTopicPermission(p: Permission): TopicPermission {
  if (!isTopicPermission(p)) {
    throw new Error(
      `permission is not a TopicPermission object: ${JSON.stringify(p)}`
    );
  }
  return p as TopicPermission;
}

export type Permission = CachePermission | TopicPermission;

export interface Permissions {
  permissions: Array<Permission>;
}

export const AllDataReadWrite: Permissions = {
  permissions: [
    {role: CacheRole.ReadWrite, cache: AllCaches},
    {role: TopicRole.PublishSubscribe, cache: AllCaches, topic: AllTopics},
  ],
};

function isPermissionObject(p: Permission): boolean {
  return isCachePermission(p) || isTopicPermission(p);
}

export function isPermissionsObject(scope: TokenScope): boolean {
  if (!('permissions' in scope)) {
    return false;
  }
  const permissions = scope.permissions;
  return permissions.every(p => isPermissionObject(p));
}

export function asPermissionsObject(scope: TokenScope): Permissions {
  if (!isPermissionsObject(scope)) {
    throw new Error(
      `Token scope is not a Permissions object: ${JSON.stringify(scope)}`
    );
  }
  return scope as Permissions;
}

export abstract class PredefinedScope {}

export type TokenScope =
  | typeof AllDataReadWrite
  | Permissions
  | PredefinedScope;

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
  return 'role' in p && 'cache' in p && 'item' in p && !('topic' in p);
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
  console.log(
    `AS_DISPOSABLE_TOKEN_PERMISSIONS_OBJECT: ${JSON.stringify(scope)}`
  );
  if (!isDisposableTokenPermissionsObject(scope)) {
    throw new Error(
      `Token scope is not a DisposableTokenCachePermissions object: ${JSON.stringify(
        scope
      )}`
    );
  }
  return scope as DisposableTokenCachePermissions;
}
