export enum CacheRole {
  None = 'none',
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

// export class CachePermission {
//   cacheRole: CacheRole;
//   cache: CacheSelector;
//
//   constructor(cacheRole: CacheRole, options?: CachePermissionOptions) {
//     this.cacheRole = cacheRole;
//     this.cache = options?.cache ?? AllCaches;
//   }
// }

export enum TopicRole {
  None = 'none',
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

// export class TopicPermission {
//   topicRole: TopicRole;
//   cache: CacheSelector;
//   topic: TopicSelector;
//   constructor(topicRole: TopicRole, options?: TopicPermissionOptions) {
//     this.topicRole = topicRole;
//     this.cache = options?.cache ?? AllCaches;
//     this.topic = options?.topic ?? AllTopics;
//   }
// }

export interface TopicPermission {
  role: TopicRole;
  cache: CacheSelector;
  topic: TopicSelector;
}

export type Permission = CachePermission | TopicPermission;

// export class Permissions {
//   permissions: Array<Permission>;
//
//   constructor(permissions: Array<Permission>) {
//     this.permissions = permissions;
//   }
// }

export interface Permissions {
  permissions: Array<Permission>;
}

export const AllDataReadWrite: Permissions = {
  permissions: [
    {role: CacheRole.ReadWrite, cache: AllCaches},
    {role: TopicRole.PublishSubscribe, cache: AllCaches, topic: AllTopics},
  ],
};

export abstract class PredefinedScope {}

export type TokenScope =
  | typeof AllDataReadWrite
  | Permissions
  | PredefinedScope;

