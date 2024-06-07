import {StorageConfiguration} from '../config/storage-configuration';
import {StorageClientProps} from '../storage-client-props';

export interface StorageClientPropsWithConfig extends StorageClientProps {
  configuration: StorageConfiguration;
}
