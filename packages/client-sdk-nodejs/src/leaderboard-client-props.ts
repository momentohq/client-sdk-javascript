import {CredentialProvider, LeaderboardConfiguration} from '.';

export interface LeaderboardClientProps {
  /**
   * Configuration settings for the leaderboard client
   */
  configuration?: LeaderboardConfiguration;
  /**
   * controls how the client will get authentication information for connecting to the Momento service
   */
  credentialProvider?: CredentialProvider;
}
