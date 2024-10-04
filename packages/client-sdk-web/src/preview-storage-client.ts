import {
  AbstractStorageClient,
  IStorageControlClient,
  IStorageDataClient,
} from '@gomomento/sdk-core/dist/src/internal/clients';
import {StorageConfigurations} from './index';
import {
  getDefaultCredentialProvider,
  IStorageClient,
} from '@gomomento/sdk-core';
import {StorageConfiguration} from './config/storage-configuration';
import {StorageDataClient} from './internal/storage-data-client';
import {StorageClientProps} from './storage-client-props';
import {StorageControlClient} from './internal/storage-control-client';
import {StorageClientAllProps} from './internal/storage-client-all-props';

export class PreviewStorageClient
  extends AbstractStorageClient
  implements IStorageClient
{
  private readonly _configuration: StorageConfiguration;

  constructor(props?: StorageClientProps) {
    const allProps: StorageClientAllProps = {
      configuration:
        props?.configuration ?? getDefaultStorageClientConfiguration(),
      credentialProvider:
        props?.credentialProvider ?? getDefaultCredentialProvider(),
    };
    const controlClient: IStorageControlClient = createControlClient(allProps);
    const dataClient: IStorageDataClient = createDataClient(allProps);
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
   * @memberof PreviewStorageClient
   */
  public get configuration(): StorageConfiguration {
    return this._configuration;
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

function getDefaultStorageClientConfiguration(): StorageConfiguration {
  const config = StorageConfigurations.Default.latest();
  const logger = config.getLoggerFactory().getLogger('StorageClient');
  logger.info(
    'No configuration provided to StorageClient. Using latest "Default" configuration, suitable for development. For production use, consider specifying an explicit configuration.'
  );
  return config;
}
