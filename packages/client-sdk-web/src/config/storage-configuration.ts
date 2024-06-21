import {MomentoLoggerFactory} from '@gomomento/sdk-core';

export interface StorageConfigurationProps {
  /**
   * Configures logging verbosity and format
   */
  loggerFactory: MomentoLoggerFactory;
}

/**
 * Configuration options for Momento StorageClient
 *
 * @export
 * @interface StorageConfiguration
 */
export interface StorageConfiguration {
  /**
   * @returns {MomentoLoggerFactory} the current configuration options for logging verbosity and format
   */
  getLoggerFactory(): MomentoLoggerFactory;
}

export class StorageClientConfiguration implements StorageConfiguration {
  private readonly loggerFactory: MomentoLoggerFactory;

  constructor(props: StorageConfigurationProps) {
    this.loggerFactory = props.loggerFactory;
  }

  getLoggerFactory(): MomentoLoggerFactory {
    return this.loggerFactory;
  }
}
