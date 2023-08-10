import {CredentialProvider, Configuration} from '.';

export interface VectorClientProps {
  /**
   * Configuration settings for the cache client
   */
  configuration: Configuration;
  /**
   * controls how the client will get authentication information for connecting to the Momento service
   */
  credentialProvider: CredentialProvider;
}
