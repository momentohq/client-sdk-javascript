import {MomentoLogger} from '@gomomento/sdk-core';
import {LeaderboardDataClient} from './internal/leaderboard-client';
import {LeaderboardClientProps} from './leaderboard-client-props';
import {ILeaderboardClient} from '@gomomento/sdk-core/dist/src/clients/ILeaderboardClient';
import {InternalLeaderboardClient} from '@gomomento/sdk-core/dist/src/internal/clients';

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
  protected readonly logger: MomentoLogger;
  protected readonly props: LeaderboardClientProps;

  constructor(props: LeaderboardClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.logger.debug('Creating Momento LeaderboardClient');
    this.props = props;
  }

  /**
   * Creates an instance of LeaderboardClient with 32-bit float scores.
   */
  public leaderboard(
    cacheName: string,
    leaderboardName: string
  ): InternalLeaderboardClient {
    return new LeaderboardDataClient(this.props, cacheName, leaderboardName);
  }
}
