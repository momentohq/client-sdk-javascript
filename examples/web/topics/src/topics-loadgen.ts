import {TopicClient, TopicItem, TopicPublish, TopicSubscribe} from '@gomomento/sdk-web';
import {ensureCacheExists} from './utils/cache';
import {delay, getTopicClient} from './utils/topics';
import * as hdr from 'hdr-histogram-js';

import {BrowserConfigOptions, TopicsLoadGenContextImpl} from './utils/config';
import * as fs from 'fs';
import {PutObjectCommand, S3Client} from '@aws-sdk/client-s3';
import {initJSDom} from './utils/jsdom';

const publishHistogram = hdr.build();
const subscriptionHistogram = hdr.build();
const publishCsv = 'publish';
const publishReceiveCsv = 'publish-and-receive';
const topicsContextCsv = 'topics-context';
const bucketName = 'topics-loadgen-test-bucket';
const cacheName = 'momento-topics-loadgen';
const topics = Array.from({length: 5}, (_, topicNum) => `topic-${topicNum}`);

export class Browser {
  private browserConfigOptions: BrowserConfigOptions;
  private readonly topicClient: TopicClient;

  private subscriptionResponse: TopicSubscribe.Response;

  private topicLoadGenContext: TopicsLoadGenContextImpl;

  private readonly topicName: string;

  constructor(browserConfigOptions: BrowserConfigOptions) {
    this.browserConfigOptions = browserConfigOptions;
    this.topicClient = getTopicClient();

    this.topicName = topics[Math.floor(Math.random() * topics.length)];

    this.topicLoadGenContext = TopicsLoadGenContextImpl.initiateTopicsLoadGenContext();
  }

  async startSimulating(browserNum: number): Promise<void> {
    const programStartTimeInMilliseconds = Date.now();
    initJSDom();
    await ensureCacheExists(cacheName);

    deleteCsvIfExists(`${publishCsv}-${browserNum}`);
    deleteCsvIfExists(`${publishReceiveCsv}-${browserNum}.csv`);
    deleteCsvIfExists(`${topicsContextCsv}-${browserNum}.csv`);

    // Subscribe to the topic to receive published values
    this.subscriptionResponse = await this.subscribeToTopic();

    console.log('Starting to simulate publish requests');

    // create payload of `messageSizeInKb`
    const desiredSizeInBytes = this.browserConfigOptions.messageSizeInKb * 1024;
    const character = 'a';

    const characterArray: string[] = [];
    while (characterArray.join('').length < desiredSizeInBytes) {
      characterArray.push(character);
    }

    // log histogram stats every 30 sec
    const logHistograms = () => {
      console.log('Publish Histogram:');
      console.log(publishHistogram);
      console.log('Subscription Histogram:');
      console.log(subscriptionHistogram);
    };
    setInterval(logHistograms, 30000);

    const interval = 1000 / this.browserConfigOptions.publishRatePerSecondPerBrowser;

    const loadTestDurationInSeconds = this.browserConfigOptions.loadTestDurationInSeconds;
    const endTime = programStartTimeInMilliseconds + loadTestDurationInSeconds * 1000;

    while (Date.now() <= endTime) {
      const currentTimestamp = process.hrtime();
      const message = `${currentTimestamp[0]} ${currentTimestamp[1]}: ${browserNum}: ${characterArray.join('')}`;

      await this.publishToTopic(this.topicClient, message, browserNum);

      await delay(interval);
    }

    addToCSV('', this.topicLoadGenContext.toString(), `${topicsContextCsv}-${browserNum}.csv`);

    uploadFiles(browserNum);
  }

  async publishToTopic(topicClient: TopicClient, message: string, browserNum: number) {
    console.log(`Beginning to publish ${message} to topic ${this.topicName}`);
    this.topicLoadGenContext.totalPublishRequests += 1;

    const startTime = process.hrtime();

    const response = await topicClient.publish(cacheName, this.topicName, message);

    const endTime = process.hrtime(startTime);
    const elapsedTime = endTime[0] * 1000 + endTime[1] / 1000000; // Convert to milliseconds

    publishHistogram.recordValue(elapsedTime);
    addToCSV(getTimestamp(endTime), elapsedTime.toString(), `${publishCsv}-${browserNum}.csv`);

    if (response instanceof TopicPublish.Success) {
      this.topicLoadGenContext.numPublishSuccess += 1;
    } else if (response instanceof TopicPublish.Error) {
      console.log(`Error publishing ${message} to topic ${this.topicName}, ${response.errorCode()}`);
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
    console.log(`Subscribing to topic ${this.topicName} in cache ${cacheName}`);
    const subscribeResponse = await this.topicClient.subscribe(cacheName, this.topicName, {
      onError: handleError,
      onItem: handleItem,
    });

    this.topicLoadGenContext.totalSubscriptionRequests += 1;
    if (subscribeResponse instanceof TopicSubscribe.Subscription) {
      console.log(`Successfully subscribed to topic ${this.topicName}`);

      // Wait for published values to be received.
      setTimeout(() => {
        console.log('Waiting for the published values');
      }, 120000);
    } else if (subscribeResponse instanceof TopicSubscribe.Error) {
      console.log(`Error subscribing to topic ${this.topicName}`);
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

function uploadFiles(browserNum: number) {
  uploadFileToS3(publishCsv, bucketName, `${publishCsv}-${browserNum}.csv`)
    .then(() => {
      console.log(`Uploaded ${publishCsv}-${browserNum}.csv to S3`);
    })
    .catch(err => {
      console.error(`Error uploading ${publishCsv}-${browserNum}.csv to S3:`, err);
    });

  uploadFileToS3(publishReceiveCsv, bucketName, `${publishReceiveCsv}-${browserNum}.csv`)
    .then(() => {
      console.log(`Uploaded ${publishReceiveCsv}-${browserNum}.csv to S3`);
    })
    .catch(err => {
      console.error(`Error uploading ${publishReceiveCsv}-${browserNum}.csv to S3:`, err);
    });

  uploadFileToS3(topicsContextCsv, bucketName, `${topicsContextCsv}-${browserNum}.csv`)
    .then(() => {
      console.log(`Uploaded ${topicsContextCsv}-${browserNum}.csv to S3`);
    })
    .catch(err => {
      console.error(`Error uploading ${topicsContextCsv}-${browserNum}.csv to S3:`, err);
    });
}

function handleItem(item: TopicItem) {
  console.log('Item received from topic subscription; %s', item);

  const splitItems = item.valueString().split(':');
  const browserNum = splitItems[1];
  const [startTimeSec, startTimeNanosec] = splitItems[0].split(' ');
  const endTime = process.hrtime([parseInt(startTimeSec), parseInt(startTimeNanosec)]);
  const elapsedTime = endTime[0] * 1000 + endTime[1] / 1000000; // Convert to milliseconds
  subscriptionHistogram.recordValue(elapsedTime);
  addToCSV(getTimestamp(endTime), elapsedTime.toString(), `${publishReceiveCsv}-${browserNum}.csv`);
}

function handleError(error: TopicSubscribe.Error) {
  console.log(`Error received from topic subscription; ${error.toString()}`);
}

function addToCSV(timestamp: string, data: string, filePath: string): void {
  try {
    const line = timestamp !== '' ? timestamp + '\t' + data : data;

    if (timestamp !== '' && !fs.existsSync(filePath)) {
      const headers = 'Timestamp\tElapsedTime';
      fs.writeFileSync(filePath, headers + '\n');
    }

    fs.writeFileSync(filePath, line + '\n', {flag: 'a'});
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

function getTimestamp(hrTime: [number, number]) {
  const elapsedMillis = hrTime[0] * 1000 + hrTime[1] / 1000000;
  const currentTime = Date.now();
  return new Date(currentTime - elapsedMillis).toUTCString();
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

const browserInstances: Browser[] = [];

for (let i = 0; i < browserConfig.numberOfBrowsers; i++) {
  const browser = new Browser(browserConfig);
  browserInstances.push(browser);
  browser
    .startSimulating(i)
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
