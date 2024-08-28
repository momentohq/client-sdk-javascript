import {
  AllEndpoints,
  decodeAuthToken,
  fromEntries,
  populateAllEndpointsFromBaseEndpoint,
} from '../internal/utils';

export interface BaseEndpointOverride {
  baseEndpoint: string;
  endpointPrefix?: string;
  secureConnection?: boolean;
}

export type EndpointOverrides = BaseEndpointOverride | AllEndpoints;

function isBaseEndpointOverride(
  endpointOverrides: EndpointOverrides
): endpointOverrides is BaseEndpointOverride {
  return (endpointOverrides as BaseEndpointOverride).baseEndpoint !== undefined;
}

function isAllEndpoints(
  endpointOverrides: EndpointOverrides
): endpointOverrides is AllEndpoints {
  const allEndpoints = endpointOverrides as AllEndpoints;
  return (
    allEndpoints.cacheEndpoint !== undefined &&
    allEndpoints.controlEndpoint !== undefined &&
    allEndpoints.tokenEndpoint !== undefined
  );
}

/**
 * Encapsulates arguments for instantiating an EnvMomentoTokenProvider
 */
interface CredentialProviderProps {
  endpointOverrides?: EndpointOverrides;
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
   * @returns {boolean} true if connecting to the control plane endpoint connection with TLS; false if not using TLS
   */
  abstract isControlEndpointSecure(): boolean;

  /**
   * @returns {string} The host which the Momento client will connect to for Momento data plane operations
   */
  abstract getCacheEndpoint(): string;

  /**
   * @returns {boolean} true if connecting to the data plane endpoint connection with TLS; false if not using TLS
   */
  abstract isCacheEndpointSecure(): boolean;

  /**
   * @returns {string} The host which the Momento client will connect to for Momento storage operations
   */
  abstract getStorageEndpoint(): string;

  /**
   * @returns {boolean} true if connecting to the storage endpoint connection with TLS; false if not using TLS
   */
  abstract isStorageEndpointSecure(): boolean;

  /**
   * @returns {string} The host which the Momento client will connect to for Momento token operations
   */
  abstract getTokenEndpoint(): string;

  /**
   * @returns {boolean} true if connecting to the token endpoint connection with TLS; false if not using TLS
   */
  abstract isTokenEndpointSecure(): boolean;

  /**
   * Modifies the instance of the credential provider to override endpoints to
   * allow insecure connections to the momento-local service for testing purposes
   */
  abstract withMomentoLocal(): CredentialProvider;

  /**
   * @returns {boolean} true if the endpoints were manually overridden at construction time; false otherwise
   */
  abstract areEndpointsOverridden(): boolean;

  static fromEnvironmentVariable(
    props: EnvMomentoTokenProviderProps | string
  ): CredentialProvider {
    return new EnvMomentoTokenProvider(props);
  }

  static fromEnvVar(
    props: EnvMomentoTokenProviderProps | string
  ): CredentialProvider {
    return new EnvMomentoTokenProvider(props);
  }

  static fromString(
    props: StringMomentoTokenProviderProps | string
  ): CredentialProvider {
    return new StringMomentoTokenProvider(props);
  }
}

abstract class CredentialProviderBase implements CredentialProvider {
  abstract getAuthToken(): string;

  abstract getCacheEndpoint(): string;

  abstract isCacheEndpointSecure(): boolean;

  abstract getControlEndpoint(): string;

  abstract isControlEndpointSecure(): boolean;

  abstract getStorageEndpoint(): string;

  abstract isStorageEndpointSecure(): boolean;

  abstract getTokenEndpoint(): string;

  abstract isTokenEndpointSecure(): boolean;

  abstract areEndpointsOverridden(): boolean;

  abstract withMomentoLocal(): CredentialProvider;

  valueOf(): object {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const entries = Object.entries(this).filter(([k]) => k !== 'authToken');
    const clone = fromEntries(entries);
    return clone.valueOf();
  }
}

export interface StringMomentoApiKeyProviderProps
  extends CredentialProviderProps {
  /**
   * apiKey the momento API key
   */
  apiKey: string;
}

export interface StringMomentoAuthTokenProviderProps
  extends CredentialProviderProps {
  /**
   * authToken the momento auth token
   */
  authToken: string;
}

export type StringMomentoTokenProviderProps =
  | StringMomentoApiKeyProviderProps
  | StringMomentoAuthTokenProviderProps;

/**
 * Reads and parses a momento auth token stored in a String
 * @export
 * @class StringMomentoTokenProvider
 */
export class StringMomentoTokenProvider extends CredentialProviderBase {
  private readonly apiKey: string;
  private readonly allEndpoints: AllEndpoints;
  private readonly endpointsOverridden: boolean;

  /**
   * @param {StringMomentoTokenProviderProps} props configuration options for the token provider
   */
  constructor(props: StringMomentoTokenProviderProps | string) {
    if (typeof props === 'string') {
      props = {apiKey: props};
    }
    super();
    let key: string;
    if ('authToken' in props) {
      key = props.authToken;
    } else if ('apiKey' in props) {
      key = props.apiKey;
    } else {
      throw new Error('Missing required property: authToken or apiKey');
    }
    const decodedToken = decodeAuthToken(key);
    this.apiKey = decodedToken.authToken;
    if (props.endpointOverrides === undefined) {
      this.endpointsOverridden = false;
      if (decodedToken.controlEndpoint === undefined) {
        throw new Error(
          'Malformed token; unable to determine control endpoint.  Depending on the type of token you are using, you may need to specify the controlEndpoint explicitly.'
        );
      }
      if (decodedToken.cacheEndpoint === undefined) {
        throw new Error(
          'Malformed token; unable to determine cache endpoint.  Depending on the type of token you are using, you may need to specify the cacheEndpoint explicitly.'
        );
      }
      if (decodedToken.tokenEndpoint === undefined) {
        throw new Error(
          'Malformed token; unable to determine token endpoint.  Depending on the type of token you are using, you may need to specify the tokenEndpoint explicitly.'
        );
      }
      if (decodedToken.storageEndpoint === undefined) {
        throw new Error(
          'Malformed token; unable to determine storage endpoint.  Depending on the type of token you are using, you may need to specify the storageEndpoint explicitly.'
        );
      }
      this.allEndpoints = {
        controlEndpoint: {
          endpoint: decodedToken.controlEndpoint,
        },
        cacheEndpoint: {
          endpoint: decodedToken.cacheEndpoint,
        },
        tokenEndpoint: {
          endpoint: decodedToken.tokenEndpoint,
        },
        storageEndpoint: {
          endpoint: decodedToken.storageEndpoint,
        },
      };
    } else if (isAllEndpoints(props.endpointOverrides)) {
      this.endpointsOverridden = true;
      this.allEndpoints = props.endpointOverrides;
    } else if (isBaseEndpointOverride(props.endpointOverrides)) {
      this.endpointsOverridden = true;
      this.allEndpoints = populateAllEndpointsFromBaseEndpoint(
        props.endpointOverrides
      );
    } else {
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `Unsupported endpointOverrides: ${props.endpointOverrides}`
      );
    }
  }

  getAuthToken(): string {
    return this.apiKey;
  }

  getCacheEndpoint(): string {
    return this.allEndpoints.cacheEndpoint.endpoint;
  }

  isCacheEndpointSecure(): boolean {
    if (this.allEndpoints.cacheEndpoint.secureConnection === undefined) {
      return true;
    }
    return this.allEndpoints.cacheEndpoint.secureConnection;
  }

  getControlEndpoint(): string {
    return this.allEndpoints.controlEndpoint.endpoint;
  }

  isControlEndpointSecure(): boolean {
    if (this.allEndpoints.controlEndpoint.secureConnection === undefined) {
      return true;
    }
    return this.allEndpoints.controlEndpoint.secureConnection;
  }

  getTokenEndpoint(): string {
    return this.allEndpoints.tokenEndpoint.endpoint;
  }

  isTokenEndpointSecure(): boolean {
    if (this.allEndpoints.tokenEndpoint.secureConnection === undefined) {
      return true;
    }
    return this.allEndpoints.tokenEndpoint.secureConnection;
  }

  getStorageEndpoint(): string {
    return this.allEndpoints.storageEndpoint.endpoint;
  }

  isStorageEndpointSecure(): boolean {
    if (this.allEndpoints.storageEndpoint.secureConnection === undefined) {
      return true;
    }
    return this.allEndpoints.storageEndpoint.secureConnection;
  }

  areEndpointsOverridden(): boolean {
    return this.endpointsOverridden;
  }

  withMomentoLocal(): CredentialProvider {
    const momentoLocalOverride = {
      endpoint: '127.0.0.1:8080',
      secureConnection: false,
    };
    return new StringMomentoTokenProvider({
      authToken: this.apiKey,
      endpointOverrides: {
        cacheEndpoint: momentoLocalOverride,
        controlEndpoint: momentoLocalOverride,
        tokenEndpoint: momentoLocalOverride,
        storageEndpoint: momentoLocalOverride,
      },
    });
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
  constructor(props: EnvMomentoTokenProviderProps | string) {
    if (typeof props === 'string') {
      props = {environmentVariableName: props};
    }
    const authToken = process.env[props.environmentVariableName];
    if (!authToken) {
      throw new Error(
        `Missing required environment variable ${props.environmentVariableName}`
      );
    }
    super({
      authToken: authToken,
      endpointOverrides: props.endpointOverrides,
    });
    this.environmentVariableName = props.environmentVariableName;
  }
}

export function getDefaultCredentialProvider(): CredentialProvider {
  return CredentialProvider.fromEnvVar('MOMENTO_API_KEY');
}
