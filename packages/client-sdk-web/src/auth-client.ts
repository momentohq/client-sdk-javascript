import {AbstractAuthClient, IAuthClient} from '@gomomento/common';
import {
  AuthClientProps,
  InternalWebGrpcAuthClient,
} from './internal/auth-client';

// TODO
// TODO
// TODO - before we do a 1.0 release this needs to be removed; we will just have a ping method on the CacheClient.
// TODO
// TODO

export class AuthClient extends AbstractAuthClient {
  constructor(props: AuthClientProps) {
    const createAuthClient = (): IAuthClient => {
      return new InternalWebGrpcAuthClient(props);
    };
    super({createAuthClient});
  }
}
