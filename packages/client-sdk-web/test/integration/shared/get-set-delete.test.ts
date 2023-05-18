import {runGetSetDeleteTests} from '@gomomento/common-integration-tests';
import {
  momentoClientForTestingWithDeadline,
  SetupIntegrationTest,
} from '../integration-setup';

const {Momento, IntegrationTestCacheName} = SetupIntegrationTest();
const MomentoShortDeadline = momentoClientForTestingWithDeadline(1);

runGetSetDeleteTests(Momento, MomentoShortDeadline, IntegrationTestCacheName);
