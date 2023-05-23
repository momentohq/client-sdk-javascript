import {SetupAuthClientIntegrationTest} from '../integration-setup';
import {runAuthClientTests} from '@gomomento/common-integration-tests';

const {
  sessionTokenAuthClient,
  legacyTokenAuthClient,
  authTokenAuthClientFactory,
  cacheClientFactory,
  cacheName,
} = SetupAuthClientIntegrationTest();

runAuthClientTests(
  sessionTokenAuthClient,
  legacyTokenAuthClient,
  authTokenAuthClientFactory,
  cacheClientFactory,
  cacheName
);
