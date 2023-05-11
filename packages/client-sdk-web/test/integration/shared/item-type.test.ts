import {SetupIntegrationTest} from '../integration-setup';
import {runItemTypeTest} from '@gomomento/common-integration-tests/dist/src/item-type';

const {Momento, IntegrationTestCacheName} = SetupIntegrationTest();

runItemTypeTest(Momento, IntegrationTestCacheName);
