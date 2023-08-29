import {
  GenerateAuthToken,
  ExpiresIn,
  RefreshAuthToken,
  GenerateDisposableToken,
} from '../../../index';
import {IAuthClient} from '../../../clients/IAuthClient';
import {
  TemporaryTokenScope,
  TokenScope,
} from '../../../auth/tokens/token-scope';

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
   * Generates a new auth token, along with a refresh token to refresh the auth token before expiry.
   *
   * @param {TokenScope} scope - controls the permissions that the new token will have
   * @param {string} expiresIn - How long the token is valid for in epoch timestamp.
   * @returns {Promise<GenerateAuthToken.Response>} -
   * {@link GenerateAuthToken.Success} containing the api token, refresh token, origin and epoch timestamp when token expires.
   * If the token never expires, then no refresh token will be returned and expires at timestamp will be infinite.
   * {@link GenerateAuthToken.Error} on failure.
   */
  public async generateAuthToken(
    scope: TokenScope,
    expiresIn: ExpiresIn
  ): Promise<GenerateAuthToken.Response> {
    return await this.authClient.generateAuthToken(scope, expiresIn);
  }

  /**
   * Refreshes an auth token.  Returns a new set of refresh/auth tokens that will be able to be refreshed again in the future.
   * The new auth token will be valid for the same length of time as the original token, starting from the time of refresh.
   * The original api token will still work until its expired.
   *
   * @param {string} refreshToken - Refresh token used to refresh the api token.
   * @returns {Promise<RefreshAuthToken.Response>} -
   * {@link RefreshAuthToken.Success} containing the new auth token, refresh token, origin and epoch timestamp when token expires.
   * {@link RefreshAuthToken.Error} on failure.
   */
  public async refreshAuthToken(
    refreshToken: string
  ): Promise<RefreshAuthToken.Response> {
    return await this.authClient.refreshAuthToken(refreshToken);
  }

  /**
   * Generates a new disposable, fine-grained access token.
   *
   * @param {TemporaryTokenScope} scope - controls the permissions that the new token will have
   * @param {string} expiresIn - How long the token is valid for in epoch timestamp.
   * @returns {Promise<GenerateDisposableToken.Response>} -
   * {@link GenerateDisposableToken.Success} containing the api token, origin and epoch timestamp when token expires.
   * {@link GenerateDisposableToken.Error} on failure.
   */
  public async generateDisposableToken(
    scope: TemporaryTokenScope,
    expiresIn: ExpiresIn
  ): Promise<GenerateDisposableToken.Response> {
    return await this.authClient.generateDisposableToken(scope, expiresIn);
  }
}
