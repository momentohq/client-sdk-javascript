import {SetupAuthClientIntegrationTest} from '../../integration-setup';
import {runHttpApiTest} from '@gomomento/common-integration-tests/dist/src/http/http-apis';

const {mgaAccountSessionTokenAuthClient, cacheName} =
  SetupAuthClientIntegrationTest();

runHttpApiTest(mgaAccountSessionTokenAuthClient, cacheName);
