import {MomentoLoggerFactory} from '@gomomento/sdk-core';
import {DefaultMomentoLoggerFactory} from './logging/default-momento-logger';
import {Middleware} from './middleware/middleware';
import {
  StorageClientConfiguration,
  StorageConfiguration,
} from './storage-configuration';
import {
  StaticStorageGrpcConfiguration,
  StaticStorageTransportStrategy,
} from './transport/storage';

const defaultMaxIdleMillis = 4 * 60 * 1_000;
const defaultMaxSessionMemoryMb = 256;
const defaultLoggerFactory: MomentoLoggerFactory =
  new DefaultMomentoLoggerFactory();
const defaultMiddlewares: Middleware[] = [];

/**
 * Laptop config provides defaults suitable for a medium-to-high-latency dev environment.
 * @export
 * @class Laptop
 */
export class Laptop extends StorageClientConfiguration {
  /**
   * Provides the latest recommended configuration for a laptop development environment.  NOTE: this configuration may
   * change in future releases to take advantage of improvements we identify for default configurations.
   * @param {MomentoLoggerFactory} [loggerFactory=defaultLoggerFactory]
   * @returns {StorageConfiguration}
   */
  static latest(
    loggerFactory: MomentoLoggerFactory = defaultLoggerFactory
  ): StorageConfiguration {
    return new StorageClientConfiguration({
      loggerFactory: loggerFactory,
      transportStrategy: new StaticStorageTransportStrategy({
        grpcConfiguration: new StaticStorageGrpcConfiguration({
          deadlineMillis: 5000,
          maxSessionMemoryMb: defaultMaxSessionMemoryMb,
        }),
        maxIdleMillis: defaultMaxIdleMillis,
      }),
      middlewares: defaultMiddlewares,
      throwOnErrors: false,
    });
  }
}
