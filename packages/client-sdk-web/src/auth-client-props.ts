import {CredentialProvider} from '.';

export interface AuthClientProps {
  /**
   * controls how the client will get authentication information for connecting to the Momento service
   */
  credentialProvider: CredentialProvider;

  /**
   * Configures whether the client should return a Momento Error object or throw an exception when an
   * error occurs. By default, this is set to false, and the client will return a Momento Error object on errors. Set it
   * to true if you prefer for exceptions to be thrown.
   */
  throwOnErrors?: boolean;
}
