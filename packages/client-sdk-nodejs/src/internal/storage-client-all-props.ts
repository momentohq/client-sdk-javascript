import {CredentialProvider} from '@gomomento/sdk-core';
import {StorageConfiguration} from '../config/storage-configuration';
import {StorageClientProps} from '../storage-client-props';

export interface StorageClientAllProps extends StorageClientProps {
  configuration: StorageConfiguration;
  credentialProvider: CredentialProvider;
}
