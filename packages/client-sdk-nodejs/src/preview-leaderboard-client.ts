import {
  MomentoLogger,
  ILeaderboardClient,
  ILeaderboard,
  getDefaultCredentialProvider,
} from '@gomomento/sdk-core';
import {LeaderboardDataClient} from './internal/leaderboard-data-client';
import {LeaderboardClientProps} from './leaderboard-client-props';
import {Leaderboard} from './internal/leaderboard';
import {ILeaderboardDataClient} from '@gomomento/sdk-core/dist/src/internal/clients/leaderboard/ILeaderboardDataClient';
import {LeaderboardConfiguration, LeaderboardConfigurations} from './index';
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
  protected readonly logger: MomentoLogger;
  private readonly dataClient: ILeaderboardDataClient;
  private readonly configuration: LeaderboardConfiguration;

  constructor(props: LeaderboardClientProps) {
    const configuration =
      props.configuration ?? getDefaultLeaderboardConfiguration();
    const allProps: LeaderboardClientAllProps = {
      configuration: configuration,
      credentialProvider:
        props.credentialProvider ?? getDefaultCredentialProvider(),
    };
    this.configuration = configuration;

    this.logger = configuration.getLoggerFactory().getLogger(this);
    this.logger.debug('Creating Momento LeaderboardClient');
    this.dataClient = new LeaderboardDataClient(allProps, '0'); // only creating one leaderboard client

    // Initialize middlewares that have init methods. These currently start
    // background tasks for logging that will execute until they are explicitly
    // stopped. This is usually handled by the client's close method, but if
    // there is ever a chance that this client constructor may fail after these
    // methods are called, it is up to you to catch the exception and call close
    // on each of these manually.
    this.configuration.getMiddlewares().forEach(m => {
      if (m.init) {
        m.init();
      }
    });
  }

  public close() {
    this.dataClient.close();
    this.configuration.getMiddlewares().forEach(m => {
      if (m.close) {
        m.close();
      }
    });
  }

  /**
   * Creates an instance of LeaderboardClient with floating point scores up until 53 bits of precision.
   */
  public leaderboard(cacheName: string, leaderboardName: string): ILeaderboard {
    return new Leaderboard(this.dataClient, cacheName, leaderboardName);
  }
}

function getDefaultLeaderboardConfiguration(): LeaderboardConfiguration {
  return LeaderboardConfigurations.Laptop.latest();
}
