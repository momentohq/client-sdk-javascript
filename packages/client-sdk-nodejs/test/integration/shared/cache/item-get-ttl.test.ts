import {SetupIntegrationTest} from '../../integration-setup';
import {runItemGetTtlTest} from '@gomomento/common-integration-tests';

const {cacheClient, integrationTestCacheName} = SetupIntegrationTest();

runItemGetTtlTest(cacheClient, integrationTestCacheName);
