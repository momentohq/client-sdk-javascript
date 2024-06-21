import {CredentialProvider} from '.';
import {StorageConfiguration} from './config/storage-configuration';

export interface StorageClientProps {
  /**
   * Configuration settings for the storage client
   */
  configuration?: StorageConfiguration;
  /**
   * controls how the client will get authentication information for connecting to the Momento service
   */
  credentialProvider: CredentialProvider;
}
