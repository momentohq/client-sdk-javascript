import {
  TopicPublish,
  TopicSubscribe,
  SubscribeCallOptions,
} from '../../../index';

export interface IPubsubClient {
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
