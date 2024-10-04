import {InternalAuthClient} from './internal/internal-auth-client';
import {IAuthClient} from '@gomomento/sdk-core/dist/src/clients/IAuthClient';
import {AbstractAuthClient} from '@gomomento/sdk-core/dist/src/internal/clients/auth/AbstractAuthClient';
import {AuthClientProps} from './auth-client-props';
import {AuthClientAllProps} from './internal/auth-client-all-props';
import {getDefaultCredentialProvider} from '@gomomento/sdk-core';
import {AuthClientConfiguration, AuthClientConfigurations} from '.';

export class AuthClient extends AbstractAuthClient implements IAuthClient {
  constructor(props?: AuthClientProps) {
    const allProps: AuthClientAllProps = {
      ...props,
      configuration:
        props?.configuration ?? getDefaultAuthClientConfiguration(),
      credentialProvider:
        props?.credentialProvider ?? getDefaultCredentialProvider(),
    };
    const authClient = new InternalAuthClient(allProps);

    super({createAuthClient: () => authClient});
  }
}

function getDefaultAuthClientConfiguration(): AuthClientConfiguration {
  const config = AuthClientConfigurations.Default.latest();
  const logger = config.getLoggerFactory().getLogger('AuthClient');
  logger.info(
    'No configuration provided to AuthClient. Using latest "Default" configuration, suitable for development. For production use, consider specifying an explicit configuration.'
  );
  return config;
}
