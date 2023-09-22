import {Configuration, CredentialProvider} from '.';

export interface LeaderboardClientProps {
  /**
   * Configuration settings for the vector client
   */
  configuration: Configuration;
  /**
   * controls how the client will get authentication information for connecting to the Momento service
   */
  credentialProvider: CredentialProvider;
}
