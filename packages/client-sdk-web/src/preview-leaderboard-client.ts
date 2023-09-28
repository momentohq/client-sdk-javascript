import {AbstractLeaderboardClient} from '@gomomento/sdk-core/dist/src/internal/clients/leaderboard/AbstractLeaderboardClient';
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
export class PreviewLeaderboardClient
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
