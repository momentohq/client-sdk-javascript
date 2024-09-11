import {runDictionaryTests} from '@gomomento/common-integration-tests';
import {SetupIntegrationTest} from '../../integration-setup';
import {DefaultMomentoLoggerFactory} from '../../../../src';

const {cacheClient, integrationTestCacheName} = SetupIntegrationTest();
const logger = new DefaultMomentoLoggerFactory().getLogger(
  'dictionary-integration-setup'
);

runDictionaryTests(cacheClient, integrationTestCacheName, logger);
