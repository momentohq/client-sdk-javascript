import {SetupAuthClientIntegrationTest} from '../integration-setup';
import {runAuthClientTests} from '@gomomento/common-integration-tests';

const {
  sessionTokenAuthClient,
  legacyTokenAuthClient,
  authTokenAuthClientFactory,
} = SetupAuthClientIntegrationTest();

runAuthClientTests(
  sessionTokenAuthClient,
  legacyTokenAuthClient,
  authTokenAuthClientFactory
);
