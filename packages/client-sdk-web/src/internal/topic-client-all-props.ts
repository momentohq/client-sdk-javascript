import {TopicClientProps} from '../topic-client-props';
import {TopicConfiguration} from '../config/topic-configuration';
import {CredentialProvider} from '@gomomento/sdk-core';

export interface TopicClientAllProps extends TopicClientProps {
  configuration: TopicConfiguration;
  credentialProvider: CredentialProvider;
}
