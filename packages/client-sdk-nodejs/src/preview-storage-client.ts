import {
  AbstractStorageClient,
  IStorageControlClient,
  IStorageDataClient,
} from '@gomomento/sdk-core/dist/src/internal/clients';
import {IStorageClient} from '@gomomento/sdk-core/dist/src/clients/IStorageClient';
import {StorageClientProps} from './storage-client-props';
import {StorageClientAllProps} from './internal/storage-client-all-props';
import {StorageControlClient} from './internal/storage-control-client';
import {StorageDataClient} from './internal/storage-data-client';
import {StorageConfiguration} from './config/storage-configuration';
import {StorageConfigurations} from './index';
import {getDefaultCredentialProvider} from '@gomomento/sdk-core';

/**
 * A client for interacting with the Momento Storage service.
 * Warning: This client is in preview and may change in future releases.
 */
export class PreviewStorageClient
  extends AbstractStorageClient
  implements IStorageClient
{
  constructor(props: StorageClientProps) {
    const allProps: StorageClientAllProps = {
      configuration: props.configuration ?? getDefaultStorageConfiguration(),
      credentialProvider:
        props.credentialProvider ?? getDefaultCredentialProvider(),
    };

    const controlClient: IStorageControlClient = createControlClient(allProps);
    const dataClient: IStorageDataClient = createDataClient(allProps);
    super([dataClient], controlClient);
  }

  close(): void {
    this.dataClients.forEach(client => client.close());
    this.controlClient.close();
  }
}

function createControlClient(
  props: StorageClientAllProps
): IStorageControlClient {
  return new StorageControlClient(props);
}

function createDataClient(props: StorageClientAllProps): IStorageDataClient {
  return new StorageDataClient(props);
}

function getDefaultStorageConfiguration(): StorageConfiguration {
  return StorageConfigurations.Laptop.latest();
}
