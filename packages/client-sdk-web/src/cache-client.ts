import {CacheControlClient} from './internal/cache-control-client';
import {CacheDataClient} from './internal/cache-data-client';
import {PingClient} from './internal/ping-client';
import {
  AbstractCacheClient,
  IControlClient,
  ICacheClient,
  IDataClient,
  IPingClient,
} from '@gomomento/sdk-core/dist/src/internal/clients';
import {CacheClientProps} from './cache-client-props';
import {getWebCacheEndpoint} from './utils/web-client-utils';
import {Configuration, Configurations} from './index';
import {validateTtlSeconds} from '@gomomento/sdk-core/dist/src/internal/utils';

interface CacheClientPropsWithConfiguration extends CacheClientProps {
  configuration: Configuration;
}

export class CacheClient extends AbstractCacheClient implements ICacheClient {
  private readonly _configuration: Configuration;

  constructor(props: CacheClientProps) {
    validateTtlSeconds(props.defaultTtlSeconds);
    const configuration =
      props.configuration ?? getDefaultCacheClientConfiguration();
    const propsWithConfiguration: CacheClientPropsWithConfiguration = {
      ...props,
      configuration,
    };
    const controlClient: IControlClient = createControlClient(
      propsWithConfiguration
    );
    const dataClient: IDataClient = createDataClient(propsWithConfiguration);
    const pingClient: IPingClient = createPingClient(propsWithConfiguration);
    super(controlClient, [dataClient], pingClient);
  }

  public close() {
    this.controlClient.close();
    this.dataClients.map(dc => dc.close());
  }

  /**
   * The configuration used by this client.
   *
   * @readonly
   * @type {Configuration} the configuration used by this client
   * @memberof CacheClient
   */
  public get configuration(): Configuration {
    return this._configuration;
  }

  /**
   * Creates a new instance of CacheClient.
   * @param cacheClientProps - The properties to use for creating the CacheClient.
   */
  // Disabling eslint rule because the example code that calls this function uses an await expression,
  // necessitating the function to be async.
  // eslint-disable-next-line require-await,@typescript-eslint/require-await
  public static async create(
    cacheClientProps: CacheClientProps
  ): Promise<CacheClient> {
    return new CacheClient(cacheClientProps);
  }
}

function createControlClient(
  props: CacheClientPropsWithConfiguration
): IControlClient {
  return new CacheControlClient({
    configuration: props.configuration,
    credentialProvider: props.credentialProvider,
  });
}

function createDataClient(
  props: CacheClientPropsWithConfiguration
): IDataClient {
  return new CacheDataClient({
    configuration: props.configuration,
    credentialProvider: props.credentialProvider,
    defaultTtlSeconds: props.defaultTtlSeconds,
  });
}

function createPingClient(
  props: CacheClientPropsWithConfiguration
): IPingClient {
  return new PingClient({
    endpoint: getWebCacheEndpoint(props.credentialProvider),
    configuration: props.configuration,
  });
}

function getDefaultCacheClientConfiguration(): Configuration {
  const config = Configurations.Browser.latest();
  const logger = config.getLoggerFactory().getLogger('CacheClient');
  logger.info(
    'No configuration provided to CacheClient. Using default configuration. For production use, consider specifying an explicit configuration.'
  );
  return config;
}
