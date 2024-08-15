import {runDictionaryTests} from '@gomomento/common-integration-tests';
import {SetupIntegrationTest} from '../../integration-setup';

const {cacheClient, integrationTestCacheName} = SetupIntegrationTest();

runDictionaryTests(cacheClient, integrationTestCacheName);
