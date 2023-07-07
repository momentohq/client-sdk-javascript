import {
  CacheRole,
  CacheSelector,
  TokenScope,
  TopicRole,
  TopicSelector,
} from './token-scope';

export function cacheReadWrite(cacheSelector: CacheSelector): TokenScope {
  return {
    permissions: [{role: CacheRole.ReadWrite, cache: cacheSelector}],
  };
}

export function cacheReadOnly(cacheSelector: CacheSelector): TokenScope {
  return {
    permissions: [{role: CacheRole.ReadOnly, cache: cacheSelector}],
  };
}

export function topicSubscribeOnly(
  cacheSelector: CacheSelector,
  topicSelector: TopicSelector
): TokenScope {
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
): TokenScope {
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
