import {runGetSetDeleteTests} from '@gomomento/common-integration-tests';
import {SetupIntegrationTest} from '../integration-setup';

const {cacheClient, cacheClientWithThrowOnErrors, integrationTestCacheName} =
  SetupIntegrationTest();

runGetSetDeleteTests(
  cacheClient,
  cacheClientWithThrowOnErrors,
  integrationTestCacheName
);
