import {SetupAuthClientIntegrationTest} from '../integration-setup';
import {runAuthClientTests} from '@gomomento/common-integration-tests';

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
