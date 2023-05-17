import {SetupAuthClientIntegrationTest} from '../integration-setup';
import {runAuthClientTests} from '@gomomento/common-integration-tests';

const {sessionTokenAuthClient, authTokenAuthClientFactory} =
  SetupAuthClientIntegrationTest();

runAuthClientTests(sessionTokenAuthClient, authTokenAuthClientFactory);
