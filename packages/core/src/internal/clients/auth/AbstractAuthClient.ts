import {GenerateApiToken, ExpiresIn, CredentialProvider} from '../../../index';
import {IAuthClient} from './IAuthClient';

export interface BaseAuthClientProps {
  createAuthClient: () => IAuthClient;
}
export abstract class AbstractAuthClient implements IAuthClient {
  // making these protected until we fully abstract away the nodejs client
  protected readonly authClient: IAuthClient;

  protected constructor(props: BaseAuthClientProps) {
    this.authClient = props.createAuthClient();
  }

  public async generateApiToken(
    controlEndpoint: string,
    sessionToken: string,
    expiresIn: ExpiresIn
  ): Promise<GenerateApiToken.Response> {
    return await this.authClient.generateApiToken(
      controlEndpoint,
      sessionToken,
      expiresIn
    );
  }

  public async refreshApiToken(
    credentialProvider: CredentialProvider,
    refreshToken: string
  ): Promise<GenerateApiToken.Response> {
    return await this.authClient.refreshApiToken(
      credentialProvider,
      refreshToken
    );
  }
}
