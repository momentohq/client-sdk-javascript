import {GenerateApiToken} from '../../../index';

export interface IAuthClient {
  generateApiToken(
    sessionToken: string,
    validUntilSeconds?: number
  ): Promise<GenerateApiToken.Response>;
}
