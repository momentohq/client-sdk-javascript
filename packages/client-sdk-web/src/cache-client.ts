import {AbstractCacheClient} from '@gomomento/core/dist/src/internal/clients/cache/AbstractCacheClient';
import {IControlClient} from '@gomomento/core/dist/src/internal/clients/cache/IControlClient';
import {IDataClient} from '@gomomento/core/dist/src/internal/clients/cache/IDataClient';
import {ControlClient} from './internal/control-client';
import {NoopMomentoLoggerFactory} from '@gomomento/core/dist/src/config/logging';
import {CredentialProvider} from '@gomomento/core';
import {ICacheClient} from '../../common/dist/src/internal/clients/cache/ICacheClient';
import {DataClient} from './internal/data-client';

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
