import {
  ExpiresIn,
  GenerateAuthToken,
  GenerateDisposableToken,
  RefreshAuthToken,
} from '../index';
import {DisposableTokenScope, TokenScope} from '../auth/tokens/token-scope';

export interface IAuthClient {
  generateAuthToken(
    scope: TokenScope,
    expiresIn: ExpiresIn
  ): Promise<GenerateAuthToken.Response>;

  refreshAuthToken(refreshToken: string): Promise<RefreshAuthToken.Response>;

  generateDisposableToken(
    scope: DisposableTokenScope,
    expiresIn: ExpiresIn
  ): Promise<GenerateDisposableToken.Response>;
}
