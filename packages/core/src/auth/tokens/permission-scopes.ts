import {
  CacheRole,
  CacheSelector,
  PermissionScope,
  TopicRole,
  TopicSelector,
} from './permission-scope';

export function cacheReadWrite(cacheSelector: CacheSelector): PermissionScope {
  return {
    permissions: [{role: CacheRole.ReadWrite, cache: cacheSelector}],
  };
}

export function cacheReadOnly(cacheSelector: CacheSelector): PermissionScope {
  return {
    permissions: [{role: CacheRole.ReadOnly, cache: cacheSelector}],
  };
}

export function cacheWriteOnly(cacheSelector: CacheSelector): PermissionScope {
  return {
    permissions: [{role: CacheRole.WriteOnly, cache: cacheSelector}],
  };
}

export function topicSubscribeOnly(
  cacheSelector: CacheSelector,
  topicSelector: TopicSelector
): PermissionScope {
  return {
    permissions: [
      {
        role: TopicRole.SubscribeOnly,
        cache: cacheSelector,
        topic: topicSelector,
      },
    ],
  };
}

export function topicPublishSubscribe(
  cacheSelector: CacheSelector,
  topicSelector: TopicSelector
): PermissionScope {
  return {
    permissions: [
      {
        role: TopicRole.PublishSubscribe,
        cache: cacheSelector,
        topic: topicSelector,
      },
    ],
  };
}

export function topicPublishOnly(
  cacheSelector: CacheSelector,
  topicSelector: TopicSelector
): PermissionScope {
  return {
    permissions: [
      {
        role: TopicRole.PublishOnly,
        cache: cacheSelector,
        topic: topicSelector,
      },
    ],
  };
}
