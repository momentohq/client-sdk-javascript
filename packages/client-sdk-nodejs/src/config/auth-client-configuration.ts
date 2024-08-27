import {MomentoLoggerFactory} from '@gomomento/sdk-core';

export interface AuthClientConfigurationProps {
  /**
   * Configures logging verbosity and format
   */
  loggerFactory: MomentoLoggerFactory;
}

/**
 * Configuration options for Momento CacheClient.
 *
 * @export
 * @interface Configuration
 */
export interface AuthConfiguration {
  /**
   * @returns {MomentoLoggerFactory} the current configuration options for logging verbosity and format
   */
  getLoggerFactory(): MomentoLoggerFactory;
}

export class AuthClientConfiguration implements AuthConfiguration {
  private readonly loggerFactory: MomentoLoggerFactory;

  constructor(props: AuthClientConfigurationProps) {
    this.loggerFactory = props.loggerFactory;
  }

  getLoggerFactory(): MomentoLoggerFactory {
    return this.loggerFactory;
  }
}
