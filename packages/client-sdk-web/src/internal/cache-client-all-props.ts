import {CredentialProvider} from '@gomomento/sdk-core';
import {CacheClientProps} from '../cache-client-props';
import {Configuration} from '../config/configuration';

export interface CacheClientAllProps extends CacheClientProps {
  configuration: Configuration;
  credentialProvider: CredentialProvider;
}
