import {CredentialProvider} from '@gomomento/sdk-core';
import {AuthClientProps} from '../auth-client-props';

export interface AuthClientAllProps extends AuthClientProps {
  credentialProvider: CredentialProvider;
}
