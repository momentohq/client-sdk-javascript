import {runVectorControlPlaneTest} from '@gomomento/common-integration-tests';
import {SetupVectorIntegrationTest} from '../integration-setup';

const {vectorClient} = SetupVectorIntegrationTest();

runVectorControlPlaneTest(vectorClient);
