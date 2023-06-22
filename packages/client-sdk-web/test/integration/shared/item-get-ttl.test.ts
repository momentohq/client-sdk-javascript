import {SetupIntegrationTest} from '../integration-setup';
import {runItemGetTtlTest} from '@gomomento/common-integration-tests/dist/src/item-get-ttl';

const {Momento, IntegrationTestCacheName} = SetupIntegrationTest();

runItemGetTtlTest(Momento, IntegrationTestCacheName);
