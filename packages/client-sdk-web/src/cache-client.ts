import {ControlClient} from './internal/control-client';
import {DataClient} from './internal/data-client';
import {PingClient} from './internal/ping-client';
import {
  CredentialProvider,
  NoopMomentoLoggerFactory,
} from '@gomomento/sdk-core';
import {
  AbstractCacheClient,
  IControlClient,
  ICacheClient,
  IDataClient,
  IPingClient,
} from '@gomomento/sdk-core/dist/src/internal/clients';

export interface CacheClientProps {
  credentialProvider: CredentialProvider;
}

export class CacheClient extends AbstractCacheClient implements ICacheClient {
  constructor(props: CacheClientProps) {
    const controlClient: IControlClient = createControlClient(props);
    const dataClient: IDataClient = createDataClient(props);
    const pingClient: IPingClient = createPingClient(props);
    super(controlClient, [dataClient], pingClient);
  }
}

function createControlClient(props: CacheClientProps): IControlClient {
  return new ControlClient({
    // TODO
    // TODO
    // TODO these shouldn't be hard-coded
    // TODO
    // TODO
    configuration: {
      getLoggerFactory: () => new NoopMomentoLoggerFactory(),
    },
    credentialProvider: props.credentialProvider,
  });
}

function createDataClient(props: CacheClientProps): IDataClient {
  return new DataClient({
    // TODO
    // TODO
    // TODO these shouldn't be hard-coded
    // TODO
    // TODO
    configuration: {
      getLoggerFactory: () => new NoopMomentoLoggerFactory(),
    },
    credentialProvider: props.credentialProvider,
    defaultTtlSeconds: 60,
  });
}

function createPingClient(props: CacheClientProps): IPingClient {
  return new PingClient({
    // TODO
    // TODO
    // TODO these shouldn't be hard-coded
    // TODO
    // TODO
    endpoint: props.credentialProvider.getCacheEndpoint(),
    configuration: {
      getLoggerFactory: () => new NoopMomentoLoggerFactory(),
    },
  });
}
