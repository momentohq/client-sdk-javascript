import {ExpiresIn, GenerateAuthToken, RefreshAuthToken} from '../../../index';

export interface IAuthClient {
  generateAuthToken(expiresIn: ExpiresIn): Promise<GenerateAuthToken.Response>;

  refreshAuthToken(refreshToken: string): Promise<RefreshAuthToken.Response>;
}
