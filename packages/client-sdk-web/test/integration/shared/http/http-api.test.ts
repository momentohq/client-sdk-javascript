import {SetupIntegrationTest} from '../../integration-setup';
import {runHttpApiTest} from '@gomomento/common-integration-tests/dist/src/http/http-apis';

const {credentialProvider, credentialProviderV2, integrationTestCacheName} =
  SetupIntegrationTest();

runHttpApiTest(credentialProvider, integrationTestCacheName);
runHttpApiTest(credentialProviderV2, integrationTestCacheName);
