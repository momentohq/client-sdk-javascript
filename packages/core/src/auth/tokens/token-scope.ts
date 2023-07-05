export enum CacheRole {
  None = 'none',
  ReadWrite = 'readwrite',
  ReadOnly = 'readonly',
}

export class All {}
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

export class CachePermission {
  cacheRole: CacheRole;
  cache: CacheSelector;

  constructor(cacheRole: CacheRole, options?: CachePermissionOptions) {
    this.cacheRole = cacheRole;
    this.cache = options?.cache ?? new All();
  }
}

export enum TopicRole {
  None = 'none',
  ReadWrite = 'readwrite',
  ReadOnly = 'readonly',
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

export class TopicPermission {
  topicRole: TopicRole;
  cache: CacheSelector;
  topic: TopicSelector;
  constructor(topicRole: TopicRole, options?: TopicPermissionOptions) {
    this.topicRole = topicRole;
    this.cache = options?.cache ?? new All();
    this.topic = options?.topic ?? new All();
  }
}

export type Permission = CachePermission | TopicPermission;

export class Permissions {
  permissions: Array<Permission>;

  constructor(permissions: Array<Permission>) {
    this.permissions = permissions;
  }
}

export const AllDataReadWrite: Permissions = new Permissions([
  new CachePermission(CacheRole.ReadWrite),
  new TopicPermission(TopicRole.ReadWrite),
]);

export abstract class PredefinedScope {}

export type TokenScope =
  | typeof AllDataReadWrite
  | Permissions
  | PredefinedScope;
