import {TopicSubscribe} from '..';

export interface SubscribeCallOptions {
  dataListener(data: TopicSubscribe.Item): void;
  errorListener(error: TopicSubscribe.Error): void;
}
