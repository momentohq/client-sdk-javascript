export enum CacheRole {
  None = 'none',
  ReadWrite = 'readwrite',
  ReadOnly = 'readonly',
}

export class Any {}
export class CacheName {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}
export type CacheResource = Any | CacheName;

export class CachePermission {
  cacheRole: CacheRole;
  cache: CacheResource;

  constructor(cacheRole: CacheRole, cache?: CacheResource) {
    this.cacheRole = cacheRole;
    if (cache) {
      this.cache = cache;
    } else {
      this.cache = new Any();
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
export type TopicResource = Any | TopicName;

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
      this.cache = new Any();
    }
    if (topic) {
      this.topic = topic;
    } else {
      this.topic = new Any();
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
  new CachePermission(CacheRole.ReadWrite, new Any()),
  new TopicPermission(TopicRole.ReadWrite, new Any(), new Any()),
]);

export abstract class PredefinedScope {}

export type TokenScope =
  | typeof AllDataReadWrite
  | Permissions
  | PredefinedScope;
