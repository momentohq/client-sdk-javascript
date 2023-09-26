import {MomentoLogger} from '@gomomento/sdk-core';
import {AbstractLeaderboardClient} from '@gomomento/sdk-core/dist/src/internal/clients/leaderboard/AbstractLeaderboardClient';
import {LeaderboardDataClient} from './internal/leaderboard-client';
import {LeaderboardClientProps} from './leaderboard-client-props';
import {ILeaderboardClient} from '@gomomento/sdk-core/dist/src/clients/ILeaderboardClient';

/**
 * Momento Leaderboard Client.
 */
export class LeaderboardClient
  extends AbstractLeaderboardClient
  implements ILeaderboardClient
{
  protected readonly logger: MomentoLogger;
  protected readonly client: LeaderboardDataClient;

  /**
   * Creates an instance of LeaderboardClient.
   */
  constructor(props: LeaderboardClientProps) {
    const client = new LeaderboardDataClient(props);
    super(client);
    this.client = client;
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.logger.debug('Creating Momento LeaderboardClient');
  }
}
