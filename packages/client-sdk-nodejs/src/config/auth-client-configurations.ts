import {AuthClientConfiguration} from './auth-client-configuration';
import {MomentoLoggerFactory} from '@gomomento/sdk-core';
import {DefaultMomentoLoggerFactory} from './logging/default-momento-logger';

const defaultLoggerFactory: MomentoLoggerFactory =
  new DefaultMomentoLoggerFactory();

/**
 * Laptop config provides defaults suitable for a medium-to-high-latency dev environment.  Permissive timeouts, retries, and
 * relaxed latency and throughput targets.
 * @export
 * @class Laptop
 */
export class Default extends AuthClientConfiguration {
  /**
   * Provides the latest recommended configuration for a laptop development environment.  NOTE: this configuration may
   * change in future releases to take advantage of improvements we identify for default configurations.
   * @param {MomentoLoggerFactory} [loggerFactory=defaultLoggerFactory]
   * @returns {CacheConfiguration}
   */
  static latest(
    loggerFactory: MomentoLoggerFactory = defaultLoggerFactory
  ): AuthClientConfiguration {
    return new AuthClientConfiguration({
      loggerFactory: loggerFactory,
    });
  }
}
