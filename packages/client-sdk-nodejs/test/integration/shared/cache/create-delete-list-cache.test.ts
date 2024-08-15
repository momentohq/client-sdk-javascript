import {runCreateDeleteListCacheTests} from '@gomomento/common-integration-tests';
import {SetupIntegrationTest} from '../../integration-setup';

const {cacheClient} = SetupIntegrationTest();

runCreateDeleteListCacheTests(cacheClient);
