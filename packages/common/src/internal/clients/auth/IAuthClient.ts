import {GenerateApiToken} from '../../../index';

export interface IAuthClient {
  generateApiToken(sessionToken: string): Promise<GenerateApiToken.Response>;
}
