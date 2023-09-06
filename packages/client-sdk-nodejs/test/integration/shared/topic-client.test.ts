import {runTopicClientTests} from '@gomomento/common-integration-tests';
import {SetupTopicIntegrationTest} from '../integration-setup';

const {topicClient, cacheClient, integrationTestCacheName} =
  SetupTopicIntegrationTest();
runTopicClientTests(topicClient, cacheClient, integrationTestCacheName);
