import {MomentoLoggerFactory} from '@gomomento/sdk-core';
import {DefaultMomentoLoggerFactory} from './logging/default-momento-logger';
import {
  StorageClientConfiguration,
  StorageConfiguration,
} from './storage-configuration';

const defaultLoggerFactory: MomentoLoggerFactory =
  new DefaultMomentoLoggerFactory();

/**
 * Default config provides defaults suitable for most environments; prioritizes success of publishing and receiving messages.
 * @export
 * @class Default
 */
export class Default extends StorageClientConfiguration {
  /**
   * Provides the latest recommended configuration for a default environment.  NOTE: this configuration may
   * change in future releases to take advantage of improvements we identify for default configurations.
   * @param {MomentoLoggerFactory} [loggerFactory=defaultLoggerFactory]
   * @returns {StorageConfiguration}
   */
  static latest(
    loggerFactory: MomentoLoggerFactory = defaultLoggerFactory
  ): StorageConfiguration {
    return new StorageClientConfiguration({
      loggerFactory: loggerFactory,
      throwOnErrors: false,
    });
  }
}
