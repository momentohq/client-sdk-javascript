import {
  AllCaches,
  AllDataReadWrite,
  AllTopics,
  CacheRole,
  TokenScope,
  TokenScopes,
  TopicRole,
} from '../../../src';
import {InternalSuperUserPermissions} from '../../../src/internal/utils';

describe('TokenScope', () => {
  it('should support assignment from AllDataReadWrite constant', () => {
    const scope: TokenScope = AllDataReadWrite;
    expect(scope).toEqual({
      permissions: [
        {role: CacheRole.ReadWrite, cache: AllCaches},
        {role: TopicRole.PublishSubscribe, cache: AllCaches, topic: AllTopics},
      ],
    });
  });

  it('should support assignment from PredefinedScope constant', () => {
    const scope: TokenScope = new InternalSuperUserPermissions();
    expect(scope).toEqual(new InternalSuperUserPermissions());
  });

  describe('should support assignment from Permissions literal', () => {
    it('using string for cache name in a CachePermission', () => {
      const scope: TokenScope = {
        permissions: [{role: CacheRole.ReadWrite, cache: 'my-cache'}],
      };
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadWrite, cache: 'my-cache'}],
      });
    });
    it('using CacheName selector literal for cache name in a CachePermission', () => {
      const scope: TokenScope = {
        permissions: [{role: CacheRole.ReadWrite, cache: {name: 'my-cache'}}],
      };
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadWrite, cache: {name: 'my-cache'}}],
      });
    });
    it('using `AllCaches` selector in a CachePermission', () => {
      const scope: TokenScope = {
        permissions: [{role: CacheRole.ReadWrite, cache: AllCaches}],
      };
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadWrite, cache: AllCaches}],
      });
    });
    it('using string for cache name and topic name in a TopicPermission', () => {
      const scope: TokenScope = {
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
      const scope: TokenScope = {
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
      const scope: TokenScope = {
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
      const scope: TokenScope = {
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
      const scope: TokenScope = {
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
      const scope: TokenScope = {
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

  describe('should support assignment from TopicScope factory functions', () => {
    it('cacheReadWrite', () => {
      let scope: TokenScope = TokenScopes.cacheReadWrite('mycache');
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadWrite, cache: 'mycache'}],
      });
      scope = TokenScopes.cacheReadWrite(AllCaches);
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadWrite, cache: AllCaches}],
      });
      scope = TokenScopes.cacheReadWrite({name: 'mycache'});
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadWrite, cache: {name: 'mycache'}}],
      });
    });
    it('cacheReadOnly', () => {
      let scope: TokenScope = TokenScopes.cacheReadOnly('mycache');
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadOnly, cache: 'mycache'}],
      });
      scope = TokenScopes.cacheReadOnly(AllCaches);
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadOnly, cache: AllCaches}],
      });
      scope = TokenScopes.cacheReadOnly({name: 'mycache'});
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadOnly, cache: {name: 'mycache'}}],
      });
    });
    it('topicSubscribeOnly', () => {
      let scope: TokenScope = TokenScopes.topicSubscribeOnly(
        'mycache',
        'mytopic'
      );
      expect(scope).toEqual({
        permissions: [
          {role: TopicRole.SubscribeOnly, cache: 'mycache', topic: 'mytopic'},
        ],
      });
      scope = TokenScopes.topicSubscribeOnly(AllCaches, AllTopics);
      expect(scope).toEqual({
        permissions: [
          {role: TopicRole.SubscribeOnly, cache: AllCaches, topic: AllTopics},
        ],
      });
      scope = TokenScopes.topicSubscribeOnly(
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
    it('topicPublishSubscribe', () => {
      let scope: TokenScope = TokenScopes.topicPublishSubscribe(
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
      scope = TokenScopes.topicPublishSubscribe(AllCaches, AllTopics);
      expect(scope).toEqual({
        permissions: [
          {
            role: TopicRole.PublishSubscribe,
            cache: AllCaches,
            topic: AllTopics,
          },
        ],
      });
      scope = TokenScopes.topicPublishSubscribe(
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
