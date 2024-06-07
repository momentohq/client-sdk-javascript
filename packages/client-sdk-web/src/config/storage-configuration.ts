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

  /**
   * @returns {boolean} Configures whether the client should return a Momento Error object or throw an exception when an error occurs. By default, this is set to false, and the client will return a Momento Error object on errors. Set it to true if you prefer for exceptions to be thrown.
   */
  getThrowOnErrors(): boolean;
}

export class StorageClientConfiguration implements StorageConfiguration {
  private readonly loggerFactory: MomentoLoggerFactory;

  constructor(props: StorageConfigurationProps) {
    this.loggerFactory = props.loggerFactory;
  }

  getLoggerFactory(): MomentoLoggerFactory {
    return this.loggerFactory;
  }

  getThrowOnErrors(): boolean {
    return false;
  }
}
