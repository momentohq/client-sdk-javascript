import {runWebhookTests} from '@gomomento/common-integration-tests';
import {SetupTopicIntegrationTest} from '../../integration-setup';

const {topicClient, cacheClient, integrationTestCacheName} =
  SetupTopicIntegrationTest();
runWebhookTests(topicClient, cacheClient, integrationTestCacheName);
