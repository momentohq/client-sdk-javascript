import {ControlClient} from './internal/control-client';
import {DataClient} from './internal/data-client';
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
import {ListRetainCallOptions} from '@gomomento/sdk-core/dist/src/utils';
import {CacheListRetain} from '@gomomento/sdk-core';

export class CacheClient extends AbstractCacheClient implements ICacheClient {
  constructor(props: CacheClientProps) {
    const controlClient: IControlClient = createControlClient(props);
    const dataClient: IDataClient = createDataClient(props);
    const pingClient: IPingClient = createPingClient(props);
    super(controlClient, [dataClient], pingClient);
  }

  listRetain(
    cacheName: string,
    listName: string,
    options?: ListRetainCallOptions
  ): Promise<CacheListRetain.Response> {
    throw new Error('woot');
  }
}

function createControlClient(props: CacheClientProps): IControlClient {
  return new ControlClient({
    configuration: props.configuration,
    credentialProvider: props.credentialProvider,
  });
}

function createDataClient(props: CacheClientProps): IDataClient {
  return new DataClient({
    configuration: props.configuration,
    credentialProvider: props.credentialProvider,
    defaultTtlSeconds: 60,
  });
}

function createPingClient(props: CacheClientProps): IPingClient {
  return new PingClient({
    endpoint: getWebCacheEndpoint(props.credentialProvider),
    configuration: props.configuration,
  });
}
