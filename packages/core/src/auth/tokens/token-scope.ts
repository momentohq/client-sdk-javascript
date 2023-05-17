export enum CacheRole {
  None = 'none',
  ReadWrite = 'readwrite',
}

export interface CachePermission {
  cacheRole: CacheRole;
}

export enum TopicRole {
  None = 'none',
  ReadWrite = 'readwrite',
}

export interface TopicPermission {
  topicRole: TopicRole;
}

export type Permission = CachePermission | TopicPermission;

export interface Permissions {
  permissions: Array<Permission>;
}

export const AllDataReadWrite: Permissions = {
  permissions: [
    {cacheRole: CacheRole.ReadWrite},
    {topicRole: TopicRole.ReadWrite},
  ],
};

export type TokenScope = typeof AllDataReadWrite | Permissions;
