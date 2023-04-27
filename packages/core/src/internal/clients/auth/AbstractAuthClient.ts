import {GenerateApiToken} from '../../../index';
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
    sessionToken: string,
    validForSeconds?: number
  ): Promise<GenerateApiToken.Response> {
    return await this.authClient.generateApiToken(
      sessionToken,
      validForSeconds
    );
  }

  public async refreshApiToken(
    apiToken: string,
    refreshToken: string
  ): Promise<GenerateApiToken.Response> {
    return await this.authClient.refreshApiToken(apiToken, refreshToken);
  }
}
