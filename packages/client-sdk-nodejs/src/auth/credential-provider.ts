import {
  decodeJwt,
  fromEntries,
} from '@gomomento/common/dist/src/internal/utils';

/**
 * Encapsulates arguments for instantiating an EnvMomentoTokenProvider
 */
interface CredentialProviderProps {
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
 * Provides information that the CacheClient needs in order to establish a connection to and authenticate with
 * the Momento service.
 * @export
 * @interface CredentialProvider
 */
export abstract class CredentialProvider {
  /**
   * @returns {string} Auth token provided by user, required to authenticate with the service
   */
  abstract getAuthToken(): string;

  /**
   * @returns {string} The host which the Momento client will connect to for Momento control plane operations
   */
  abstract getControlEndpoint(): string;

  /**
   * @returns {string} The host which the Momento client will connect to for Momento data plane operations
   */
  abstract getCacheEndpoint(): string;

  static fromEnvironmentVariable(
    props: EnvMomentoTokenProviderProps
  ): CredentialProvider {
    return new EnvMomentoTokenProvider(props);
  }

  static fromString(
    props: StringMomentoTokenProviderProps
  ): CredentialProvider {
    return new StringMomentoTokenProvider(props);
  }
}

abstract class CredentialProviderBase implements CredentialProvider {
  abstract getAuthToken(): string;

  abstract getCacheEndpoint(): string;

  abstract getControlEndpoint(): string;

  valueOf(): object {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const entries = Object.entries(this).filter(([k]) => k !== 'authToken');
    const clone = fromEntries(entries);
    return clone.valueOf();
  }
}

export interface StringMomentoTokenProviderProps
  extends CredentialProviderProps {
  /**
   * authToken the momento auth token
   */
  authToken: string;
}

/**
 * Reads and parses a momento auth token stored in a String
 * @export
 * @class StringMomentoTokenProvider
 */
export class StringMomentoTokenProvider extends CredentialProviderBase {
  private readonly authToken: string;
  private readonly controlEndpoint: string;
  private readonly cacheEndpoint: string;

  /**
   * @param {StringMomentoTokenProviderProps} props configuration options for the token provider
   */
  constructor(props: StringMomentoTokenProviderProps) {
    super();
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

export interface EnvMomentoTokenProviderProps extends CredentialProviderProps {
  /**
   * the name of the environment variable from which the auth token will be read
   */
  environmentVariableName: string;
}

/**
 * Reads and parses a momento auth token stored as an environment variable.
 * @export
 * @class EnvMomentoTokenProvider
 */
export class EnvMomentoTokenProvider extends StringMomentoTokenProvider {
  environmentVariableName: string;
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
    this.environmentVariableName = props.environmentVariableName;
  }
}
