import {runKeysExistTest} from '@gomomento/common-integration-tests';
import {SetupIntegrationTest} from '../integration-setup';

const {Momento, IntegrationTestCacheName} = SetupIntegrationTest();

runKeysExistTest(Momento, IntegrationTestCacheName);
