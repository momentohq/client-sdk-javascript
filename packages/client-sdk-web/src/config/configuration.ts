import {MomentoLoggerFactory} from '../common/config/logging';

export interface ConfigurationProps {
  /**
   * Configures logging verbosity and format
   */
  loggerFactory: MomentoLoggerFactory;

  // TODO
  /**
   * Configures low-level options for network interactions with the Momento service
   */
  //   transportStrategy: TransportStrategy;
}

/**
 * Configuration options for Momento Simple Cache client.
 *
 * @export
 * @interface Configuration
 */
export interface Configuration {
  /**
   * @returns {MomentoLoggerFactory} the current configuration options for logging verbosity and format
   */
  getLoggerFactory(): MomentoLoggerFactory;

  // /**
  //  * @returns {TransportStrategy} the current configuration options for wire interactions with the Momento service
  //  */
  // getTransportStrategy(): TransportStrategy;

  // /**
  //  * Copy constructor for overriding TransportStrategy
  //  * @param {TransportStrategy} transportStrategy
  //  * @returns {Configuration} a new Configuration object with the specified TransportStrategy
  //  */
  // withTransportStrategy(transportStrategy: TransportStrategy): Configuration;

  // /**
  //  * Convenience copy constructor that updates the client-side timeout setting in the TransportStrategy
  //  * @param {number} clientTimeoutMillis
  //  * @returns {Configuration} a new Configuration object with its TransportStrategy updated to use the specified client timeout
  //  */
  // withClientTimeoutMillis(clientTimeoutMillis: number): Configuration;
}
