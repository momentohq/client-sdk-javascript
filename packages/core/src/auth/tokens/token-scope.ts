export enum CacheRole {
  None = 'none',
  ReadWrite = 'readwrite',
}

export interface CacheRestriction {
  cacheRole: CacheRole;
}

export enum TopicRole {
  None = 'none',
  ReadWrite = 'readwrite',
}

export interface TopicRestriction {
  topicRole: TopicRole;
}

export type Restriction = CacheRestriction | TopicRestriction;

export interface Restrictions {
  restrictions: Array<Restriction>;
}

export const AllDataReadWrite: Restrictions = {
  restrictions: [
    {cacheRole: CacheRole.ReadWrite},
    {topicRole: TopicRole.ReadWrite},
  ],
};

export type TokenScope = typeof AllDataReadWrite | Restrictions;
