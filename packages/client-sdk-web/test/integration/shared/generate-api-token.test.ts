import {runGenerateAuthTokenTest} from '@gomomento/common-integration-tests';
import {AuthClient} from '../../../src/auth-client';

runGenerateAuthTokenTest(new AuthClient());
