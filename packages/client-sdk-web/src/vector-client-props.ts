import {CredentialProvider, VectorConfiguration} from '.';

export interface VectorClientProps {
  /**
   * Configuration settings for the vector client
   */
  configuration: VectorConfiguration;
  /**
   * controls how the client will get authentication information for connecting to the Momento service
   */
  credentialProvider: CredentialProvider;
}
