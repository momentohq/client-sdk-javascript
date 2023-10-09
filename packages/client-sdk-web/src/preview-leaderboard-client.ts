import {ILeaderboardDataClient} from '@gomomento/sdk-core/dist/src/internal/clients/leaderboard/ILeaderboardDataClient';
import {Leaderboard} from './internal/leaderboard';
import {LeaderboardDataClient} from './internal/leaderboard-data-client';
import {LeaderboardClientProps} from './leaderboard-client-props';
import {ILeaderboardClient, ILeaderboard} from '@gomomento/sdk-core';

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
  protected readonly props: LeaderboardClientProps;
  private dataClient: ILeaderboardDataClient;

  constructor(props: LeaderboardClientProps) {
    this.props = props;
    this.dataClient = new LeaderboardDataClient(this.props);
  }

  /**
   * Creates an instance of LeaderboardClient with 32-bit float scores.
   */
  public leaderboard(cacheName: string, leaderboardName: string): ILeaderboard {
    return new Leaderboard(this.dataClient, cacheName, leaderboardName);
  }
}
