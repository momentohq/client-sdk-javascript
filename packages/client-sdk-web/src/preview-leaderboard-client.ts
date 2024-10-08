import {ILeaderboardDataClient} from '@gomomento/sdk-core/dist/src/internal/clients/leaderboard/ILeaderboardDataClient';
import {Leaderboard} from './internal/leaderboard';
import {LeaderboardDataClient} from './internal/leaderboard-data-client';
import {LeaderboardClientProps} from './leaderboard-client-props';
import {
  ILeaderboardClient,
  ILeaderboard,
  getDefaultCredentialProvider,
} from '@gomomento/sdk-core';
import {LeaderboardConfiguration} from './config/leaderboard-configuration';
import {LeaderboardConfigurations} from './index';
import {LeaderboardClientAllProps} from './internal/leaderboard-client-all-props';

/**
 * PREVIEW Momento Leaderboard Client
 * WARNING: the API for this client is not yet stable and may change without notice.
 * Please contact Momento if you would like to try this preview.
 *
 * Leaderboard methods return a response object unique to each request.
 * The response object is resolved to a type-safe object of one of several
 * sub-types. See the documentation for each response type for details.
 */
export class PreviewLeaderboardClient implements ILeaderboardClient {
  private dataClient: ILeaderboardDataClient;

  constructor(props?: LeaderboardClientProps) {
    const allProps: LeaderboardClientAllProps = {
      configuration:
        props?.configuration ?? getDefaultLeaderboardConfiguration(),
      credentialProvider:
        props?.credentialProvider ?? getDefaultCredentialProvider(),
    };
    this.dataClient = new LeaderboardDataClient(allProps);
  }

  close() {
    this.dataClient.close();
  }

  /**
   * Creates an instance of LeaderboardClient with 32-bit float scores.
   */
  public leaderboard(cacheName: string, leaderboardName: string): ILeaderboard {
    return new Leaderboard(this.dataClient, cacheName, leaderboardName);
  }
}

function getDefaultLeaderboardConfiguration(): LeaderboardConfiguration {
  const config = LeaderboardConfigurations.Laptop.latest();
  const logger = config.getLoggerFactory().getLogger('LeaderboardClient');
  logger.info(
    'No configuration provided to LeaderboardClient. Using default "Laptop" configuration, suitable for development. For production use, consider specifying an explicit configuration.'
  );
  return config;
}
