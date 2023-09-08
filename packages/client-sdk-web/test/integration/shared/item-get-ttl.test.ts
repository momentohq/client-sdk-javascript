import {SetupIntegrationTest} from '../integration-setup';
import {runItemGetTtlTest} from '@gomomento/common-integration-tests/dist/src/item-get-ttl';

const {cacheClient, integrationTestCacheName} = SetupIntegrationTest();

runItemGetTtlTest(cacheClient, integrationTestCacheName);
