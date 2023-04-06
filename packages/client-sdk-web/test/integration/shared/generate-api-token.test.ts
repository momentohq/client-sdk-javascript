import {runGenerateApiTokenTest} from '@gomomento/common-integration-tests';
import {CredentialProvider, NoopMomentoLoggerFactory} from '@gomomento/common';
import {AuthClient} from '../../../src/auth-client';

runGenerateApiTokenTest(
  new AuthClient({
    configuration: {
      getLoggerFactory: () => new NoopMomentoLoggerFactory(),
    },
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'TEST_AUTH_TOKEN',
    }),
  })
);
