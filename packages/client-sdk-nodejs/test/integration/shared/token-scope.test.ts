import {runTokenScopeTests} from '@gomomento/common-integration-tests/dist/src/token-scope';
import {setupTokenScopeTest} from '../integration-setup';

const {v1SuperUserToken, authClientFactory, cacheClientFactory, cacheName} =
  setupTokenScopeTest();
runTokenScopeTests(
  v1SuperUserToken,
  authClientFactory,
  cacheClientFactory,
  cacheName
);
