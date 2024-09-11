import {runSortedSetTests} from '@gomomento/common-integration-tests';
import {SetupIntegrationTest} from '../../integration-setup';
import {DefaultMomentoLoggerFactory} from '../../../../src';

const {cacheClient, integrationTestCacheName} = SetupIntegrationTest();
const logger = new DefaultMomentoLoggerFactory().getLogger(
  'sorted-set-integration-setup'
);
runSortedSetTests(cacheClient, integrationTestCacheName, logger);
