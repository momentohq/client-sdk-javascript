import {ControlClient} from './internal/control-client';
import {
  AbstractCacheClient,
  CredentialProvider,
  IControlClient,
  NoopMomentoLoggerFactory,
} from '@gomomento/common';

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
