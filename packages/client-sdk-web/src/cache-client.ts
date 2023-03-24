import {AbstractCacheClient} from '@gomomento/core/dist/src/internal/clients/cache/AbstractCacheClient';
import {IControlClient} from '@gomomento/core/dist/src/internal/clients/cache/IControlClient';
import {ControlClient} from './internal/control-client';
import {NoopMomentoLoggerFactory} from '@gomomento/core/dist/src/config/logging';
import {CredentialProvider} from '@gomomento/core';

export class CacheClient extends AbstractCacheClient {
  constructor() {
    const controlClient: IControlClient = createControlClient();
    super(controlClient);
  }
}

function createControlClient(): IControlClient {
  return new ControlClient({
    // TODO
    // TODO
    // TODO these shouldn't be hard-coded
    // TODO
    // TODO
    configuration: {
      getLoggerFactory: () => new NoopMomentoLoggerFactory(),
    },
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'TEST_AUTH_TOKEN',
    }),
  });
}
