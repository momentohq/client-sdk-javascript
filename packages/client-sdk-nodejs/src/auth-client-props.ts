import {Configuration} from './config/configuration';

export interface AuthClientProps {
  /**
   * Configuration settings for the auth client
   */
  configuration: Configuration;
}

export type SimpleAuthClientProps = AuthClientProps;
