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
export type CacheResource = All | CacheName;

export class CachePermission {
  cacheRole: CacheRole;
  cache: CacheResource;

  constructor(cacheRole: CacheRole, cache?: CacheResource) {
    this.cacheRole = cacheRole;
    if (cache) {
      this.cache = cache;
    } else {
      this.cache = new All();
    }
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
export type TopicResource = All | TopicName;

export class TopicPermission {
  topicRole: TopicRole;
  cache: CacheResource;
  topic: TopicResource;
  constructor(
    topicRole: TopicRole,
    cache?: CacheResource,
    topic?: TopicResource
  ) {
    this.topicRole = topicRole;
    if (cache) {
      this.cache = cache;
    } else {
      this.cache = new All();
    }
    if (topic) {
      this.topic = topic;
    } else {
      this.topic = new All();
    }
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
  new CachePermission(CacheRole.ReadWrite, new All()),
  new TopicPermission(TopicRole.ReadWrite, new All(), new All()),
]);

export abstract class PredefinedScope {}

export type TokenScope =
  | typeof AllDataReadWrite
  | Permissions
  | PredefinedScope;
