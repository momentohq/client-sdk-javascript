import {MomentoLoggerFactory} from '@gomomento/sdk-core';

export interface TopicConfigurationProps {
  /**
   * Configures logging verbosity and format
   */
  loggerFactory: MomentoLoggerFactory;

  /**
   * Configures whether the client should return a Momento Error object or throw an exception when an error occurs.
   */
  throwOnErrors: boolean;
}

/**
 * Configuration options for Momento TopicClient
 *
 * @export
 * @interface TopicConfiguration
 */
export interface TopicConfiguration {
  /**
   * @returns {MomentoLoggerFactory} the current configuration options for logging verbosity and format
   */
  getLoggerFactory(): MomentoLoggerFactory;

  /**
   * @returns {boolean} Configures whether the client should return a Momento Error object or throw an exception when an
   * error occurs. By default, this is set to false, and the client will return a Momento Error object on errors. Set it
   * to true if you prefer for exceptions to be thrown.
   */
  getThrowOnErrors(): boolean;

  /**
   * Copy constructor for configuring whether the client should return a Momento Error object or throw an exception when an
   * error occurs. By default, this is set to false, and the client will return a Momento Error object on errors. Set it
   * to true if you prefer for exceptions to be thrown.
   * @param {boolean} throwOnErrors
   * @returns {Configuration} a new Configuration object with the specified throwOnErrors setting
   */
  withThrowOnErrors(throwOnErrors: boolean): TopicConfiguration;
}

export class TopicClientConfiguration implements TopicConfiguration {
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly throwOnErrors: boolean;

  constructor(props: TopicConfigurationProps) {
    this.loggerFactory = props.loggerFactory;
    this.throwOnErrors = props.throwOnErrors;
  }

  getLoggerFactory(): MomentoLoggerFactory {
    return this.loggerFactory;
  }

  getThrowOnErrors(): boolean {
    return this.throwOnErrors;
  }

  withThrowOnErrors(throwOnErrors: boolean): TopicConfiguration {
    return new TopicClientConfiguration({
      loggerFactory: this.loggerFactory,
      throwOnErrors: throwOnErrors,
    });
  }
}
