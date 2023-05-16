import {
  TopicPublish,
  TopicSubscribe,
  SubscribeCallOptions,
} from '../../../index';

export interface ITopicClient {
  publish(
    cacheName: string,
    topicName: string,
    value: string | Uint8Array
  ): Promise<TopicPublish.Response>;

  subscribe(
    cacheName: string,
    topicName: string,
    options: SubscribeCallOptions
  ): Promise<TopicSubscribe.Response>;
}
