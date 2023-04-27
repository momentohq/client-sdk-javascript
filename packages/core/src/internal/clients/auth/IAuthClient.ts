import {GenerateApiToken, RefreshApiToken} from '../../../index';

export interface IAuthClient {
  generateApiToken(
    sessionToken: string,
    validForSeconds?: number
  ): Promise<GenerateApiToken.Response>;
  
  refreshApiToken(
    apiToken: string,
    refreshToken: string
  ): Promise<RefreshApiToken.Response>;
}
