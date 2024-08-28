import {CredentialProvider} from '.';
import {Configuration} from './config/configuration';

export interface CacheClientProps {
  /**
   * Configuration settings for the cache client
   */
  configuration?: Configuration;
  /**
   * controls how the client will get authentication information for connecting to the Momento service
   */
  credentialProvider?: CredentialProvider;
  /**
   * the default time to live of object inside of cache, in seconds
   */
  defaultTtlSeconds: number;
}

export interface EagerCacheClientProps extends CacheClientProps {
  /**
   * The time in seconds to wait for a client to establish a connection to Momento.
   *
   * The behavior to establish an eager connection is enabled by default. If this value is set, the client will eagerly
   * create its connection to Momento at construction. It will wait until the connection is established, or until the
   * timeout runs out. It the timeout runs out, the client will be valid to use, but it may still be connecting in the background.
   *
   * Override this value to 0 if you want to disable eager connections.
   */
  eagerConnectTimeout?: number;
}

/**
 * @deprecated use {CacheClientProps} instead
 */
export type SimpleCacheClientProps = CacheClientProps;
