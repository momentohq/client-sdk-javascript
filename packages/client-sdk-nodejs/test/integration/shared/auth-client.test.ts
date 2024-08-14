import {SetupAuthClientIntegrationTest} from '../integration-setup';
import {runAuthClientTests} from '@gomomento/common-integration-tests';

const {
  mgaAccountSessionTokenAuthClient,
  legacyTokenAuthClient,
  mgaAccountSessionTokenCacheClient,
  mgaAccountSessionTokenTopicClient,
  authTokenAuthClientFactory,
  cacheClientFactory,
  topicClientFactory,
  cacheName,
} = SetupAuthClientIntegrationTest();

runAuthClientTests(
  mgaAccountSessionTokenAuthClient,
  legacyTokenAuthClient,
  mgaAccountSessionTokenCacheClient,
  mgaAccountSessionTokenTopicClient,
  authTokenAuthClientFactory,
  cacheClientFactory,
  topicClientFactory,
  cacheName
);
