/* eslint-disable @typescript-eslint/no-unused-vars */
import {PreviewStorageClient, StorageConfigurations} from '@gomomento/sdk';

const storageClient = new PreviewStorageClient({
  configuration: StorageConfigurations.Laptop.latest(),
});
