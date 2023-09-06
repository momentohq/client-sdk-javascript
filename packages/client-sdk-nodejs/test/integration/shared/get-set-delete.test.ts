import {runGetSetDeleteTests} from '@gomomento/common-integration-tests';
import {SetupIntegrationTest} from '../integration-setup';

const {cacheClient, integrationTestCacheName} = SetupIntegrationTest();

runGetSetDeleteTests(cacheClient, integrationTestCacheName);
