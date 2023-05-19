export enum CacheRole {
  None = 'none',
  ReadWrite = 'readwrite',
}

export class CachePermission {
  cacheRole: CacheRole;

  constructor(cacheRole: CacheRole) {
    this.cacheRole = cacheRole;
  }
}

export enum TopicRole {
  None = 'none',
  ReadWrite = 'readwrite',
}

export class TopicPermission {
  topicRole: TopicRole;

  constructor(topicRole: TopicRole) {
    this.topicRole = topicRole;
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
