import {SetupIntegrationTest} from '../../integration-setup';
import {runItemGetTypeTest} from '@gomomento/common-integration-tests';

const {cacheClient, integrationTestCacheName} = SetupIntegrationTest();

runItemGetTypeTest(cacheClient, integrationTestCacheName);
