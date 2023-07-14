import {runUpdateTtlTest} from '@gomomento/common-integration-tests';
import {SetupIntegrationTest} from '../integration-setup';

const {Momento, IntegrationTestCacheName} = SetupIntegrationTest();

runUpdateTtlTest(Momento, IntegrationTestCacheName);
