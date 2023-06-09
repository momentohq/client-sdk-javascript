import {CredentialProvider} from '.';
import {TopicConfiguration} from './config/topic-configuration';

export interface TopicClientProps {
  /**
   * Configuration settings for the topic client
   */
  configuration: TopicConfiguration;
  /**
   * controls how the client will get authentication information for connecting to the Momento service
   */
  credentialProvider: CredentialProvider;
}
