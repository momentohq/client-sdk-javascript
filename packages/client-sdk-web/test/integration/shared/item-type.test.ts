import {SetupIntegrationTest} from '../integration-setup';
import {runItemTypeTest} from '@gomomento/common-integration-tests';

const {Momento, IntegrationTestCacheName} = SetupIntegrationTest();

runItemTypeTest(Momento, IntegrationTestCacheName);
