import {
  runLeaderboardClientTests,
  runLeaderboardClientTestsWithApiKeyV2,
} from '@gomomento/common-integration-tests';
import {SetupLeaderboardIntegrationTest} from '../../integration-setup';

const {
  leaderboardClient,
  leaderboardClientApiKeyV2,
  leaderboardClientWithThrowOnErrors,
  integrationTestCacheName,
} = SetupLeaderboardIntegrationTest();

runLeaderboardClientTests(
  leaderboardClient,
  leaderboardClientWithThrowOnErrors,
  integrationTestCacheName
);

runLeaderboardClientTestsWithApiKeyV2(
  leaderboardClientApiKeyV2,
  integrationTestCacheName
);
