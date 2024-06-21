import {
  AbstractStorageClient,
  IStorageControlClient,
  IStorageDataClient,
} from '@gomomento/sdk-core/dist/src/internal/clients';
import {IStorageClient} from '@gomomento/sdk-core/dist/src/clients/IStorageClient';
import {StorageClientProps} from './storage-client-props';
import {StorageClientPropsWithConfig} from './internal/storage-client-props-with-config';
import {StorageControlClient} from './internal/storage-control-client';
import {StorageDataClient} from './internal/storage-data-client';
import {StorageConfiguration} from './config/storage-configuration';
import {StorageConfigurations} from './index';

/**
 * A client for interacting with the Momento Storage service.
 * Warning: This client is in preview and may change in future releases.
 */
export class PreviewStorageClient
  extends AbstractStorageClient
  implements IStorageClient
{
  constructor(props: StorageClientProps) {
    const configuration =
      props.configuration ?? getDefaultStorageConfiguration();
    const propsWithConfiguration: StorageClientPropsWithConfig = {
      ...props,
      configuration,
    };

    const controlClient: IStorageControlClient = createControlClient(
      propsWithConfiguration
    );
    const dataClient: IStorageDataClient = createDataClient(
      propsWithConfiguration
    );
    super([dataClient], controlClient);
  }

  close(): void {
    this.dataClients.forEach(client => client.close());
    this.controlClient.close();
  }
}

function createControlClient(
  props: StorageClientPropsWithConfig
): IStorageControlClient {
  return new StorageControlClient({
    configuration: props.configuration,
    credentialProvider: props.credentialProvider,
  });
}

function createDataClient(
  props: StorageClientPropsWithConfig
): IStorageDataClient {
  return new StorageDataClient({
    configuration: props.configuration,
    credentialProvider: props.credentialProvider,
  });
}

function getDefaultStorageConfiguration(): StorageConfiguration {
  return StorageConfigurations.Laptop.latest();
}
