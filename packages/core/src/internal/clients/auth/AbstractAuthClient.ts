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
    validUntilSeconds?: number
  ): Promise<GenerateApiToken.Response> {
    return await this.authClient.generateApiToken(
      sessionToken,
      validUntilSeconds
    );
  }
}
