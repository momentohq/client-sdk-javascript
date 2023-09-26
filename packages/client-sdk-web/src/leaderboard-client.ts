import {AbstractLeaderboardClient} from '@gomomento/sdk-core/dist/src/internal/clients/leaderboard/AbstractLeaderboardClient';
import {LeaderboardDataClient} from './internal/leaderboard-client';
import {LeaderboardClientProps} from './leaderboard-client-props';
import {ILeaderboardClient} from '@gomomento/sdk-core/dist/src/clients/ILeaderboardClient';
import {InternalLeaderboardClient} from '@gomomento/sdk-core/dist/src/internal/clients';

/**
 * Momento Leaderboard Client.
 */
export class LeaderboardClient
  extends AbstractLeaderboardClient
  implements ILeaderboardClient
{
  /**
   * Creates an instance of LeaderboardClient.
   */
  constructor(props: LeaderboardClientProps) {
    const client: InternalLeaderboardClient = createLeaderboardClient(props);
    super(client);
  }
}

function createLeaderboardClient(
  props: LeaderboardClientProps
): InternalLeaderboardClient {
  return new LeaderboardDataClient({
    configuration: props.configuration,
    credentialProvider: props.credentialProvider,
  });
}
