import {runLeaderboardClientTests} from '@gomomento/common-integration-tests';
import {SetupLeaderboardIntegrationTest} from '../integration-setup';

const {leaderboardClient, integrationTestCacheName} =
  SetupLeaderboardIntegrationTest();

runLeaderboardClientTests(leaderboardClient, integrationTestCacheName);
