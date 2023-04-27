import {runSortedSetTests} from '@gomomento/common-integration-tests';
import {SetupIntegrationTest} from '../integration-setup';

const {Momento, IntegrationTestCacheName} = SetupIntegrationTest();

runSortedSetTests(Momento, IntegrationTestCacheName);
