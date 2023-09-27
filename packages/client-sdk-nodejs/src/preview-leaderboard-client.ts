import {MomentoLogger} from '@gomomento/sdk-core';
import {AbstractLeaderboardClient} from '@gomomento/sdk-core/dist/src/internal/clients/leaderboard/AbstractLeaderboardClient';
import {LeaderboardDataClient} from './internal/leaderboard-client';
import {LeaderboardClientProps} from './leaderboard-client-props';
import {ILeaderboardClient} from '@gomomento/sdk-core/dist/src/clients/ILeaderboardClient';

/**
 * PREVIEW Momento Leaderboard Client
 * WARNING: the API for this client is not yet stable and may change without notice.
 * Please contact Momento if you would like to try this preview.
 *
 * Leaderboard methods return a response object unique to each request.
 * The response object is resolved to a type-safe object of one of several
 * sub-types. See the documentation for each response type for details.
 */
export class PreviewLeaderboardClient
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
