export enum CacheRole {
  ReadWrite = 'readwrite',
  ReadOnly = 'readonly',
  WriteOnly = 'writeonly',
}

export const AllCaches = Symbol();
export const AllTopics = Symbol();
export const AllCacheItems = Symbol();
export const AllFunctions = Symbol();

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
  return 'role' in p && 'cache' in p && !('topic' in p) && !('func' in p);
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
  return 'role' in p && 'cache' in p && 'topic' in p && !('func' in p);
}

export function asTopicPermission(p: Permission): TopicPermission {
  if (!isTopicPermission(p)) {
    throw new Error(
      `permission is not a TopicPermission object: ${JSON.stringify(p)}`
    );
  }
  return p as TopicPermission;
}

export enum FunctionRole {
  FunctionPermitNone = 'functionpermitnone',
  FunctionInvoke = 'functioninvoke',
}

export interface FunctionName {
  name: string;
}

export function isFunction(
  func: FunctionName | typeof AllFunctions
): func is FunctionName {
  if (func === AllFunctions) {
    return false;
  }
  return 'name' in func;
}

export interface FunctionNamePrefix {
  namePrefix: string;
}

export function isFunctionNamePrefix(
  functionNamePrefix: FunctionSelector
): functionNamePrefix is FunctionNamePrefix {
  if (functionNamePrefix === AllFunctions) {
    return false;
  }
  if (typeof functionNamePrefix === 'string') {
    return false;
  }
  return 'namePrefix' in functionNamePrefix;
}

export type FunctionSelector =
  | typeof AllFunctions
  | FunctionName
  | FunctionNamePrefix
  | string;

export interface FunctionPermission {
  role: FunctionRole;
  /**
   * Scope the token permissions to select caches
   */
  cache: CacheSelector;
  func: FunctionSelector;
}

export function isFunctionPermission(p: Permission): boolean {
  return 'role' in p && 'cache' in p && 'func' in p;
}

export function asFunctionPermission(p: Permission): FunctionPermission {
  if (!isFunctionPermission(p)) {
    throw new Error(
      `permission is not a FunctionPermission object: ${JSON.stringify(p)}`
    );
  }
  return p as FunctionPermission;
}

export type Permission = CachePermission | TopicPermission | FunctionPermission;

export interface Permissions {
  permissions: Array<Permission>;
}

export const AllDataReadWrite: Permissions = {
  permissions: [
    {role: CacheRole.ReadWrite, cache: AllCaches},
    {role: TopicRole.PublishSubscribe, cache: AllCaches, topic: AllTopics},
    {role: FunctionRole.FunctionInvoke, cache: AllCaches, func: AllFunctions},
  ],
};

function isPermissionObject(p: Permission): boolean {
  return (
    isCachePermission(p) || isTopicPermission(p) || isFunctionPermission(p)
  );
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
