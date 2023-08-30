import {MomentoLoggerFactory} from '@gomomento/sdk-core';

export interface TopicConfigurationProps {
  /**
   * Configures logging verbosity and format
   */
  loggerFactory: MomentoLoggerFactory;
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
}

export class TopicClientConfiguration implements TopicConfiguration {
  private readonly loggerFactory: MomentoLoggerFactory;

  constructor(props: TopicConfigurationProps) {
    this.loggerFactory = props.loggerFactory;
  }

  getLoggerFactory(): MomentoLoggerFactory {
    return this.loggerFactory;
  }
}
