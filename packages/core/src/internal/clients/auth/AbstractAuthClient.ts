import {GenerateAuthToken, ExpiresIn, RefreshAuthToken} from '../../../index';
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

  public async generateAuthToken(
    expiresIn: ExpiresIn
  ): Promise<GenerateAuthToken.Response> {
    return await this.authClient.generateAuthToken(expiresIn);
  }

  public async refreshAuthToken(
    refreshToken: string
  ): Promise<RefreshAuthToken.Response> {
    return await this.authClient.refreshAuthToken(refreshToken);
  }
}
