import {TopicClient, TopicItem, TopicPublish, TopicSubscribe} from '@gomomento/sdk-web';
import {ensureCacheExists} from './utils/cache';
import {delay, getTopicClient} from './utils/topics';
import * as hdr from 'hdr-histogram-js';

import {TopicsLoadGenConfigOptions, TopicsLoadGenConfigOptionsImpl, TopicsLoadGenContextImpl} from './utils/config';
import * as fs from 'fs';
import {PutObjectCommand, S3Client} from '@aws-sdk/client-s3';
import {initJSDom} from './utils/jsdom';
import {v4} from 'uuid';
import {clearInterval} from 'timers';
import path from 'path';

const publishHistogram = hdr.build();
const subscriptionHistogram = hdr.build();
const publishCsv = 'publish';
const publishReceiveCsv = 'publish-and-receive';
const topicsContextCsv = 'topics-context';
const topicsLoadgenConfigCsv = 'topics-loadgen-config';
const bucketName = 'topics-loadgen-test-bucket';
const cacheName = 'momento-topics-loadgen';

export class Browser {
  private topicsLoadGenConfigOptions: TopicsLoadGenConfigOptions;
  private readonly topicClient: TopicClient;

  private subscriptionResponse: TopicSubscribe.Response;

  private topicLoadGenContext: TopicsLoadGenContextImpl;

  private readonly topicName: string;
  private readonly numMessagesToPublish: number;
  private readonly runId: string;

  constructor(
    topicsLoadGenConfigOptions: TopicsLoadGenConfigOptions,
    runId: string,
    numMessagesToPublish: number,
    topics: string[]
  ) {
    this.topicsLoadGenConfigOptions = topicsLoadGenConfigOptions;
    this.topicClient = getTopicClient();

    this.topicName = topics[Math.floor(Math.random() * topics.length)];
    this.numMessagesToPublish = numMessagesToPublish;
    this.runId = runId;

    this.topicLoadGenContext = TopicsLoadGenContextImpl.initiateTopicsLoadGenContext();
  }

  async startSimulating(runId: string, fargateId: string, browserNum: number): Promise<void> {
    await ensureCacheExists(cacheName);

    // Subscribe to the topic to receive published values
    this.subscriptionResponse = await this.subscribeToTopic();

    // create payload of `messageSizeInKb`
    const desiredSizeInBytes = this.topicsLoadGenConfigOptions.messageSizeInKb * 1024;
    const character = 'a';

    const characterArray: string[] = [];
    while (characterArray.join('').length < desiredSizeInBytes) {
      characterArray.push(character);
    }

    const interval = 1000 / this.topicsLoadGenConfigOptions.publishRatePerSecondPerBrowser;

    let messagePublishCount = 0;
    while (messagePublishCount < this.numMessagesToPublish) {
      const currentTimestamp = process.hrtime();
      const message = `${currentTimestamp[0]} ${currentTimestamp[1]}:${browserNum}: ${characterArray.join('')}`;

      await this.publishToTopic(this.topicClient, message, browserNum);

      await delay(interval);
      messagePublishCount++;
    }

    addToCSV('', this.topicLoadGenContext.toString(), runId, `${topicsContextCsv}-${browserNum}.csv`);

    uploadFiles(runId, fargateId, browserNum);
  }

  async publishToTopic(topicClient: TopicClient, message: string, browserNum: number) {
    this.topicLoadGenContext.totalPublishRequests += 1;

    const startTime = process.hrtime();

    const response = await topicClient.publish(cacheName, this.topicName, message);

    const endTime = process.hrtime(startTime);
    const elapsedTime = endTime[0] * 1000 + endTime[1] / 1000000; // Convert to milliseconds

    publishHistogram.recordValue(elapsedTime);
    addToCSV(getTimestamp(endTime), elapsedTime.toString(), this.runId, `${publishCsv}-${browserNum}.csv`);

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
    const subscribeResponse = await this.topicClient.subscribe(cacheName, this.topicName, {
      onError: e => this.handleError(e),
      onItem: item => this.handleItem(item),
    });

    this.topicLoadGenContext.totalSubscriptionRequests += 1;
    if (subscribeResponse instanceof TopicSubscribe.Subscription) {
      console.log(`Subscriped to topic ${this.topicName}`);
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

  async stopSimulating(browserNum: number): Promise<void> {
    console.log(`Browser ${browserNum} sleeping for 5 seconds to allow remaining messages to flush`);
    await delay(5000);
    // Unsubscribe from the topic
    if (this.subscriptionResponse instanceof TopicSubscribe.Subscription) {
      this.subscriptionResponse.unsubscribe();
    }
  }

  handleItem(item: TopicItem) {
    this.topicLoadGenContext.numMessagesReceived++;

    const splitItems = item.valueString().split(':');
    const browserNum = splitItems[1].trim();
    const [startTimeSec, startTimeNanosec] = splitItems[0].split(' ');
    const endTime = process.hrtime([parseInt(startTimeSec), parseInt(startTimeNanosec)]);
    const elapsedTime = endTime[0] * 1000 + endTime[1] / 1000000; // Convert to milliseconds
    subscriptionHistogram.recordValue(elapsedTime);
    addToCSV(getTimestamp(endTime), elapsedTime.toString(), this.runId, `${publishReceiveCsv}-${browserNum}.csv`);
  }

  handleError(error: TopicSubscribe.Error) {
    console.log(`Error received from topic subscription; ${error.toString()}`);
  }
}

function uploadFiles(runId: string, fargateContainerId: string, browserNum: number) {
  const runDataDir = path.join('data', runId);
  uploadFileToS3(
    path.join(runDataDir, `${publishCsv}-${browserNum}.csv`),
    bucketName,
    `${runId}/${fargateContainerId}-${publishCsv}-${browserNum}.csv`
  )
    .then(() => {
      console.log(`Uploaded ${publishCsv}-${browserNum}.csv to S3`);
    })
    .catch(err => {
      console.error(`Error uploading ${publishCsv}-${browserNum}.csv to S3:`, err);
    });

  uploadFileToS3(
    path.join(runDataDir, `${publishReceiveCsv}-${browserNum}.csv`),
    bucketName,
    `${runId}/${fargateContainerId}-${publishReceiveCsv}-${browserNum}.csv`
  )
    .then(() => {
      console.log(`Uploaded ${publishReceiveCsv}-${browserNum}.csv to S3`);
    })
    .catch(err => {
      console.error(`Error uploading ${publishReceiveCsv}-${browserNum}.csv to S3:`, err);
    });

  uploadFileToS3(
    path.join(runDataDir, `${topicsContextCsv}-${browserNum}.csv`),
    bucketName,
    `${runId}/${fargateContainerId}-${topicsContextCsv}-${browserNum}.csv`
  )
    .then(() => {
      console.log(`Uploaded ${topicsContextCsv}-${browserNum}.csv to S3`);
    })
    .catch(err => {
      console.error(`Error uploading ${topicsContextCsv}-${browserNum}.csv to S3:`, err);
    });
}

function addToCSV(timestamp: string, data: string, runId: string, filePath: string): void {
  const filePathInDataDir = path.join('data', runId, filePath);
  try {
    const line = timestamp !== '' ? timestamp + ',' + data : data;

    if (timestamp !== '' && !fs.existsSync(filePathInDataDir)) {
      const headers = 'Timestamp,ElapsedTime';
      fs.writeFileSync(filePathInDataDir, headers + '\n');
    }

    fs.writeFileSync(filePathInDataDir, line + '\n', {flag: 'a'});
  } catch (err) {
    console.error('Error appending to CSV file:', err);
  }
}

function getTimestamp(hrTime: [number, number]): string {
  const elapsedMillis = hrTime[0] * 1000 + hrTime[1] / 1000000;
  const currentTime = Date.now();
  return new Date(currentTime - elapsedMillis).getTime().toString();
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

async function main(): Promise<void> {
  initJSDom();

  const runId = process.env.LOADTEST_RUN_ID;
  if (runId === undefined) {
    throw new Error('Missing environment variable(s). Please set LOADTEST_RUN_ID.');
  }

  const runIdDataDir = path.join('data', runId);
  if (!fs.existsSync(runIdDataDir)) {
    fs.mkdirSync(runIdDataDir, {recursive: true});
  }

  const topicsLoadGenConfigEnv = process.env.TOPICS_LOADGEN_CONFIG;
  if (!topicsLoadGenConfigEnv) {
    throw new Error('Missing environment variable(s). Please set TOPICS_LOADGEN_CONFIG.');
  }
  let topicsLoadgenConfig: TopicsLoadGenConfigOptions;
  try {
    topicsLoadgenConfig = JSON.parse(topicsLoadGenConfigEnv) as TopicsLoadGenConfigOptions;
  } catch (error) {
    throw new Error('Error parsing JSON configuration');
  }

  const numRequestsToIssuePerBrowser =
    topicsLoadgenConfig.loadTestDurationInSeconds / topicsLoadgenConfig.publishRatePerSecondPerBrowser;

  const topicsLoadGenSimulationPromises = [];

  const fargateId: string = v4();

  const topics = Array.from({length: topicsLoadgenConfig.numberOfTopics}, (_, topicNum) => `topic-${topicNum}`);

  let logPeriod = 1;
  // log histogram stats every 30 sec
  const logHistograms = () => {
    console.log(`Publish Histogram (${logPeriod}):`);
    console.log(publishHistogram);
    console.log(`Subscription Histogram (${logPeriod}):`);
    console.log(subscriptionHistogram);
    console.log('');
    logPeriod++;
  };
  const logHistogramsInterval = setInterval(logHistograms, 20_000);

  for (let i = 0; i < topicsLoadgenConfig.numberOfBrowsers; i++) {
    const browser = new Browser(topicsLoadgenConfig, runId, numRequestsToIssuePerBrowser, topics);
    topicsLoadGenSimulationPromises.push(
      browser
        .startSimulating(runId, fargateId, i)
        .then(() => {
          console.log('success!!');
          return browser.stopSimulating(i);
        })
        .catch((e: Error) => {
          console.error(`Uncaught exception while running topics-loadgen: ${e.message}`);
          throw e;
        })
    );
  }
  await Promise.all(topicsLoadGenSimulationPromises);

  clearInterval(logHistogramsInterval);
  logHistograms();

  const loadGenConfig = new TopicsLoadGenConfigOptionsImpl(topicsLoadgenConfig);
  addToCSV('', loadGenConfig.toString(), runId, `${topicsLoadgenConfigCsv}.csv`);
  uploadFileToS3(
    path.join(path.join('data', runId), `${topicsLoadgenConfigCsv}.csv`),
    bucketName,
    `${runId}/${fargateId}-${topicsLoadgenConfigCsv}.csv`
  )
    .then(() => {
      console.log(`Uploaded ${topicsLoadgenConfigCsv}.csv to S3`);
    })
    .catch(err => {
      console.error(`Error uploading ${topicsLoadgenConfigCsv}.csv to S3:`, err);
    });
}

main().catch(e => {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  console.error(`Uncaught exception in main: ${e}`);
  throw e;
});
