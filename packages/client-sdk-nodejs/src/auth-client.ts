import {InternalAuthClient} from './internal/internal-auth-client';
import {IAuthClient} from '@gomomento/sdk-core/dist/src/internal/clients/auth/IAuthClient';
import {AbstractAuthClient} from '@gomomento/sdk-core/dist/src/internal/clients/auth/AbstractAuthClient';
import {
  GenerateAuthToken,
  ExpiresIn,
  RefreshAuthToken,
} from '@gomomento/sdk-core';
import {AuthClientProps} from './auth-client-props';

export class AuthClient extends AbstractAuthClient implements IAuthClient {
  constructor(props: AuthClientProps) {
    const authClient = new InternalAuthClient(props);

    super({createAuthClient: () => authClient});
  }

  /**
   * Gets a api token, refresh token given a valid session token.
   *
   * @param {string} controlEndpoint - Endpoint for control plane.
   * @param {string} token - The token to allow access for generation of api tokens.
   * @param {string} expiresIn - How long the token is valid for in epoch timestamp.
   * @returns {Promise<GenerateAuthToken.Response>} -
   * {@link GenerateAuthToken.Success} containing the api token, refresh token, origin and epoch timestamp when token expires.
   * If the token never expires, then no refresh token will be returned and expires at timestamp will be infinite.
   * {@link GenerateAuthToken.Error} on failure.
   */
  public async generateAuthToken(
    expiresIn: ExpiresIn
  ): Promise<GenerateAuthToken.Response> {
    return await this.authClient.generateAuthToken(expiresIn);
  }

  /**
   * Refreshs a api token.
   *
   * @param {string} credentialProvider - Credentials provider built from a api token.
   * @param {string} refreshToken - Refresh token used to refresh the api token.
   * @returns {Promise<RefreshAuthToken.Response>} -
   * {@link RefreshAuthToken.Success} containing the new api token, refresh token, origin and epoch timestamp when token expires.
   * {@link RefreshAuthToken.Error} on failure.
   */
  public async refreshAuthToken(
    refreshToken: string
  ): Promise<RefreshAuthToken.Response> {
    return await this.authClient.refreshAuthToken(refreshToken);
  }
}
