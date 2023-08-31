import {runVectorDataPlaneTest} from '@gomomento/common-integration-tests';
import {SetupVectorIntegrationTest} from '../integration-setup';

const {vectorClient} = SetupVectorIntegrationTest();

runVectorDataPlaneTest(vectorClient);
