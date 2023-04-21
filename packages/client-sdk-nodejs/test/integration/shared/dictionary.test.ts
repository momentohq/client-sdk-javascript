import {runDictionaryTests} from '@gomomento/common-integration-tests';
import {SetupIntegrationTest} from '../integration-setup';

const {Momento, IntegrationTestCacheName} = SetupIntegrationTest();

runDictionaryTests(Momento, IntegrationTestCacheName);
