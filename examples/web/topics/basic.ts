import {
  CacheClient,
  CreateCacheResponse,
  SubscribeCallOptions,
  TopicClient,
  TopicItem,
  TopicPublishResponse,
  TopicSubscribe,
  TopicSubscribeResponse,
} from '@gomomento/sdk-web';
import {initJSDom} from './utils/jsdom';

async function main() {
  // Because the Momento Web SDK is intended for use in a browser, we use the JSDom library to set up an environment
  // that will allow us to use it in a node.js program.
  initJSDom();
  const cacheClient = new CacheClient({
    defaultTtlSeconds: 60,
  });
  const topicClient = new TopicClient();

  const createCacheResponse = await cacheClient.createCache('cache');
  switch (createCacheResponse.type) {
    case CreateCacheResponse.AlreadyExists:
      console.log('cache already exists');
      break;
    case CreateCacheResponse.Success:
      console.log('cache created');
      break;
    case CreateCacheResponse.Error:
      throw createCacheResponse.innerException();
  }

  console.log("Subscribing to topic 'topic'");
  const subscribeCallOptions: SubscribeCallOptions = {
    onItem: (item: TopicItem) => {
      console.log(`Received message: ${item.valueString()}`);
    },
    onError: (error: TopicSubscribe.Error, subscription: TopicSubscribe.Subscription) => {
      console.error(`Error: ${error.message()}`);
      subscription.unsubscribe();
    },
  };
  let subscription: TopicSubscribe.Subscription | undefined;
  const subscribeResponse = await topicClient.subscribe('cache', 'topic', subscribeCallOptions);
  switch (subscribeResponse.type) {
    case TopicSubscribeResponse.Subscription: {
      console.log("Subscribed to topic 'topic'");
      subscription = subscribeResponse;
      break;
    }
    case TopicSubscribeResponse.Error: {
      console.error(`Error: ${subscribeResponse.message()}`);
      break;
    }
  }

  console.log('Publishing message to topic');
  const publishResponse = await topicClient.publish('cache', 'topic', 'Hello, world!');
  switch (publishResponse.type) {
    case TopicPublishResponse.Success: {
      console.log('Message published successfully to topic "topic"');
      break;
    }
    case TopicPublishResponse.Error: {
      console.error(`Error: ${publishResponse.message()}`);
      break;
    }
  }

  console.log("Unsubscribing from topic 'topic'");
  subscription?.unsubscribe();
}

main()
  .then(() => {
    console.log('success!!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
