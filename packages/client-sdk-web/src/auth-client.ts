import {
  AbstractAuthClient,
  IAuthClient,
} from '@gomomento/sdk-core/dist/src/internal/clients/index';
import {InternalWebGrpcAuthClient} from './internal/auth-client';

export class AuthClient extends AbstractAuthClient {
  constructor() {
    const createAuthClient = (): IAuthClient => {
      return new InternalWebGrpcAuthClient();
    };
    super({createAuthClient});
  }
}
