import {ExpiresIn, GenerateAuthToken, RefreshAuthToken} from '../index';
import {TokenScope} from '../auth/tokens/token-scope';

export interface IAuthClient {
  generateAuthToken(
    scope: TokenScope,
    expiresIn: ExpiresIn
  ): Promise<GenerateAuthToken.Response>;

  refreshAuthToken(refreshToken: string): Promise<RefreshAuthToken.Response>;
}
