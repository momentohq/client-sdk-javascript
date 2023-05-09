import {AuthClient as InternalAuthClient} from './internal/auth-client';
import {IAuthClient} from '@gomomento/sdk-core/dist/src/internal/clients/auth/IAuthClient';
import {AbstractAuthClient} from '@gomomento/sdk-core/dist/src/internal/clients/auth/AbstractAuthClient';
import {MomentoLogger, RefreshApiToken} from '.';
import {AuthClientProps} from './auth-client-props';
import {
  GenerateApiToken,
  ExpiresIn,
  CredentialProvider,
} from '@gomomento/sdk-core';

export class AuthClient extends AbstractAuthClient implements IAuthClient {
  private readonly logger: MomentoLogger;

  constructor(props: AuthClientProps) {
    const authClient = new InternalAuthClient({
      configuration: props.configuration,
    });

    super({createAuthClient: () => authClient});

    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.logger.info('Creating Momento AuthClient');
  }

  /**
   * Gets a api token, refresh token given a valid session token.
   *
   * @param {string} controlEndpoint - Endpoint for control plane.
   * @param {string} sessionToken - The session token to allow access for generation of api tokens.
   * @param {string} expiresIn - How long the token is valid for in epoch timestamp.
   * @returns {Promise<GenerateApiToken.Response>} -
   * {@link GenerateApiToken.Success} containing the api token, refresh token, origin and epoch timestamp when token expires.
   * If the token never expires, then no refresh token will be returned and expires at timestamp will be infinite.
   * {@link GenerateApiToken.Error} on failure.
   */
  public async generateApiToken(
    controlEndpoint: string,
    sessionToken: string,
    expiresIn: ExpiresIn
  ): Promise<GenerateApiToken.Response> {
    return await this.authClient.generateApiToken(
      controlEndpoint,
      sessionToken,
      expiresIn
    );
  }

  /**
   * Refreshs a api token.
   *
   * @param {string} credentialProvider - Credentials provider built from a api token.
   * @param {string} refreshToken - Refresh token used to refresh the api token.
   * @returns {Promise<RefreshApiToken.Response>} -
   * {@link RefreshApiToken.Success} containing the new api token, refresh token, origin and epoch timestamp when token expires.
   * {@link RefreshApiToken.Error} on failure.
   */
  // public async refreshApiToken(
  //   credentialProvider: CredentialProvider,
  //   refreshToken: string
  // ): Promise<RefreshApiToken.Response> {
  //   return await this.authClient.refreshApiToken(
  //     credentialProvider,
  //     refreshToken
  //   );
  // }
}
