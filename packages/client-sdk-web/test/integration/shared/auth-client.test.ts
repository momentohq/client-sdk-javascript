import {runAuthClientTests} from '@gomomento/common-integration-tests';
import {SetupAuthClientIntegrationTest} from '../integration-setup';

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

// Not running for now, will fast follow once we figure out
// why the web SDK integration tests for disposable tokens
// are failing with "Insufficient permissions" errors
