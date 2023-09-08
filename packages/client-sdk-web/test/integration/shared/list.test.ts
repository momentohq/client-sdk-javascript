import {runListTests} from '@gomomento/common-integration-tests';
import {SetupIntegrationTest} from '../integration-setup';

const {cacheClient, integrationTestCacheName} = SetupIntegrationTest();

runListTests(cacheClient, integrationTestCacheName);
