import {
  DisposableTokenScope,
  ExpiresIn,
  GenerateApiKey,
  GenerateDisposableToken,
  RefreshApiKey,
} from '../index';
import {PermissionScope} from '../auth/tokens/permission-scope';
import {DisposableTokenProps} from '../auth/tokens/disposable-token-scope';

export interface IAuthClient {
  generateApiKey(
    scope: PermissionScope,
    expiresIn: ExpiresIn
  ): Promise<GenerateApiKey.Response>;

  /**
   * @deprecated please use `generateApiKey` instead
   */
  generateAuthToken(
    scope: PermissionScope,
    expiresIn: ExpiresIn
  ): Promise<GenerateApiKey.Response>;

  refreshApiKey(refreshToken: string): Promise<RefreshApiKey.Response>;

  /**
   * @deprecated please use `refreshApiKey` instead
   */
  refreshAuthToken(refreshToken: string): Promise<RefreshApiKey.Response>;

  generateDisposableToken(
    scope: DisposableTokenScope,
    expiresIn: ExpiresIn,
    props?: DisposableTokenProps
  ): Promise<GenerateDisposableToken.Response>;
}
