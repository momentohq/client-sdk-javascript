import {TopicClient, TopicItem, TopicPublish, TopicSubscribe} from '@gomomento/sdk-web';
import {ensureCacheExists} from './utils/cache';
import {delay, getTopicClient} from './utils/topics';
import * as hdr from 'hdr-histogram-js';

import {BasicConfigOptions, BrowserConfigOptions, TopicsLoadGenContextImpl} from './utils/config';
import * as fs from 'fs';
import {PutObjectCommand, S3Client} from '@aws-sdk/client-s3';
import {initJSDom} from './utils/jsdom';

const publishHistogram = hdr.build();
const subscriptionHistogram = hdr.build();
const publishCsv = 'publish.csv';
const publishReceiveCsv = 'publish-and-receive.csv';
const topicsContextCsv = 'topics-context.csv';
const bucketName = 'topics-loadgen-test-bucket';

export class Browser {
  private browserConfigOptions: BrowserConfigOptions;
  private basicConfigOptions: BasicConfigOptions;
  private readonly topicClient: TopicClient;

  private subscriptionResponse: TopicSubscribe.Response;

  private topicLoadGenContext = TopicsLoadGenContextImpl.initiateTopicsLoadGenContext();

  constructor(browserConfigOptions: BrowserConfigOptions, basicConfigOptions: BasicConfigOptions) {
    this.browserConfigOptions = browserConfigOptions;
    this.basicConfigOptions = basicConfigOptions;
    this.topicClient = getTopicClient();
  }

  async startSimulating(): Promise<void> {
    initJSDom();
    await ensureCacheExists(this.basicConfigOptions.cacheName);

    deleteCsvIfExists(publishCsv);
    deleteCsvIfExists(publishReceiveCsv);
    deleteCsvIfExists(topicsContextCsv);

    // Subscribe to the topic to receive published values
    for (let i = 0; i < this.browserConfigOptions.numSubscriptions; i++) {
      console.log(`Subscribing to topic ${this.basicConfigOptions.topicName}, subscription number: ${i}`);
      this.subscriptionResponse = await this.subscribeToTopic();
    }

    console.log('starting to simulate publish requests');

    const publishResponses: Promise<string | TopicPublish.Response | undefined>[] = [];

    const interval = 1000 / this.browserConfigOptions.publishRatePerSecond;
    let requestNum = 1;

    while (requestNum <= 100) {
      // const currentTimestamp = Date.now();
      const currentTimestamp = process.hrtime();
      const message = `${currentTimestamp[0]} ${currentTimestamp[1]}: Simulated message ${requestNum}`;

      const response = this.publishToTopic(this.topicClient, message);
      publishResponses.push(response);

      await delay(interval);

      requestNum += 1;
    }

    await Promise.all(publishResponses);

    this.topicLoadGenContext.totalPublishRequests = publishHistogram.totalCount;
    this.topicLoadGenContext.totalSubscriptionRequests = this.browserConfigOptions.numSubscriptions;

    addToCSV(this.topicLoadGenContext.toString(), topicsContextCsv);

    console.log(publishHistogram);
    console.log(subscriptionHistogram);

    uploadFileToS3(publishCsv, bucketName, 'publish.csv')
      .then(() => {
        console.log(`Uploaded ${publishCsv} to S3`);
      })
      .catch(err => {
        console.error(`Error uploading ${publishCsv} to S3:`, err);
      });

    uploadFileToS3(publishReceiveCsv, bucketName, 'publish-and-receive.csv')
      .then(() => {
        console.log(`Uploaded ${publishReceiveCsv} to S3`);
      })
      .catch(err => {
        console.error(`Error uploading ${publishReceiveCsv} to S3:`, err);
      });

    uploadFileToS3(topicsContextCsv, bucketName, 'topics-context.csv')
      .then(() => {
        console.log(`Uploaded ${topicsContextCsv} to S3`);
      })
      .catch(err => {
        console.error(`Error uploading ${topicsContextCsv} to S3:`, err);
      });
  }

  async publishToTopic(topicClient: TopicClient, message: string) {
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
      } else if (response.errorCode().includes('LIMIT_EXCEEDED_ERROR')) {
        this.topicLoadGenContext.numPublishLimitExceeded += 1;
      } else if (response.errorCode().includes('TIMEOUT_ERROR')) {
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
      } else if (subscribeResponse.errorCode().includes('LIMIT_EXCEEDED_ERROR')) {
        this.topicLoadGenContext.numSubscriptionLimitExceeded += 1;
      } else if (subscribeResponse.errorCode().includes('TIMEOUT_ERROR')) {
        this.topicLoadGenContext.numSubscriptionTimeoutExceeded += 1;
      }
    }

    return subscribeResponse;
  }

  stopSimulating() {
    // Unsubscribe from the topic
    if (this.subscriptionResponse instanceof TopicSubscribe.Subscription) {
      this.subscriptionResponse.unsubscribe();
    }
  }
}

function handleItem(item: TopicItem) {
  console.log('Item received from topic subscription; %s', item);

  const timestamps = item.valueString().split(':')[0].split(' ');
  const startTimeSec = parseInt(timestamps[0], 10);
  const startTimeNanosec = parseInt(timestamps[1], 10);
  const endTime = process.hrtime([startTimeSec, startTimeNanosec]);
  const elapsedTime = endTime[0] * 1000 + endTime[1] / 1000000; // Convert to milliseconds
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

async function uploadFileToS3(filePath: string, bucketName: string, key: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
  const s3: S3Client = new S3Client({region: 'us-west-2'});
  const fileContent = fs.readFileSync(filePath);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileContent,
  });

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    await s3.send(command);
    console.log('File uploaded to s3');
  } catch (err) {
    console.error(err);
  }
}

// export BROWSER_CONFIG='{"numberOfBrowserInstances": 1, "publishRatePerSecond": 10}'
const browserConfigEnv = process.env.BROWSER_CONFIG;
if (!browserConfigEnv) {
  throw new Error('Missing environment variable(s). Please set BROWSER_CONFIG.');
}
let browserConfig: BrowserConfigOptions;
try {
  browserConfig = JSON.parse(browserConfigEnv) as BrowserConfigOptions;
} catch (error) {
  throw new Error('Error parsing JSON configuration');
}

const basicConfig: BasicConfigOptions = {
  cacheName: 'topicLoadTestCache',
  topicName: 'topicLoadTestTopic',
};

const browserInstances: Browser[] = [];

for (let i = 0; i < browserConfig.numberOfBrowserInstances; i++) {
  const browser = new Browser(browserConfig, basicConfig);
  browserInstances.push(browser);
  browser
    .startSimulating()
    .then(() => {
      console.log('success!!');
    })
    .catch((e: Error) => {
      console.error(`Uncaught exception while running topics-loadgen: ${e.message}`);
      throw e;
    });
}

setTimeout(() => {
  // Stop all browser instances
  for (const browser of browserInstances) {
    browser.stopSimulating();
  }

  console.log('Program execution completed.');
  // eslint-disable-next-line no-process-exit
  process.exit(0);
}, 60000);
