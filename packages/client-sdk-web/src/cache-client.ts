import {ControlClient} from './internal/control-client';
import {DataClient} from './internal/data-client';
import {CredentialProvider, DefaultMomentoLoggerFactory} from '@gomomento/core';
import {
  AbstractCacheClient,
  IControlClient,
  IDataClient,
  ICacheClient,
} from '@gomomento/core/dist/src/internal/clients/index';

export interface CacheClientProps {
  credentialProvider: CredentialProvider;
}

export class CacheClient extends AbstractCacheClient implements ICacheClient {
  constructor(props: CacheClientProps) {
    const controlClient: IControlClient = createControlClient(props);
    const dataClient: IDataClient = createDataClient(props);
    super(controlClient, [dataClient]);
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
      getLoggerFactory: () => new DefaultMomentoLoggerFactory(),
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
      getLoggerFactory: () => new DefaultMomentoLoggerFactory(),
    },
    credentialProvider: props.credentialProvider,
    defaultTtlSeconds: 60 * 20,
  });
}
