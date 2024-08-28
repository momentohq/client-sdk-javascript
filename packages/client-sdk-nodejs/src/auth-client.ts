import {InternalAuthClient} from './internal/internal-auth-client';
import {IAuthClient} from '@gomomento/sdk-core/dist/src/clients/IAuthClient';
import {AbstractAuthClient} from '@gomomento/sdk-core/dist/src/internal/clients/auth/AbstractAuthClient';
import {AuthClientProps} from './auth-client-props';
import {AuthClientAllProps} from './internal/auth-client-all-props';
import {getDefaultCredentialProvider} from '@gomomento/sdk-core';

export class AuthClient extends AbstractAuthClient implements IAuthClient {
  constructor(props: AuthClientProps) {
    const allProps: AuthClientAllProps = {
      ...props,
      credentialProvider:
        props.credentialProvider ?? getDefaultCredentialProvider(),
    };
    const authClient = new InternalAuthClient(allProps);

    super({createAuthClient: () => authClient});
  }
}
