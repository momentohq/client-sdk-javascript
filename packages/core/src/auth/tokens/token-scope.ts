export enum CacheRole {
  None = 'none',
  ReadWrite = 'readwrite',
  ReadOnly = 'readonly',
}

export class All {}
export class CacheName {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}
export type CacheSelector = All | CacheName;

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

export class TopicName {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}
export type TopicSelector = All | TopicName;

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
  new CachePermission(CacheRole.ReadWrite, {cache: new All()}),
  new TopicPermission(TopicRole.ReadWrite, {
    cache: new All(),
    topic: new All(),
  }),
]);

export abstract class PredefinedScope {}

export type TokenScope =
  | typeof AllDataReadWrite
  | Permissions
  | PredefinedScope;
