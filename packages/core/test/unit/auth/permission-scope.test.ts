import {
  AllCaches,
  AllDataReadWrite,
  AllTopics,
  CacheRole,
  PermissionScope,
  PermissionScopes,
  TopicRole,
} from '../../../src';
import {
  AllFunctions,
  FunctionRole,
} from '../../../src/auth/tokens/permission-scope';
import {InternalSuperUserPermissions} from '../../../src/internal/utils';

describe('PermissionScope', () => {
  it('should support assignment from AllDataReadWrite constant', () => {
    const scope: PermissionScope = AllDataReadWrite;
    expect(scope).toEqual({
      permissions: [
        {role: CacheRole.ReadWrite, cache: AllCaches},
        {role: TopicRole.PublishSubscribe, cache: AllCaches, topic: AllTopics},
        {
          role: FunctionRole.FunctionInvoke,
          cache: AllCaches,
          func: AllFunctions,
        },
      ],
    });
  });

  it('should support assignment from PredefinedScope constant', () => {
    const scope: PermissionScope = new InternalSuperUserPermissions();
    expect(scope).toEqual(new InternalSuperUserPermissions());
  });

  describe('should support assignment from Permissions literal', () => {
    it('using string for cache name and string for function name', () => {
      const scope: PermissionScope = {
        permissions: [
          {
            role: FunctionRole.FunctionInvoke,
            cache: 'my-cache',
            func: 'my-function',
          },
        ],
      };
      expect(scope).toEqual({
        permissions: [
          {
            role: FunctionRole.FunctionInvoke,
            cache: 'my-cache',
            func: 'my-function',
          },
        ],
      });
    });
    it('using selector for cache name and string for function name', () => {
      const scope: PermissionScope = {
        permissions: [
          {
            role: FunctionRole.FunctionInvoke,
            cache: {name: 'my-cache'},
            func: 'my-function',
          },
        ],
      };
      expect(scope).toEqual({
        permissions: [
          {
            role: FunctionRole.FunctionInvoke,
            cache: {name: 'my-cache'},
            func: 'my-function',
          },
        ],
      });
    });
    it('using string for cache name and selector for function name', () => {
      const scope: PermissionScope = {
        permissions: [
          {
            role: FunctionRole.FunctionInvoke,
            cache: 'my-cache',
            func: {name: 'my-function'},
          },
        ],
      };
      expect(scope).toEqual({
        permissions: [
          {
            role: FunctionRole.FunctionInvoke,
            cache: 'my-cache',
            func: {name: 'my-function'},
          },
        ],
      });
    });
    it('using selector for cache name and selector for function name', () => {
      const scope: PermissionScope = {
        permissions: [
          {
            role: FunctionRole.FunctionInvoke,
            cache: {name: 'my-cache'},
            func: {name: 'my-function'},
          },
        ],
      };
      expect(scope).toEqual({
        permissions: [
          {
            role: FunctionRole.FunctionInvoke,
            cache: {name: 'my-cache'},
            func: {name: 'my-function'},
          },
        ],
      });
    });
    it('using string for cache name in a CachePermission', () => {
      const scope: PermissionScope = {
        permissions: [{role: CacheRole.ReadWrite, cache: 'my-cache'}],
      };
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadWrite, cache: 'my-cache'}],
      });
    });
    it('using CacheName selector literal for cache name in a CachePermission', () => {
      const scope: PermissionScope = {
        permissions: [{role: CacheRole.ReadWrite, cache: {name: 'my-cache'}}],
      };
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadWrite, cache: {name: 'my-cache'}}],
      });
    });
    it('using `AllCaches` selector in a CachePermission', () => {
      const scope: PermissionScope = {
        permissions: [{role: CacheRole.ReadWrite, cache: AllCaches}],
      };
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadWrite, cache: AllCaches}],
      });
    });
    it('using string for cache name and topic name in a TopicPermission', () => {
      const scope: PermissionScope = {
        permissions: [
          {
            role: TopicRole.PublishSubscribe,
            cache: 'mycache',
            topic: 'mytopic',
          },
        ],
      };
      expect(scope).toEqual({
        permissions: [
          {
            role: TopicRole.PublishSubscribe,
            cache: 'mycache',
            topic: 'mytopic',
          },
        ],
      });
    });
    it('using CacheName selector literal for cache name in a TopicPermission', () => {
      const scope: PermissionScope = {
        permissions: [
          {
            role: TopicRole.PublishSubscribe,
            cache: {name: 'mycache'},
            topic: 'mytopic',
          },
        ],
      };
      expect(scope).toEqual({
        permissions: [
          {
            role: TopicRole.PublishSubscribe,
            cache: {name: 'mycache'},
            topic: 'mytopic',
          },
        ],
      });
    });
    it('using `AllCaches` selector in a TopicPermission', () => {
      const scope: PermissionScope = {
        permissions: [
          {
            role: TopicRole.PublishSubscribe,
            cache: AllCaches,
            topic: 'mytopic',
          },
        ],
      };
      expect(scope).toEqual({
        permissions: [
          {
            role: TopicRole.PublishSubscribe,
            cache: AllCaches,
            topic: 'mytopic',
          },
        ],
      });
    });
    it('using TopicName selector literal for topic name in a TopicPermission', () => {
      const scope: PermissionScope = {
        permissions: [
          {
            role: TopicRole.PublishSubscribe,
            cache: 'mycache',
            topic: {name: 'mytopic'},
          },
        ],
      };
      expect(scope).toEqual({
        permissions: [
          {
            role: TopicRole.PublishSubscribe,
            cache: 'mycache',
            topic: {name: 'mytopic'},
          },
        ],
      });
    });
    it('using `AllTopics` selector in a TopicPermission', () => {
      const scope: PermissionScope = {
        permissions: [
          {
            role: TopicRole.PublishSubscribe,
            cache: 'mycache',
            topic: AllTopics,
          },
        ],
      };
      expect(scope).toEqual({
        permissions: [
          {
            role: TopicRole.PublishSubscribe,
            cache: 'mycache',
            topic: AllTopics,
          },
        ],
      });
    });
    it('mixing cache and topic permissions', () => {
      const scope: PermissionScope = {
        permissions: [
          {role: CacheRole.ReadWrite, cache: 'mycache'},
          {
            role: TopicRole.PublishSubscribe,
            cache: 'anothercache',
            topic: 'topic1',
          },
          {role: CacheRole.ReadOnly, cache: AllCaches},
          {
            role: TopicRole.SubscribeOnly,
            cache: 'anothercache',
            topic: 'topic2',
          },
        ],
      };
      expect(scope).toEqual({
        permissions: [
          {role: CacheRole.ReadWrite, cache: 'mycache'},
          {
            role: TopicRole.PublishSubscribe,
            cache: 'anothercache',
            topic: 'topic1',
          },
          {role: CacheRole.ReadOnly, cache: AllCaches},
          {
            role: TopicRole.SubscribeOnly,
            cache: 'anothercache',
            topic: 'topic2',
          },
        ],
      });
    });
  });

  describe('should support assignment from PermissionScope factory functions', () => {
    it('functionInvoke', () => {
      let scope: PermissionScope = PermissionScopes.functionInvoke(
        'mycache',
        'myfunction'
      );
      expect(scope).toEqual({
        permissions: [
          {
            role: FunctionRole.FunctionInvoke,
            cache: 'mycache',
            func: 'myfunction',
          },
        ],
      });
      scope = PermissionScopes.functionInvoke(AllCaches, AllFunctions);
      expect(scope).toEqual({
        permissions: [
          {
            role: FunctionRole.FunctionInvoke,
            cache: AllCaches,
            func: AllFunctions,
          },
        ],
      });
    });
    it('functionPermitNone', () => {
      let scope: PermissionScope = PermissionScopes.functionPermitNone(
        'mycache',
        'myfunction'
      );
      expect(scope).toEqual({
        permissions: [
          {
            role: FunctionRole.FunctionPermitNone,
            cache: 'mycache',
            func: 'myfunction',
          },
        ],
      });
      scope = PermissionScopes.functionPermitNone(AllCaches, AllFunctions);
      expect(scope).toEqual({
        permissions: [
          {
            role: FunctionRole.FunctionPermitNone,
            cache: AllCaches,
            func: AllFunctions,
          },
        ],
      });
    });
    it('cacheReadWrite', () => {
      let scope: PermissionScope = PermissionScopes.cacheReadWrite('mycache');
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadWrite, cache: 'mycache'}],
      });
      scope = PermissionScopes.cacheReadWrite(AllCaches);
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadWrite, cache: AllCaches}],
      });
      scope = PermissionScopes.cacheReadWrite({name: 'mycache'});
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadWrite, cache: {name: 'mycache'}}],
      });
    });
    it('cacheReadOnly', () => {
      let scope: PermissionScope = PermissionScopes.cacheReadOnly('mycache');
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadOnly, cache: 'mycache'}],
      });
      scope = PermissionScopes.cacheReadOnly(AllCaches);
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadOnly, cache: AllCaches}],
      });
      scope = PermissionScopes.cacheReadOnly({name: 'mycache'});
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadOnly, cache: {name: 'mycache'}}],
      });
    });
    it('cacheWriteOnly', () => {
      let scope: PermissionScope = PermissionScopes.cacheWriteOnly('mycache');
      expect(scope).toEqual({
        permissions: [{role: CacheRole.WriteOnly, cache: 'mycache'}],
      });
      scope = PermissionScopes.cacheWriteOnly(AllCaches);
      expect(scope).toEqual({
        permissions: [{role: CacheRole.WriteOnly, cache: AllCaches}],
      });
      scope = PermissionScopes.cacheWriteOnly({name: 'mycache'});
      expect(scope).toEqual({
        permissions: [{role: CacheRole.WriteOnly, cache: {name: 'mycache'}}],
      });
    });
    it('topicSubscribeOnly', () => {
      let scope: PermissionScope = PermissionScopes.topicSubscribeOnly(
        'mycache',
        'mytopic'
      );
      expect(scope).toEqual({
        permissions: [
          {role: TopicRole.SubscribeOnly, cache: 'mycache', topic: 'mytopic'},
        ],
      });
      scope = PermissionScopes.topicSubscribeOnly(AllCaches, AllTopics);
      expect(scope).toEqual({
        permissions: [
          {role: TopicRole.SubscribeOnly, cache: AllCaches, topic: AllTopics},
        ],
      });
      scope = PermissionScopes.topicSubscribeOnly(
        {name: 'mycache'},
        {name: 'mytopic'}
      );
      expect(scope).toEqual({
        permissions: [
          {
            role: TopicRole.SubscribeOnly,
            cache: {name: 'mycache'},
            topic: {name: 'mytopic'},
          },
        ],
      });
    });
    it('topicPublishOnly', () => {
      let scope: PermissionScope = PermissionScopes.topicPublishOnly(
        'mycache',
        'mytopic'
      );
      expect(scope).toEqual({
        permissions: [
          {role: TopicRole.PublishOnly, cache: 'mycache', topic: 'mytopic'},
        ],
      });
      scope = PermissionScopes.topicPublishOnly(AllCaches, AllTopics);
      expect(scope).toEqual({
        permissions: [
          {role: TopicRole.PublishOnly, cache: AllCaches, topic: AllTopics},
        ],
      });
      scope = PermissionScopes.topicPublishOnly(
        {name: 'mycache'},
        {name: 'mytopic'}
      );
      expect(scope).toEqual({
        permissions: [
          {
            role: TopicRole.PublishOnly,
            cache: {name: 'mycache'},
            topic: {name: 'mytopic'},
          },
        ],
      });
    });
    it('topicPublishSubscribe', () => {
      let scope: PermissionScope = PermissionScopes.topicPublishSubscribe(
        'mycache',
        'mytopic'
      );
      expect(scope).toEqual({
        permissions: [
          {
            role: TopicRole.PublishSubscribe,
            cache: 'mycache',
            topic: 'mytopic',
          },
        ],
      });
      scope = PermissionScopes.topicPublishSubscribe(AllCaches, AllTopics);
      expect(scope).toEqual({
        permissions: [
          {
            role: TopicRole.PublishSubscribe,
            cache: AllCaches,
            topic: AllTopics,
          },
        ],
      });
      scope = PermissionScopes.topicPublishSubscribe(
        {name: 'mycache'},
        {name: 'mytopic'}
      );
      expect(scope).toEqual({
        permissions: [
          {
            role: TopicRole.PublishSubscribe,
            cache: {name: 'mycache'},
            topic: {name: 'mytopic'},
          },
        ],
      });
    });
  });
});
