import {runGetSetDeleteTests} from '@gomomento/common-integration-tests';
import {SetupIntegrationTest} from '../../integration-setup';

const {
  cacheClient,
  cacheClientWithThrowOnErrors,
  cacheClientWithBalancedReadConcern,
  cacheClientWithConsistentReadConcern,
  integrationTestCacheName,
} = SetupIntegrationTest();

runGetSetDeleteTests(
  cacheClient,
  cacheClientWithThrowOnErrors,
  cacheClientWithBalancedReadConcern,
  cacheClientWithConsistentReadConcern,
  integrationTestCacheName
);
