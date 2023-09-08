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

export function isPermissionsObject(scope: PermissionScope): boolean {
  if (!('permissions' in scope)) {
    return false;
  }
  const permissions = scope.permissions;
  return permissions.every(p => isPermissionObject(p));
}

export function asPermissionsObject(scope: PermissionScope): Permissions {
  if (!isPermissionsObject(scope)) {
    throw new Error(
      `Token scope is not a Permissions object: ${JSON.stringify(scope)}`
    );
  }
  return scope as Permissions;
}

export abstract class PredefinedScope {}

export type PermissionScope =
  | typeof AllDataReadWrite
  | Permissions
  | PredefinedScope;

/**
 * @deprecated please use PermissionScope instead
 */
export type TokenScope = PermissionScope;
