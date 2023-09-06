import {CredentialProvider, VectorIndexConfiguration} from '.';

export interface VectorIndexClientProps {
  /**
   * Configuration settings for the vector client
   */
  configuration: VectorIndexConfiguration;
  /**
   * controls how the client will get authentication information for connecting to the Momento service
   */
  credentialProvider: CredentialProvider;
}
