import {runBatchGetSetTests} from '@gomomento/common-integration-tests';
import {SetupIntegrationTest} from '../../integration-setup';

const {cacheClient, cacheClientWithThrowOnErrors, integrationTestCacheName} =
  SetupIntegrationTest();

runBatchGetSetTests(
  cacheClient,
  cacheClientWithThrowOnErrors,
  integrationTestCacheName
);
