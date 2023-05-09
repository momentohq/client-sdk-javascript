import {runGenerateApiTokenTest} from '@gomomento/common-integration-tests';
import {AuthClient} from '../../../src/auth-client';

runGenerateApiTokenTest(new AuthClient());
