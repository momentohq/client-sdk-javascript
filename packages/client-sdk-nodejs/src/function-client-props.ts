import {CredentialProvider} from '@gomomento/sdk-core';
import {FunctionConfiguration} from './config/function-configuration';

export interface FunctionClientProps {
  /**
   * Configuration settings for the function client
   */
  configuration?: FunctionConfiguration;
  /**
   * controls how the client will get authentication information for connecting to the Momento service
   */
  credentialProvider?: CredentialProvider;
}
