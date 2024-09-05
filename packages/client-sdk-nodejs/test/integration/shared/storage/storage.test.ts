import {runStorageServiceTests} from '@gomomento/common-integration-tests';
import {SetupStorageIntegrationTest} from '../../integration-setup';

const {storageClient} = SetupStorageIntegrationTest();
runStorageServiceTests(storageClient);
