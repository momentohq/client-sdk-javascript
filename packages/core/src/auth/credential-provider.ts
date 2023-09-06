import {decodeAuthToken, fromEntries} from '../internal/utils';

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
  /**
   * optionally overrides the default vectorEndpoint
   */
  tokenEndpoint?: string;
  /**
   * optionally overrides the default vectorEndpoint
   */
  vectorEndpoint?: string;
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

  /**
   * @returns {string} The host which the Momento client will connect to for Momento token operations
   */
  abstract getTokenEndpoint(): string;

  /**
   * @returns {string} The host which the Momento client will connect to for Momento vector index operations
   */
  abstract getVectorEndpoint(): string;

  /**
   * @returns {boolean} true if the cache endpoint was manually overridden at construction time; false otherwise
   */
  abstract isCacheEndpointOverridden(): boolean;

  /**
   * @returns {boolean} true if the control endpoint was manually overridden at construction time; false otherwise
   */
  abstract isControlEndpointOverridden(): boolean;

  /**
   * @returns {boolean} true if the token endpoint was manually overridden at construction time; false otherwise
   */
  abstract isTokenEndpointOverridden(): boolean;

  /**
   * @returns {boolean} true if the vector endpoint was manually overridden at construction time; false otherwise
   */
  abstract isVectorEndpointOverridden(): boolean;

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

  abstract getTokenEndpoint(): string;

  abstract getVectorEndpoint(): string;

  abstract isCacheEndpointOverridden(): boolean;
  abstract isControlEndpointOverridden(): boolean;
  abstract isTokenEndpointOverridden(): boolean;
  abstract isVectorEndpointOverridden(): boolean;

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
  private readonly tokenEndpoint: string;
  private readonly vectorEndpoint: string;
  private readonly controlEndpointOverridden: boolean;
  private readonly cacheEndpointOverridden: boolean;
  private readonly tokenEndpointOverridden: boolean;
  private readonly vectorEndpointOverridden: boolean;

  /**
   * @param {StringMomentoTokenProviderProps} props configuration options for the token provider
   */
  constructor(props: StringMomentoTokenProviderProps) {
    super();
    const decodedToken = decodeAuthToken(props.authToken);
    this.authToken = decodedToken.authToken;
    this.controlEndpointOverridden = props.controlEndpoint !== undefined;
    const controlEndpoint =
      props.controlEndpoint ?? decodedToken.controlEndpoint;
    if (controlEndpoint === undefined) {
      throw new Error(
        'Malformed token; unable to determine control endpoint.  Depending on the type of token you are using, you may need to specify the controlEndpoint explicitly.'
      );
    }
    this.cacheEndpointOverridden = props.cacheEndpoint !== undefined;
    const cacheEndpoint = props.cacheEndpoint ?? decodedToken.cacheEndpoint;
    if (cacheEndpoint === undefined) {
      throw new Error(
        'Malformed token; unable to determine cache endpoint.  Depending on the type of token you are using, you may need to specify the cacheEndpoint explicitly.'
      );
    }

    this.tokenEndpointOverridden = props.tokenEndpoint !== undefined;
    const tokenEndpoint = props.tokenEndpoint ?? decodedToken.tokenEndpoint;
    if (tokenEndpoint === undefined) {
      throw new Error(
        'Malformed token; unable to determine token endpoint.  Depending on the type of token you are using, you may need to specify the tokenEndpoint explicitly.'
      );
    }

    this.vectorEndpointOverridden = props.vectorEndpoint !== undefined;
    const vectorEndpoint = props.vectorEndpoint ?? decodedToken.vectorEndpoint;
    if (vectorEndpoint === undefined) {
      throw new Error(
        'Malformed token; unable to determine vector endpoint.  Depending on the type of token you are using, you may need to specify the vectorEndpoint explicitly.'
      );
    }

    this.controlEndpoint = controlEndpoint;
    this.cacheEndpoint = cacheEndpoint;
    this.tokenEndpoint = decodedToken.tokenEndpoint || cacheEndpoint;
    this.vectorEndpoint = vectorEndpoint;
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

  getTokenEndpoint(): string {
    return this.tokenEndpoint;
  }

  getVectorEndpoint(): string {
    return this.vectorEndpoint;
  }

  isControlEndpointOverridden(): boolean {
    return this.controlEndpointOverridden;
  }

  isCacheEndpointOverridden(): boolean {
    return this.cacheEndpointOverridden;
  }

  isTokenEndpointOverridden(): boolean {
    return this.tokenEndpointOverridden;
  }

  isVectorEndpointOverridden(): boolean {
    return this.vectorEndpointOverridden;
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
      tokenEndpoint: props.tokenEndpoint,
      vectorEndpoint: props.vectorEndpoint,
    });
    this.environmentVariableName = props.environmentVariableName;
  }
}
