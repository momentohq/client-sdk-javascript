import {runGenerateApiTokenTest} from '@gomomento/common-integration-tests';
import {NoopMomentoLoggerFactory} from '@gomomento/core';
import {AuthClient} from '../../../src/auth-client';

// TODO: we need to figure out how to add a control endpoint for this test
runGenerateApiTokenTest(
  new AuthClient({
    configuration: {
      getLoggerFactory: () => new NoopMomentoLoggerFactory(),
    },
    controlEndpoint: '',
  })
);
