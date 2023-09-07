import {
  ExpiresIn,
  GenerateApiKey,
  GenerateDisposableToken,
  RefreshApiKey,
} from '../index';
import {DisposableTokenScope, TokenScope} from '../auth/tokens/token-scope';

export interface IAuthClient {
  generateApiKey(
    scope: TokenScope,
    expiresIn: ExpiresIn
  ): Promise<GenerateApiKey.Response>;

  /**
   * @deprecated please use `generateApiKey` instead
   */
  generateAuthToken(
    scope: TokenScope,
    expiresIn: ExpiresIn
  ): Promise<GenerateApiKey.Response>;

  refreshApiKey(refreshToken: string): Promise<RefreshApiKey.Response>;

  /**
   * @deprecated please use `refreshApiKey` instead
   */
  refreshAuthToken(refreshToken: string): Promise<RefreshApiKey.Response>;

  generateDisposableToken(
    scope: DisposableTokenScope,
    expiresIn: ExpiresIn
  ): Promise<GenerateDisposableToken.Response>;
}
