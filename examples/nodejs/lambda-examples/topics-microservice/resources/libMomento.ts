import { TopicClient, TopicPublish } from '@gomomento/sdk';

interface WrapperArgs {
  client: TopicClient,
  cacheName: string,
  topicName: string
}

export class PublishingWrapper {
  client: TopicClient
  cacheName: string
  topicName: string

  constructor({client, cacheName, topicName}: WrapperArgs) {
    this.client = client
    this.cacheName = cacheName
    this.topicName = topicName
  }

  public async publishItem(valueToPublish: string): Promise<string> {

    const setResponse = await this.client.publish(this.cacheName, this.topicName, valueToPublish);
    // If the value is published to the Momento topic, return success.
    if (setResponse instanceof TopicPublish.Success) {
      console.log(`Published data to Momento topic. key=${valueToPublish}`);
      return "success";
    } else if (setResponse instanceof TopicPublish.Error) {
       throw new Error(`Data failed to be published to Momento topics. key=${valueToPublish} err=${setResponse.message()}`);
    }
    return "error";
  }}
