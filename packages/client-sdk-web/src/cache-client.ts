import {AbstractCacheClient} from '@gomomento/core/dist/src/internal/clients/cache/AbstractCacheClient';
import {IControlClient} from '@gomomento/core/dist/src/internal/clients/cache/IControlClient';
import {ControlClient} from './internal/control-client';
import {NoopMomentoLoggerFactory} from '@gomomento/core/dist/src/config/logging';
import {CredentialProvider} from '@gomomento/core';

export interface CacheClientProps {
  credentialProvider: CredentialProvider;
}

export class CacheClient extends AbstractCacheClient {
  constructor(props: CacheClientProps) {
    const controlClient: IControlClient = createControlClient(props);
    super(controlClient);
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
