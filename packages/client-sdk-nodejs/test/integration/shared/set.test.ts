import {runSetTests} from '@gomomento/common-integration-tests';
import {SetupIntegrationTest} from '../integration-setup';

const {cacheClient, integrationTestCacheName} = SetupIntegrationTest();

runSetTests(cacheClient, integrationTestCacheName);
