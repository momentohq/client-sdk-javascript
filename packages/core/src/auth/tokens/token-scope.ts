export enum CacheRole {
  ReadWrite = 'readwrite',
  ReadOnly = 'readonly',
  WriteOnly = 'writeonly',
}

class All {}
export const AllCaches = new All();
export const AllTopics = new All();
export const AllItems = new All();

export interface CacheName {
  name: string;
}
export function isCacheName(cache: CacheName | All): cache is CacheName {
  return 'name' in cache;
}
export type CacheSelector = All | CacheName | string;

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
export function isTopicName(topic: TopicName | All): topic is TopicName {
  return 'name' in topic;
}
export type TopicSelector = All | TopicName | string;

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
  cacheItem: CacheItemKey | All
): cacheItem is CacheItemKey {
  return 'key' in cacheItem;
}

export function isCacheItemKeyPrefix(
  cacheItem: CacheItemKeyPrefix | All
): cacheItem is CacheItemKeyPrefix {
  return 'keyPrefix' in cacheItem;
}

export type CacheItemSelector =
  | All
  | CacheItemKey
  | CacheItemKeyPrefix
  | string;

export interface TemporaryTokenCachePermission extends CachePermission {
  /**
   * Scope the token permissions to select cache items
   */
  item: CacheItemSelector;
}

export function isTemporaryTokenCachePermission(p: Permission): boolean {
  return 'role' in p && 'cache' in p && 'item' in p && !('topic' in p);
}

export function asTemporaryTokenCachePermission(
  p: Permission
): TemporaryTokenCachePermission {
  if (!isTemporaryTokenCachePermission(p)) {
    throw new Error(
      `permission is not a TemporaryTokenCachePermission object: ${JSON.stringify(
        p
      )}`
    );
  }
  return p as TemporaryTokenCachePermission;
}

export type TemporaryTokenScope =
  | typeof AllDataReadWrite
  | Permissions
  | TemporaryTokenCachePermission;

function isTemporaryTokenPermissionObject(p: Permission): boolean {
  return (
    isCachePermission(p) ||
    isTopicPermission(p) ||
    isTemporaryTokenCachePermission(p)
  );
}

export function isTempororayTokenPermissionsObject(
  scope: TemporaryTokenScope
): boolean {
  if (!('permissions' in scope)) {
    return false;
  }
  const permissions = scope.permissions;
  return permissions.every(p => isTemporaryTokenPermissionObject(p));
}
