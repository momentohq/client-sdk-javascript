import {
  AbstractAuthClient,
  IAuthClient,
} from '@gomomento/core/dist/src/internal/clients/index';
import {
  AuthClientProps,
  InternalWebGrpcAuthClient,
} from './internal/auth-client';

export class AuthClient extends AbstractAuthClient {
  constructor(props: AuthClientProps) {
    const createAuthClient = (): IAuthClient => {
      return new InternalWebGrpcAuthClient(props);
    };
    super({createAuthClient});
  }
}
