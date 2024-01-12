import {TopicClientProps} from '../topic-client-props';
import {TopicConfiguration} from '../config/topic-configuration';

export interface TopicClientPropsWithConfiguration extends TopicClientProps {
  configuration: TopicConfiguration;
}
