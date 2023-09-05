import {
  AllCacheItems,
  AllCaches,
  AllDataReadWrite,
  AllTopics,
  CacheRole,
  DisposableTokenScope,
  DisposableTokenScopes,
  TokenScopes,
  TopicRole,
} from '../../../src';

describe('DisposableTokenScope', () => {
  it('should support assignment from AllDataReadWrite constant', () => {
    const scope: DisposableTokenScope = AllDataReadWrite;
    expect(scope).toEqual({
      permissions: [
        {role: CacheRole.ReadWrite, cache: AllCaches},
        {role: TopicRole.PublishSubscribe, cache: AllCaches, topic: AllTopics},
      ],
    });
  });

  describe('should support assignment from Permissions literal', () => {
    it('using string for cache name in a CachePermission', () => {
      const scope: DisposableTokenScope = {
        permissions: [{role: CacheRole.ReadWrite, cache: 'my-cache'}],
      };
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadWrite, cache: 'my-cache'}],
      });
    });
    it('using CacheName selector literal for cache name in a CachePermission', () => {
      const scope: DisposableTokenScope = {
        permissions: [{role: CacheRole.ReadWrite, cache: {name: 'my-cache'}}],
      };
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadWrite, cache: {name: 'my-cache'}}],
      });
    });
    it('using `AllCaches` selector in a CachePermission', () => {
      const scope: DisposableTokenScope = {
        permissions: [{role: CacheRole.ReadWrite, cache: AllCaches}],
      };
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadWrite, cache: AllCaches}],
      });
    });
    it('using string for cache item in a CachePermission', () => {
      const scope: DisposableTokenScope = {
        permissions: [
          {role: CacheRole.ReadWrite, cache: 'my-cache', item: 'my-item'},
        ],
      };
      expect(scope).toEqual({
        permissions: [
          {role: CacheRole.ReadWrite, cache: 'my-cache', item: 'my-item'},
        ],
      });
    });
    it('using CacheItemKey selector literal for cache name in a CachePermission', () => {
      const scope: DisposableTokenScope = {
        permissions: [
          {
            role: CacheRole.ReadWrite,
            cache: {name: 'my-cache'},
            item: {key: 'my-key'},
          },
        ],
      };
      expect(scope).toEqual({
        permissions: [
          {
            role: CacheRole.ReadWrite,
            cache: {name: 'my-cache'},
            item: {key: 'my-key'},
          },
        ],
      });
    });

    it('using CacheItemKeyPrefix selector literal for cache name in a CachePermission', () => {
      const scope: DisposableTokenScope = {
        permissions: [
          {
            role: CacheRole.ReadWrite,
            cache: {name: 'my-cache'},
            item: {keyPrefix: 'my-key-prefix'},
          },
        ],
      };
      expect(scope).toEqual({
        permissions: [
          {
            role: CacheRole.ReadWrite,
            cache: {name: 'my-cache'},
            item: {keyPrefix: 'my-key-prefix'},
          },
        ],
      });
    });
    it('using `AllCacheItems` selector in a CachePermission', () => {
      const scope: DisposableTokenScope = {
        permissions: [
          {role: CacheRole.ReadWrite, cache: AllCaches, item: AllCacheItems},
        ],
      };
      expect(scope).toEqual({
        permissions: [
          {role: CacheRole.ReadWrite, cache: AllCaches, item: AllCacheItems},
        ],
      });
    });
    it('using string for cache name and topic name in a TopicPermission', () => {
      const scope: DisposableTokenScope = {
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
      const scope: DisposableTokenScope = {
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
      const scope: DisposableTokenScope = {
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
      const scope: DisposableTokenScope = {
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
      const scope: DisposableTokenScope = {
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
      const scope: DisposableTokenScope = {
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

  describe('should support assignment from TokenScope factory functions', () => {
    it('cacheReadWrite', () => {
      let scope: DisposableTokenScope = TokenScopes.cacheReadWrite('mycache');
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
      let scope: DisposableTokenScope = TokenScopes.cacheReadOnly('mycache');
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
    it('cacheWriteOnly', () => {
      let scope: DisposableTokenScope = TokenScopes.cacheWriteOnly('mycache');
      expect(scope).toEqual({
        permissions: [{role: CacheRole.WriteOnly, cache: 'mycache'}],
      });
      scope = TokenScopes.cacheWriteOnly(AllCaches);
      expect(scope).toEqual({
        permissions: [{role: CacheRole.WriteOnly, cache: AllCaches}],
      });
      scope = TokenScopes.cacheWriteOnly({name: 'mycache'});
      expect(scope).toEqual({
        permissions: [{role: CacheRole.WriteOnly, cache: {name: 'mycache'}}],
      });
    });
    it('topicSubscribeOnly', () => {
      let scope: DisposableTokenScope = TokenScopes.topicSubscribeOnly(
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
    it('topicPublishOnly', () => {
      let scope: DisposableTokenScope = TokenScopes.topicPublishOnly(
        'mycache',
        'mytopic'
      );
      expect(scope).toEqual({
        permissions: [
          {role: TopicRole.PublishOnly, cache: 'mycache', topic: 'mytopic'},
        ],
      });
      scope = TokenScopes.topicPublishOnly(AllCaches, AllTopics);
      expect(scope).toEqual({
        permissions: [
          {role: TopicRole.PublishOnly, cache: AllCaches, topic: AllTopics},
        ],
      });
      scope = TokenScopes.topicPublishOnly(
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
      let scope: DisposableTokenScope = TokenScopes.topicPublishSubscribe(
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

  describe('should support assignment from DisposableTokenScope factory functions', () => {
    it('cacheReadWrite', () => {
      let scope: DisposableTokenScope =
        DisposableTokenScopes.cacheReadWrite('mycache');
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadWrite, cache: 'mycache'}],
      });
      scope = DisposableTokenScopes.cacheReadWrite(AllCaches);
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadWrite, cache: AllCaches}],
      });
      scope = DisposableTokenScopes.cacheReadWrite({name: 'mycache'});
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadWrite, cache: {name: 'mycache'}}],
      });
    });
    it('cacheReadOnly', () => {
      let scope: DisposableTokenScope =
        DisposableTokenScopes.cacheReadOnly('mycache');
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadOnly, cache: 'mycache'}],
      });
      scope = DisposableTokenScopes.cacheReadOnly(AllCaches);
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadOnly, cache: AllCaches}],
      });
      scope = DisposableTokenScopes.cacheReadOnly({name: 'mycache'});
      expect(scope).toEqual({
        permissions: [{role: CacheRole.ReadOnly, cache: {name: 'mycache'}}],
      });
    });
    it('cacheWriteOnly', () => {
      let scope: DisposableTokenScope =
        DisposableTokenScopes.cacheWriteOnly('mycache');
      expect(scope).toEqual({
        permissions: [{role: CacheRole.WriteOnly, cache: 'mycache'}],
      });
      scope = DisposableTokenScopes.cacheWriteOnly(AllCaches);
      expect(scope).toEqual({
        permissions: [{role: CacheRole.WriteOnly, cache: AllCaches}],
      });
      scope = DisposableTokenScopes.cacheWriteOnly({name: 'mycache'});
      expect(scope).toEqual({
        permissions: [{role: CacheRole.WriteOnly, cache: {name: 'mycache'}}],
      });
    });

    it('cacheKeyReadOnly', () => {
      let scope: DisposableTokenScope = DisposableTokenScopes.cacheKeyReadOnly(
        'mycache',
        'mykey'
      );
      expect(scope).toEqual({
        permissions: [
          {role: CacheRole.ReadOnly, cache: 'mycache', item: 'mykey'},
        ],
      });
      scope = DisposableTokenScopes.cacheKeyReadOnly(AllCaches, 'mykey');
      expect(scope).toEqual({
        permissions: [
          {role: CacheRole.ReadOnly, cache: AllCaches, item: 'mykey'},
        ],
      });
      scope = DisposableTokenScopes.cacheKeyReadOnly(
        {name: 'mycache'},
        'mykey'
      );
      expect(scope).toEqual({
        permissions: [
          {role: CacheRole.ReadOnly, cache: {name: 'mycache'}, item: 'mykey'},
        ],
      });
    });

    it('cacheKeyReadWrite', () => {
      let scope: DisposableTokenScope = DisposableTokenScopes.cacheKeyReadWrite(
        'mycache',
        'mykey'
      );
      expect(scope).toEqual({
        permissions: [
          {role: CacheRole.ReadWrite, cache: 'mycache', item: 'mykey'},
        ],
      });
      scope = DisposableTokenScopes.cacheKeyReadWrite(AllCaches, 'mykey');
      expect(scope).toEqual({
        permissions: [
          {role: CacheRole.ReadWrite, cache: AllCaches, item: 'mykey'},
        ],
      });
      scope = DisposableTokenScopes.cacheKeyReadWrite(
        {name: 'mycache'},
        'mykey'
      );
      expect(scope).toEqual({
        permissions: [
          {role: CacheRole.ReadWrite, cache: {name: 'mycache'}, item: 'mykey'},
        ],
      });
    });

    it('cacheKeyWriteOnly', () => {
      let scope: DisposableTokenScope = DisposableTokenScopes.cacheKeyWriteOnly(
        'mycache',
        'mykey'
      );
      expect(scope).toEqual({
        permissions: [
          {role: CacheRole.WriteOnly, cache: 'mycache', item: 'mykey'},
        ],
      });
      scope = DisposableTokenScopes.cacheKeyWriteOnly(AllCaches, 'mykey');
      expect(scope).toEqual({
        permissions: [
          {role: CacheRole.WriteOnly, cache: AllCaches, item: 'mykey'},
        ],
      });
      scope = DisposableTokenScopes.cacheKeyWriteOnly(
        {name: 'mycache'},
        'mykey'
      );
      expect(scope).toEqual({
        permissions: [
          {
            role: CacheRole.WriteOnly,
            cache: {name: 'mycache'},
            item: 'mykey',
          },
        ],
      });
    });

    it('cacheKeyPrefixReadOnly', () => {
      let scope: DisposableTokenScope =
        DisposableTokenScopes.cacheKeyPrefixReadOnly('mycache', 'mykeyprefix');
      expect(scope).toEqual({
        permissions: [
          {
            role: CacheRole.ReadOnly,
            cache: 'mycache',
            item: {keyPrefix: 'mykeyprefix'},
          },
        ],
      });
      scope = DisposableTokenScopes.cacheKeyPrefixReadOnly(
        AllCaches,
        'mykeyprefix'
      );
      expect(scope).toEqual({
        permissions: [
          {
            role: CacheRole.ReadOnly,
            cache: AllCaches,
            item: {keyPrefix: 'mykeyprefix'},
          },
        ],
      });
      scope = DisposableTokenScopes.cacheKeyPrefixReadOnly(
        {name: 'mycache'},
        'mykeyprefix'
      );
      expect(scope).toEqual({
        permissions: [
          {
            role: CacheRole.ReadOnly,
            cache: {name: 'mycache'},
            item: {keyPrefix: 'mykeyprefix'},
          },
        ],
      });
    });

    it('cacheKeyPrefixReadWrite', () => {
      let scope: DisposableTokenScope =
        DisposableTokenScopes.cacheKeyPrefixReadWrite('mycache', 'mykeyprefix');
      expect(scope).toEqual({
        permissions: [
          {
            role: CacheRole.ReadWrite,
            cache: 'mycache',
            item: {keyPrefix: 'mykeyprefix'},
          },
        ],
      });
      scope = DisposableTokenScopes.cacheKeyPrefixReadWrite(
        AllCaches,
        'mykeyprefix'
      );
      expect(scope).toEqual({
        permissions: [
          {
            role: CacheRole.ReadWrite,
            cache: AllCaches,
            item: {keyPrefix: 'mykeyprefix'},
          },
        ],
      });
      scope = DisposableTokenScopes.cacheKeyPrefixReadWrite(
        {name: 'mycache'},
        'mykeyprefix'
      );
      expect(scope).toEqual({
        permissions: [
          {
            role: CacheRole.ReadWrite,
            cache: {name: 'mycache'},
            item: {keyPrefix: 'mykeyprefix'},
          },
        ],
      });
    });

    it('cacheKeyPrefixWriteOnly', () => {
      let scope: DisposableTokenScope =
        DisposableTokenScopes.cacheKeyPrefixWriteOnly('mycache', 'mykeyprefix');
      expect(scope).toEqual({
        permissions: [
          {
            role: CacheRole.WriteOnly,
            cache: 'mycache',
            item: {keyPrefix: 'mykeyprefix'},
          },
        ],
      });
      scope = DisposableTokenScopes.cacheKeyPrefixWriteOnly(
        AllCaches,
        'mykeyprefix'
      );
      expect(scope).toEqual({
        permissions: [
          {
            role: CacheRole.WriteOnly,
            cache: AllCaches,
            item: {keyPrefix: 'mykeyprefix'},
          },
        ],
      });
      scope = DisposableTokenScopes.cacheKeyPrefixWriteOnly(
        {name: 'mycache'},
        'mykeyprefix'
      );
      expect(scope).toEqual({
        permissions: [
          {
            role: CacheRole.WriteOnly,
            cache: {name: 'mycache'},
            item: {keyPrefix: 'mykeyprefix'},
          },
        ],
      });
    });

    it('topicSubscribeOnly', () => {
      let scope: DisposableTokenScope =
        DisposableTokenScopes.topicSubscribeOnly('mycache', 'mytopic');
      expect(scope).toEqual({
        permissions: [
          {role: TopicRole.SubscribeOnly, cache: 'mycache', topic: 'mytopic'},
        ],
      });
      scope = DisposableTokenScopes.topicSubscribeOnly(AllCaches, AllTopics);
      expect(scope).toEqual({
        permissions: [
          {role: TopicRole.SubscribeOnly, cache: AllCaches, topic: AllTopics},
        ],
      });
      scope = DisposableTokenScopes.topicSubscribeOnly(
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
      let scope: DisposableTokenScope = DisposableTokenScopes.topicPublishOnly(
        'mycache',
        'mytopic'
      );
      expect(scope).toEqual({
        permissions: [
          {role: TopicRole.PublishOnly, cache: 'mycache', topic: 'mytopic'},
        ],
      });
      scope = DisposableTokenScopes.topicPublishOnly(AllCaches, AllTopics);
      expect(scope).toEqual({
        permissions: [
          {role: TopicRole.PublishOnly, cache: AllCaches, topic: AllTopics},
        ],
      });
      scope = DisposableTokenScopes.topicPublishOnly(
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
      let scope: DisposableTokenScope =
        DisposableTokenScopes.topicPublishSubscribe('mycache', 'mytopic');
      expect(scope).toEqual({
        permissions: [
          {
            role: TopicRole.PublishSubscribe,
            cache: 'mycache',
            topic: 'mytopic',
          },
        ],
      });
      scope = DisposableTokenScopes.topicPublishSubscribe(AllCaches, AllTopics);
      expect(scope).toEqual({
        permissions: [
          {
            role: TopicRole.PublishSubscribe,
            cache: AllCaches,
            topic: AllTopics,
          },
        ],
      });
      scope = DisposableTokenScopes.topicPublishSubscribe(
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
