/* eslint-disable @typescript-eslint/no-unused-vars */
import {CredentialProvider, PreviewStorageClient, StorageConfigurations} from '@gomomento/sdk';

const storageClient = new PreviewStorageClient({
  configuration: StorageConfigurations.Laptop.latest(),
  credentialProvider: CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY'),
});
