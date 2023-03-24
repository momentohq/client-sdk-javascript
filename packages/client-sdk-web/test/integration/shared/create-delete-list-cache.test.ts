import {runCreateDeleteListCacheTests} from '@gomomento/common-integration-tests/dist/create-delete-list-cache';
import {SetupIntegrationTest} from '../integration-setup';

const {Momento} = SetupIntegrationTest();

runCreateDeleteListCacheTests(Momento);
