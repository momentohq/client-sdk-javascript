import {CredentialProvider} from '.';

export interface AuthClientProps {
  /**
   * controls how the client will get authentication information for connecting to the Momento service
   */
  credentialProvider: CredentialProvider;
}
