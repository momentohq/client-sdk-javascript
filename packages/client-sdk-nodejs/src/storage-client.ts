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

export class StorageClient
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
    const dataClients = createDataClients(propsWithConfiguration);
    super(dataClients, controlClient);
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

function createDataClients(
  props: StorageClientPropsWithConfig
): IStorageDataClient[] {
  const numClients = props.configuration
    .getTransportStrategy()
    .getGrpcConfig()
    .getNumClients();
  return Array.from(
    {length: numClients},
    (_, i) => new StorageDataClient(props, i.toString())
  );
}

function getDefaultStorageConfiguration(): StorageConfiguration {
  return StorageConfigurations.Laptop.latest();
}
