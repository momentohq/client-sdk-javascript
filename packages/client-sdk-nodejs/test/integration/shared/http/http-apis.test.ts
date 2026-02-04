import {SetupIntegrationTest} from '../../integration-setup';
import {runHttpApiTest} from '@gomomento/common-integration-tests/dist/src/http/http-apis';

const {
  credentialProvider,
  credentialProviderApiKeyV2,
  integrationTestCacheName,
} = SetupIntegrationTest();

runHttpApiTest(credentialProvider, integrationTestCacheName);
runHttpApiTest(credentialProviderApiKeyV2, integrationTestCacheName);
