import {decodeJwt} from '../utils/jwt';

/**
 * Provides information that the SimpleCacheClient needs in order to establish a connection to and authenticate with
 * the Momento service.
 * @export
 * @interface CredentialProvider
 */
export interface CredentialProvider {
  /**
   * @returns {string} Auth token provided by user, required to authenticate with the service
   */
  getAuthToken(): string;

  /**
   * @returns {string} The host which the Momento client will connect to for Momento control plane operations
   */
  getControlEndpoint(): string;

  /**
   * @returns {string} The host which the Momento client will connect to for Momento data plane operations
   */
  getCacheEndpoint(): string;
}

/**
 * Reads and parses a momento auth token stored as an environment variable.
 * @export
 * @class EnvMomentoTokenProvider
 */
export class EnvMomentoTokenProvider implements CredentialProvider {
  private readonly authToken: string;
  private readonly controlEndpoint: string;
  private readonly cacheEndpoint: string;

  /**
   * @param {string} envVariableName the name of the environment variable from which the auth token will be read
   * @param {string} [controlEndpoint] optionally overrides the default controlEndpoint
   * @param {string} [cacheEndpoint] optionally overrides the default cacheEndpoint
   */
  constructor(
    envVariableName: string,
    controlEndpoint?: string,
    cacheEndpoint?: string
  ) {
    const authToken = process.env[envVariableName];
    if (!authToken) {
      throw new Error(
        `Missing required environment variable ${envVariableName}`
      );
    }
    this.authToken = authToken;
    const claims = decodeJwt(authToken);
    this.controlEndpoint = controlEndpoint ?? claims.cp;
    this.cacheEndpoint = cacheEndpoint ?? claims.c;
  }

  getAuthToken(): string {
    return this.authToken;
  }

  getCacheEndpoint(): string {
    return this.cacheEndpoint;
  }

  getControlEndpoint(): string {
    return this.controlEndpoint;
  }
}
