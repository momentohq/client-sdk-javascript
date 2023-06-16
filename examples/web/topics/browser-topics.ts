import {TopicClient, TopicItem, TopicPublish, TopicSubscribe} from '@gomomento/sdk-web';
import {ensureCacheExists} from './utils/cache';
import {delay, getTopicClient} from './utils/topics';
import * as hdr from 'hdr-histogram-js';

import {BasicConfigOptions, BrowserConfigOptions, TopicsLoadGenContextImpl} from './utils/config';
import * as fs from 'fs';

const publishHistogram = hdr.build();
const subscriptionHistogram = hdr.build();
const publishCsv = 'publish.csv';
const publishReceiveCsv = 'publish-and-receive.csv';
const topicsContextCsv = 'topics-context.csv';

export class Browser {
  private browserConfigOptions: BrowserConfigOptions;
  private basicConfigOptions: BasicConfigOptions;
  private readonly topicClient: TopicClient;

  private topicLoadGenContext = TopicsLoadGenContextImpl.initiateTopicsLoadGenContext();

  constructor(browserConfigOptions: BrowserConfigOptions, basicConfigOptions: BasicConfigOptions) {
    this.browserConfigOptions = browserConfigOptions;
    this.basicConfigOptions = basicConfigOptions;
    this.topicClient = getTopicClient();
  }

  async startSimulating(): Promise<void> {
    await ensureCacheExists(this.basicConfigOptions.cacheName);

    deleteCsvIfExists(publishCsv);
    deleteCsvIfExists(publishReceiveCsv);
    deleteCsvIfExists(topicsContextCsv);

    let subscriptionResponse: TopicSubscribe.Response = TopicSubscribe.Subscription;

    // Subscribe to the topic to receive published values
    for (let i = 0; i < this.browserConfigOptions.numSubscriptions; i++) {
      console.log(`Subscribing to topic ${this.basicConfigOptions.topicName}, subscription number: ${i}`);
      subscriptionResponse = await this.subscribeToTopic();
    }

    console.log('starting to simulate publish requests');

    const publishResponses: Promise<string | TopicPublish.Response | undefined>[] = [];

    const interval = 1000 / this.browserConfigOptions.publishRatePerSecond;
    let requestNum = 1;

    while (requestNum <= 100) {
      console.log(`Issuing Publishing request ${requestNum}`);
      const currentTimestamp = Date.now();
      const message = `${currentTimestamp}: Simulated message ${requestNum}`;

      const response = this.publishToTopic(this.topicClient, message);
      publishResponses.push(response);

      await delay(interval);

      requestNum += 1;
    }

    await Promise.all(publishResponses);

    this.topicLoadGenContext.totalPublishRequests = publishHistogram.totalCount;
    this.topicLoadGenContext.totalSubscriptionRequests = this.browserConfigOptions.numSubscriptions;

    console.log(publishHistogram);
    console.log(subscriptionHistogram);

    addToCSV(this.topicLoadGenContext.toString(), topicsContextCsv);

    // unsubscribe from topic
    if (subscriptionResponse instanceof TopicSubscribe.Subscription) {
      subscriptionResponse.unsubscribe();
    }
  }

  async publishToTopic(topicClient: TopicClient, message: string) {
    // const connectionsBefore = await this.getOpenTcpConnections();
    console.log(`Beginning to publish ${message} to topic ${this.basicConfigOptions.topicName}`);

    const startTime = process.hrtime();

    const response = await topicClient.publish(
      this.basicConfigOptions.cacheName,
      this.basicConfigOptions.topicName,
      message
    );

    const endTime = process.hrtime(startTime);
    const elapsedTime = endTime[0] * 1000 + endTime[1] / 1000000; // Convert to milliseconds

    publishHistogram.recordValue(elapsedTime);
    addToCSV(elapsedTime.toString(), publishCsv);

    if (response instanceof TopicPublish.Success) {
      this.topicLoadGenContext.numPublishSuccess += 1;
    } else if (response instanceof TopicPublish.Error) {
      console.log(`Error publishing ${message} to topic ${this.basicConfigOptions.topicName}, ${response.errorCode()}`);
      if (response.errorCode().includes('UNAVAILABLE')) {
        this.topicLoadGenContext.numPublishUnavailable += 1;
      } else if (response.errorCode().includes('LIMIT_EXCEEDED')) {
        this.topicLoadGenContext.numPublishLimitExceeded += 1;
      } else if (response.errorCode().includes('TIMEOUT_EXCEEDED')) {
        this.topicLoadGenContext.numPublishTimeoutExceeded += 1;
      }
    }
    return response;
  }

  async subscribeToTopic() {
    console.log(
      `Subscribing to topic ${this.basicConfigOptions.topicName} in cache ${this.basicConfigOptions.cacheName}`
    );
    const subscribeResponse = await this.topicClient.subscribe(
      this.basicConfigOptions.cacheName,
      this.basicConfigOptions.topicName,
      {
        onError: handleError,
        onItem: handleItem,
      }
    );

    if (subscribeResponse instanceof TopicSubscribe.Subscription) {
      this.topicLoadGenContext.numSubscriptionSuccess += 1;
      console.log(`Successfully subscribed to topic ${this.basicConfigOptions.topicName}`);
      // Wait for published values to be received.

      setTimeout(() => {
        console.log('Waiting for the published values');
      }, 120000);
    } else if (subscribeResponse instanceof TopicSubscribe.Error) {
      console.log(`Error subscribing to topic ${this.basicConfigOptions.topicName}`);
      if (subscribeResponse.errorCode().includes('UNAVAILABLE')) {
        this.topicLoadGenContext.numSubscriptionUnavailable += 1;
      } else if (subscribeResponse.errorCode().includes('LIMIT_EXCEEDED')) {
        this.topicLoadGenContext.numSubscriptionLimitExceeded += 1;
      } else if (subscribeResponse.errorCode().includes('TIMEOUT_EXCEEDED')) {
        this.topicLoadGenContext.numSubscriptionTimeoutExceeded += 1;
      }
    }

    return subscribeResponse;
  }
}

function handleItem(item: TopicItem) {
  console.log('Item received from topic subscription; %s', item);
  const timestamp = item.valueString().split(':')[0].trim();
  const startTime = parseInt(timestamp, 10);
  const currentTime = Date.now();

  const elapsedTime = currentTime - startTime;
  subscriptionHistogram.recordValue(elapsedTime);
  addToCSV(elapsedTime.toString(), publishReceiveCsv);
}

function handleError(error: TopicSubscribe.Error) {
  console.log(`Error received from topic subscription; ${error.toString()}`);
}

function addToCSV(data: string, filePath: string): void {
  try {
    fs.writeFileSync(filePath, data + '\n', {flag: 'a'});
  } catch (err) {
    console.error('Error appending to CSV file:', err);
  }
}

function deleteCsvIfExists(filePath: string) {
  // Delete existing CSV file if it exists
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
