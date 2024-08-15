import {runKeysExistTest} from '@gomomento/common-integration-tests';
import {SetupIntegrationTest} from '../../integration-setup';

const {cacheClient, integrationTestCacheName} = SetupIntegrationTest();

runKeysExistTest(cacheClient, integrationTestCacheName);
