import {CredentialProvider} from './auth/credential-provider';
import {SimpleCacheConfiguration} from './config/configuration';

/**
 * @property {string} authToken - momento jwt token
 * @property {string} endpoint - endpoint to reach momento cache
 * @property {number} defaultTtlSeconds - the default time to live of object inside of cache, in seconds
 * @property {number} requestTimeoutMs - the amount of time for a request to complete before timing out, in milliseconds
 */
export interface SimpleCacheClientProps {
  configuration: SimpleCacheConfiguration;
  credentialProvider: CredentialProvider;
  defaultTtlSeconds: number;
}
