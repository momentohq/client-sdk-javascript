import {runReplicaReadTests} from '@gomomento/common-integration-tests';
import {SetupIntegrationTest} from '../../integration-setup';

const {cacheClientWithBalancedReadConcern, integrationTestCacheName} =
  SetupIntegrationTest();

runReplicaReadTests(
  cacheClientWithBalancedReadConcern,
  integrationTestCacheName
);
