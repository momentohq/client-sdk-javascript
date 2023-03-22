import {CredentialProvider} from '@gomomento/common/dist/src/auth';
import {Configuration} from './config/configuration';

export interface CacheClientProps {
  /**
   * Configuration settings for the cache client
   */
  configuration: Configuration;
  /**
   * controls how the client will get authentication information for connecting to the Momento service
   */
  credentialProvider: CredentialProvider;
  /**
   * the default time to live of object inside of cache, in seconds
   */
  defaultTtlSeconds: number;
}

/**
 * @deprecated use {CacheClientProps} instead
 */
export type SimpleCacheClientProps = CacheClientProps;
