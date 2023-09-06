import {SetupVectorIntegrationTest} from '../integration-setup';
import {runVectorDataPlaneTest} from '@gomomento/common-integration-tests';

const {vectorClient} = SetupVectorIntegrationTest();

runVectorDataPlaneTest(vectorClient);
