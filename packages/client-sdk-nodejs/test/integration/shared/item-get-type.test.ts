import {SetupIntegrationTest} from '../integration-setup';
import {runItemGetTypeTest} from '@gomomento/common-integration-tests';

const {Momento, IntegrationTestCacheName} = SetupIntegrationTest();

runItemGetTypeTest(Momento, IntegrationTestCacheName);
