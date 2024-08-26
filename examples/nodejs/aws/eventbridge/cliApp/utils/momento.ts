import {config} from 'dotenv';
config();

import {
  CacheClient,
  CacheGetResponse,
  Configurations,
  StringMomentoTokenProvider,
  TopicClient,
  TopicConfigurations,
  TopicItem,
  TopicSubscribe,
  TopicSubscribeResponse,
} from '@gomomento/sdk';
import {validateEnvVariables} from './helper';

validateEnvVariables(['MOMENTO_API_KEY']);
const cacheName = 'momento-eventbridge-cache';
const topicName = 'momento-eventbridge-topic';

function handleItem(item: TopicItem) {
  console.log(`Received item from topic subscription; ${item.valueString()}`);
}

function handleError(error: TopicSubscribe.Error) {
  console.log(`Error received from topic subscription; ${error.toString()}`);
}

let subscription: TopicSubscribe.Response | undefined;

export async function getCacheClient() {
  return await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: new StringMomentoTokenProvider(process.env.MOMENTO_API_KEY || ''),
    defaultTtlSeconds: 120,
  });
}

export function getTopicClient() {
  return new TopicClient({
    configuration: TopicConfigurations.Default.latest(),
    credentialProvider: new StringMomentoTokenProvider(process.env.MOMENTO_API_KEY || ''),
  });
}

export async function subscribeToTopic() {
  const topicClient = getTopicClient();
  subscription = await topicClient.subscribe(cacheName, topicName, {
    onItem: handleItem,
    onError: handleError,
  });
  switch (subscription.type) {
    case TopicSubscribeResponse.Error:
      console.log(`Error subscribing to topic: ${subscription.toString()}`);
      break;
    case TopicSubscribeResponse.Subscription:
      console.log('Subscribed to topic');
      break;
  }
}

export function unsubscribeFromTopic() {
  if (subscription instanceof TopicSubscribe.Subscription) {
    console.log('Unsubscribing from topic subscription');
    subscription.unsubscribe();
  }
}

export async function getItemFromCache(key: string) {
  const cacheClient = await getCacheClient();
  const getItemResponse = await cacheClient.get(cacheName, key);
  switch (getItemResponse.type) {
    case CacheGetResponse.Miss:
      return 'Item not found in cache';
    case CacheGetResponse.Hit:
      return getItemResponse.valueString();
    case CacheGetResponse.Error:
      return 'Error getting item from cache';
  }
}
