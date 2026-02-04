import {
  runTopicClientTests,
  runTopicClientTestsWithApiKeyV2,
} from '@gomomento/common-integration-tests';
import {SetupTopicIntegrationTest} from '../../integration-setup';

const {
  topicClient,
  topicClientApiKeyV2,
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

runTopicClientTestsWithApiKeyV2(topicClientApiKeyV2, integrationTestCacheName);
