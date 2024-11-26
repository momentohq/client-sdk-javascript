import {SetupIntegrationTest} from '../../integration-setup';
import {runHttpApiTest} from '@gomomento/common-integration-tests/dist/src/http/http-apis';

const {credentialProvider, integrationTestCacheName} = SetupIntegrationTest();

runHttpApiTest(credentialProvider, integrationTestCacheName);
