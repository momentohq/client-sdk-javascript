import {InternalAuthClient} from './internal/internal-auth-client';
import {IAuthClient} from '@gomomento/sdk-core/dist/src/clients/IAuthClient';
import {AbstractAuthClient} from '@gomomento/sdk-core/dist/src/internal/clients/auth/AbstractAuthClient';
import {AuthClientProps} from './auth-client-props';

export class AuthClient extends AbstractAuthClient implements IAuthClient {
  constructor(props: AuthClientProps) {
    const authClient = new InternalAuthClient(props);

    super({createAuthClient: () => authClient});
  }
}
