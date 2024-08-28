import {CredentialProvider} from '@gomomento/sdk-core';
import {StorageClientProps} from '../storage-client-props';
import {StorageConfiguration} from '../config/storage-configuration';

export interface StorageClientAllProps extends StorageClientProps {
  configuration: StorageConfiguration;
  credentialProvider: CredentialProvider;
}
