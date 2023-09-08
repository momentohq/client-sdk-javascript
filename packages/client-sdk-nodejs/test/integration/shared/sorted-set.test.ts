import {runSortedSetTests} from '@gomomento/common-integration-tests';
import {SetupIntegrationTest} from '../integration-setup';

const {cacheClient, integrationTestCacheName} = SetupIntegrationTest();

runSortedSetTests(cacheClient, integrationTestCacheName);
