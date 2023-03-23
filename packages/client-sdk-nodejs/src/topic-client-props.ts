import {CredentialProvider} from './common/auth';
import {Configuration} from './config/configuration';

export interface TopicClientProps {
  /**
   * Configuration settings for the topic client
   */
  configuration: Configuration;
  /**
   * controls how the client will get authentication information for connecting to the Momento service
   */
  credentialProvider: CredentialProvider;
}
