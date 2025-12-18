import {runCacheTestWithApiKeyV2} from '@gomomento/common-integration-tests';
import {SetupIntegrationTest} from '../../integration-setup';

const {cacheClientApiKeyV2, integrationTestCacheName} = SetupIntegrationTest();

runCacheTestWithApiKeyV2(cacheClientApiKeyV2, integrationTestCacheName);
