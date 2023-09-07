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

export class CacheClient extends AbstractCacheClient implements ICacheClient {
  constructor(props: CacheClientProps) {
    const controlClient: IControlClient = createControlClient(props);
    const dataClient: IDataClient = createDataClient(props);
    const pingClient: IPingClient = createPingClient(props);
    super(controlClient, [dataClient], pingClient);
  }
}

function createControlClient(props: CacheClientProps): IControlClient {
  return new CacheControlClient({
    configuration: props.configuration,
    credentialProvider: props.credentialProvider,
  });
}

function createDataClient(props: CacheClientProps): IDataClient {
  return new CacheDataClient({
    configuration: props.configuration,
    credentialProvider: props.credentialProvider,
    defaultTtlSeconds: props.defaultTtlSeconds,
  });
}

function createPingClient(props: CacheClientProps): IPingClient {
  return new PingClient({
    endpoint: getWebCacheEndpoint(props.credentialProvider),
    configuration: props.configuration,
  });
}
