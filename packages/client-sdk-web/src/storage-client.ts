import {
  AbstractStorageClient,
  IStorageControlClient,
  IStorageDataClient,
} from '@gomomento/sdk-core/dist/src/internal/clients';
import {StorageConfigurations} from './index';
import {IStorageClient} from '@gomomento/sdk-core';
import {StorageConfiguration} from './config/storage-configuration';
import {StorageDataClient} from './internal/storage-data-client';
import {StorageClientProps} from './storage-client-props';
import {StorageControlClient} from './internal/storage-control-client';

interface StorageClientPropsWithConfiguration extends StorageClientProps {
  configuration: StorageConfiguration;
}

export class StorageClient
  extends AbstractStorageClient
  implements IStorageClient
{
  private readonly _configuration: StorageConfiguration;

  constructor(props: StorageClientProps) {
    const configuration =
      props.configuration ?? getDefaultStorageClientConfiguration();
    const propsWithConfiguration: StorageClientPropsWithConfiguration = {
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

  public close() {
    this.controlClient.close();
    this.dataClients.forEach(client => client.close());
  }

  /**
   * The configuration used by this client.
   *
   * @readonly
   * @type {StorageConfiguration} the configuration used by this client
   * @memberof StorageClient
   */
  public get configuration(): StorageConfiguration {
    return this._configuration;
  }
}

function createControlClient(
  props: StorageClientPropsWithConfiguration
): IStorageControlClient {
  return new StorageControlClient({
    configuration: props.configuration,
    credentialProvider: props.credentialProvider,
  });
}

function createDataClient(
  props: StorageClientPropsWithConfiguration
): IStorageDataClient {
  return new StorageDataClient({
    configuration: props.configuration,
    credentialProvider: props.credentialProvider,
  });
}

function getDefaultStorageClientConfiguration(): StorageConfiguration {
  const config = StorageConfigurations.Default.latest();
  const logger = config.getLoggerFactory().getLogger('StorageClient');
  logger.info(
    'No configuration provided to StorageClient. Using default configuration. For production use, consider specifying an explicit configuration.'
  );
  return config;
}
