import {CredentialProvider} from '.';
import {Configuration} from './config/configuration';

export interface AuthClientProps {
  /**
   * Configuration settings for the auth client
   */
  configuration: Configuration;
  /**
   * controls how the client will get authentication information for connecting to the Momento service
   */
  credentialProvider: CredentialProvider;
}

/**
 * @deprecated use {AuthClientProps} instead
 */
export type SimpleAuthClientProps = AuthClientProps;
