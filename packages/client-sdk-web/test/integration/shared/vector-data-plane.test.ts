import {SetupVectorIntegrationTest} from '../integration-setup';
import {runVectorDataPlaneTest} from '@gomomento/common-integration-tests';

const {vectorClient, vectorClientWithThrowOnErrors} =
  SetupVectorIntegrationTest();

runVectorDataPlaneTest(vectorClient, vectorClientWithThrowOnErrors);
