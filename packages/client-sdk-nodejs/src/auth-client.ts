import {AuthClient as InternalAuthClient} from './internal/auth-client';
import {IAuthClient} from '@gomomento/sdk-core/dist/src/internal/clients/auth/IAuthClient';
import {AbstractAuthClient} from '@gomomento/sdk-core/dist/src/internal/clients/auth/AbstractAuthClient';
import {MomentoLogger, RefreshApiToken} from '.';
import {AuthClientProps} from './auth-client-props';
import {GenerateApiToken} from '@gomomento/sdk-core';

export class AuthClient extends AbstractAuthClient implements IAuthClient {
  private readonly logger: MomentoLogger;

  constructor(props: AuthClientProps) {
    const authClient = new InternalAuthClient({
      credentialProvider: props.credentialProvider,
      configuration: props.configuration,
    });

    super({createAuthClient: () => authClient});

    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.logger.info('Creating Momento AuthClient');
  }

  /**
   * Gets a api token, refresh token given a valid session token.
   *
   * @param {string} sessionToken - The session token to allow access for generation of api tokens.
   * @param {string} validForSeconds - How long the token is valid for in seconds.
   * @returns {Promise<GenerateApiToken.Response>} -
   * {@link GenerateApiToken.Success} containing the api token, refresh token, origin an how long the token is valid for.
   * {@link GenerateApiToken.Error} on failure.
   */
  public async generateApiToken(
    sessionToken: string,
    validForSeconds?: number
  ): Promise<GenerateApiToken.Response> {
    return await this.authClient.generateApiToken(
      sessionToken,
      validForSeconds
    );
  }

  /**
   * Refreshs a api token.
   *
   * @param {string} apiToken - The api token to be refreshed.
   * @param {string} refreshToken - Refresh token used to refresh the api token.
   * @returns {Promise<RefreshApiToken.Response>} -
   * {@link RefreshApiToken.Success} containing the new api token, refresh token, origin and how long the new token is valid for.
   * {@link RefreshApiToken.Error} on failure.
   */
  public async refreshApiToken(
    apiToken: string,
    refreshToken: string
  ): Promise<RefreshApiToken.Response> {
    return await this.authClient.refreshApiToken(apiToken, refreshToken);
  }
}
