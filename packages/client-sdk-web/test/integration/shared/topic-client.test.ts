import {runTopicClientTests} from '@gomomento/common-integration-tests';
import {SetupTopicIntegrationTest} from '../integration-setup';

const {
  topicClient,
  topicClientWithThrowOnErrors,
  cacheClient,
  integrationTestCacheName,
} = SetupTopicIntegrationTest();
runTopicClientTests(
  topicClient,
  topicClientWithThrowOnErrors,
  cacheClient,
  integrationTestCacheName
);
