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

interface CacheClientPropsWithConfiguration extends CacheClientProps {
  configuration: Configuration;
}

export class CacheClient extends AbstractCacheClient implements ICacheClient {
  constructor(props: CacheClientProps) {
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
