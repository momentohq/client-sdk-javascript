export enum CacheRole {
  ReadWrite = 'readwrite',
  ReadOnly = 'readonly',
}

class All {}
export const AllCaches = new All();
export const AllTopics = new All();

export interface CacheName {
  name: string;
}
export function isCacheName(cache: CacheName | All): cache is CacheName {
  return 'name' in cache;
}
export type CacheSelector = All | CacheName | string;

export interface CachePermissionOptions {
  /**
   * Scope the token permissions to specific caches
   */
  cache?: CacheSelector;
}

export interface CachePermission {
  role: CacheRole;
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
  PublishSubscribe = 'readwrite',
  SubscribeOnly = 'readonly',
}

export interface TopicName {
  name: string;
}
export function isTopicName(topic: TopicName | All): topic is TopicName {
  return 'name' in topic;
}
export type TopicSelector = All | TopicName | string;

export interface TopicPermissionOptions {
  /**
   * Scope the token permissions to specific caches
   */
  cache?: CacheSelector;
  /**
   * Scope the token permissions to specific topics
   */
  topic?: TopicSelector;
}

export interface TopicPermission {
  role: TopicRole;
  cache: CacheSelector;
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
