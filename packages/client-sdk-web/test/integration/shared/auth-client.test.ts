import {runAuthClientTests} from '@gomomento/common-integration-tests';
import {SetupAuthClientIntegrationTest} from '../integration-setup';

const {
  sessionTokenAuthClient,
  legacyTokenAuthClient,
  sessionTokenCacheClient,
  sessionTokenTopicClient,
  authTokenAuthClientFactory,
  cacheClientFactory,
  topicClientFactory,
  cacheName,
} = SetupAuthClientIntegrationTest();

runAuthClientTests(
  sessionTokenAuthClient,
  legacyTokenAuthClient,
  sessionTokenCacheClient,
  sessionTokenTopicClient,
  authTokenAuthClientFactory,
  cacheClientFactory,
  topicClientFactory,
  cacheName
);
