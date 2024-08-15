import {runLeaderboardClientTests} from '@gomomento/common-integration-tests';
import {SetupLeaderboardIntegrationTest} from '../../integration-setup';

const {
  leaderboardClient,
  leaderboardClientWithThrowOnErrors,
  integrationTestCacheName,
} = SetupLeaderboardIntegrationTest();

runLeaderboardClientTests(
  leaderboardClient,
  leaderboardClientWithThrowOnErrors,
  integrationTestCacheName
);
