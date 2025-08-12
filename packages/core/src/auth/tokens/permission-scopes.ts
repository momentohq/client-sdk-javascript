import {
  CacheRole,
  CacheSelector,
  FunctionRole,
  FunctionSelector,
  PermissionScope,
  TopicRole,
  TopicSelector,
} from './permission-scope';

export function functionInvoke(
  cacheSelector: CacheSelector,
  functionSelector: FunctionSelector
): PermissionScope {
  return {
    permissions: [
      {
        role: FunctionRole.FunctionInvoke,
        cache: cacheSelector,
        func: functionSelector,
      },
    ],
  };
}

export function functionPermitNone(
  cacheSelector: CacheSelector,
  functionSelector: FunctionSelector
): PermissionScope {
  return {
    permissions: [
      {
        role: FunctionRole.FunctionPermitNone,
        cache: cacheSelector,
        func: functionSelector,
      },
    ],
  };
}

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
