import {runUpdateTtlTest} from '@gomomento/common-integration-tests';
import {SetupIntegrationTest} from '../integration-setup';

const {cacheClient, integrationTestCacheName} = SetupIntegrationTest();

runUpdateTtlTest(cacheClient, integrationTestCacheName);
