import {CacheClientProps} from '../cache-client-props';
import {Configuration} from '../config/configuration';

export interface CacheClientPropsWithConfig extends CacheClientProps {
  configuration: Configuration;
}
