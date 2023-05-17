import {runAuthClientTests} from '@gomomento/common-integration-tests';
import {SetupAuthClientIntegrationTest} from '../integration-setup';

const {sessionTokenAuthClient, authTokenAuthClientFactory} =
  SetupAuthClientIntegrationTest();

runAuthClientTests(sessionTokenAuthClient, authTokenAuthClientFactory);
