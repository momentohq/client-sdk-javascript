import {
  AbstractAuthClient,
  IAuthClient,
} from '@gomomento/sdk-core/dist/src/internal/clients/index';
import {InternalWebGrpcAuthClient} from './internal/auth-client';
import {AuthClientProps} from './auth-client-props';

export class AuthClient extends AbstractAuthClient {
  constructor(props: AuthClientProps) {
    const createAuthClient = (): IAuthClient => {
      return new InternalWebGrpcAuthClient(props);
    };
    super({createAuthClient});
  }
}
