import {CredentialProvider} from '@gomomento/sdk-core';
import {StorageConfiguration} from './config/storage-configuration';

export interface StorageClientProps {
  credentialProvider: CredentialProvider;
  configuration?: StorageConfiguration;
}
