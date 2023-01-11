import {decodeJwt} from '../utils/jwt';

export interface CredentialProvider {
  getAuthToken(): string;

  getControlEndpoint(): string;

  getCacheEndpoint(): string;

  getTrustedControlEndpointCertificateName(): string | null;

  getTrustedCacheEndpointCertificateName(): string | null;
}

export class EnvMomentoTokenProvider implements CredentialProvider {
  private readonly authToken: string;
  private readonly controlEndpoint: string;
  private readonly cacheEndpoint: string;
  private readonly trustedControlEndpointCertificateName: string | null;
  private readonly trustedCacheEndpointCertificateName: string | null;
  constructor(
    envVariableName: string,
    controlEndpoint?: string | null,
    cacheEndpoint?: string | null,
    trustedControlEndpointCertificateName?: string | null,
    trustedCacheEndpointCertificateName?: string | null
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
    this.trustedCacheEndpointCertificateName =
      trustedCacheEndpointCertificateName || null;
    this.trustedControlEndpointCertificateName =
      trustedControlEndpointCertificateName || null;
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

  getTrustedControlEndpointCertificateName(): string | null {
    return this.trustedControlEndpointCertificateName;
  }

  getTrustedCacheEndpointCertificateName(): string | null {
    return this.trustedCacheEndpointCertificateName;
  }
}
