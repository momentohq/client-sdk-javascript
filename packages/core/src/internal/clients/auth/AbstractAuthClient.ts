import {
  GenerateApiKey,
  ExpiresIn,
  RefreshApiKey,
  GenerateDisposableToken,
  DisposableTokenScope,
} from '../../../index';
import {IAuthClient} from '../../../clients/IAuthClient';
import {PermissionScope} from '../../../auth/tokens/permission-scope';

export interface BaseAuthClientProps {
  createAuthClient: () => IAuthClient;
}
export abstract class AbstractAuthClient implements IAuthClient {
  // making these protected until we fully abstract away the nodejs client
  protected readonly authClient: IAuthClient;

  protected constructor(props: BaseAuthClientProps) {
    this.authClient = props.createAuthClient();
  }

  /**
   * Generates a new API key, along with a refresh token to refresh the API key before expiry.
   *
   * @param {PermissionScope} scope - controls the permissions that the new key will have
   * @param {string} expiresIn - How long the API key should be valid for in epoch timestamp.
   * @returns {Promise<GenerateApiKey.Response>} -
   * {@link GenerateApiKey.Success} containing the API key, refresh token, origin and epoch timestamp when token expires.
   * If the API key never expires, then no refresh token will be returned and expires at timestamp will be infinite.
   * {@link GenerateApiKey.Error} on failure.
   */
  public async generateApiKey(
    scope: PermissionScope,
    expiresIn: ExpiresIn
  ): Promise<GenerateApiKey.Response> {
    return await this.authClient.generateApiKey(scope, expiresIn);
  }

  /**
   * @deprecated please use `generateApiKey` instead
   */
  public async generateAuthToken(
    scope: PermissionScope,
    expiresIn: ExpiresIn
  ): Promise<GenerateApiKey.Response> {
    return await this.generateApiKey(scope, expiresIn);
  }

  /**
   * Refreshes an API key.  Returns a new API key and refresh token, that will be able to be refreshed again in the future.
   * The new API key will be valid for the same length of time as the original key, starting from the time of refresh.
   * The original api key will still work until its expired.
   *
   * @param {string} refreshToken - Refresh token used to refresh the API key.
   * @returns {Promise<RefreshApiKey.Response>} -
   * {@link RefreshApiKey.Success} containing the new API key, refresh token, origin and epoch timestamp when the API key expires.
   * {@link RefreshApiKey.Error} on failure.
   */
  public async refreshApiKey(
    refreshToken: string
  ): Promise<RefreshApiKey.Response> {
    return await this.authClient.refreshApiKey(refreshToken);
  }

  /**
   * @deprecated please use `refreshApiKey` instead
   */
  public async refreshAuthToken(
    refreshToken: string
  ): Promise<RefreshApiKey.Response> {
    return await this.refreshApiKey(refreshToken);
  }

  /**
   * Generates a new disposable, fine-grained access token.
   *
   * @param {DisposableTokenScope} scope - controls the permissions that the new token will have
   * @param {string} expiresIn - How long the token is valid for in epoch timestamp.
   * @returns {Promise<GenerateDisposableToken.Response>} -
   * {@link GenerateDisposableToken.Success} containing the api token, origin and epoch timestamp when token expires.
   * {@link GenerateDisposableToken.Error} on failure.
   */
  public async generateDisposableToken(
    scope: DisposableTokenScope,
    expiresIn: ExpiresIn
  ): Promise<GenerateDisposableToken.Response> {
    return await this.authClient.generateDisposableToken(scope, expiresIn);
  }
}
