import {FunctionClientProps} from '../function-client-props';
import {FunctionConfiguration} from '../config/function-configuration';
import {CredentialProvider} from '@gomomento/sdk-core';

export interface FunctionClientAllProps extends FunctionClientProps {
  configuration: FunctionConfiguration;
  credentialProvider: CredentialProvider;
}
