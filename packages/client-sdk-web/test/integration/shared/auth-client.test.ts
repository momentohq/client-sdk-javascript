import {runAuthClientTests} from '@gomomento/common-integration-tests';
import {SetupAuthClientIntegrationTest} from '../integration-setup';

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
