import {
  AbstractAuthClient,
  IAuthClient,
} from '@gomomento/sdk-core/dist/src/internal/clients/index';
import {InternalWebGrpcAuthClient} from './internal/auth-client';
import {AuthClientProps} from './auth-client-props';
import {AuthClientAllProps} from './internal/auth-client-all-props';
import {getDefaultCredentialProvider} from '@gomomento/sdk-core';

export class AuthClient extends AbstractAuthClient {
  constructor(props?: AuthClientProps) {
    const createAuthClient = (): IAuthClient => {
      const allProps: AuthClientAllProps = {
        ...props,
        credentialProvider:
          props?.credentialProvider ?? getDefaultCredentialProvider(),
      };
      return new InternalWebGrpcAuthClient(allProps);
    };
    super({createAuthClient});
  }
}
