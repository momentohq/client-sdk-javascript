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
 * Encapsulates arguments for instantiating a StringMomentoTokenProvider
 */
export interface StringMomentoTokenProviderProps {
  /**
   * authToken the momento auth token
   */
  authToken: string;
  /**
   * optionally overrides the default controlEndpoint
   */
  controlEndpoint?: string;
  /**
   * optionally overrides the default cacheEndpoint
   */
  cacheEndpoint?: string;
}

/**
 * Reads and parses a momento auth token stored in a String
 * @export
 * @class EnvMomentoTokenProvider
 */
export class StringMomentoTokenProvider implements CredentialProvider {
  private readonly authToken: string;
  private readonly controlEndpoint: string;
  private readonly cacheEndpoint: string;

  /**
   * @param {StringMomentoTokenProviderProps} props configuration options for the token provider
   */
  constructor(props: StringMomentoTokenProviderProps) {
    this.authToken = props.authToken;
    const claims = decodeJwt(props.authToken);
    this.controlEndpoint = props.controlEndpoint ?? claims.cp;
    this.cacheEndpoint = props.cacheEndpoint ?? claims.c;
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

/**
 * Encapsulates arguments for instantiating an EnvMomentoTokenProvider
 */
export interface EnvMomentoTokenProviderProps {
  /**
   * the name of the environment variable from which the auth token will be read
   */
  environmentVariableName: string;
  /**
   * optionally overrides the default controlEndpoint
   */
  controlEndpoint?: string;
  /**
   * optionally overrides the default cacheEndpoint
   */
  cacheEndpoint?: string;
}

/**
 * Reads and parses a momento auth token stored as an environment variable.
 * @export
 * @class EnvMomentoTokenProvider
 */
export class EnvMomentoTokenProvider extends StringMomentoTokenProvider {
  /**
   * @param {EnvMomentoTokenProviderProps} props configuration options for the token provider
   */
  constructor(props: EnvMomentoTokenProviderProps) {
    const authToken = process.env[props.environmentVariableName];
    if (!authToken) {
      throw new Error(
        `Missing required environment variable ${props.environmentVariableName}`
      );
    }
    super({
      authToken: authToken,
      controlEndpoint: props.controlEndpoint,
      cacheEndpoint: props.cacheEndpoint,
    });
  }
}
