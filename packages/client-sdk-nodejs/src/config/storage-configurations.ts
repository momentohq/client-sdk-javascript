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
  StorageGrpcConfiguration,
  StorageTransportStrategy,
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
    return Laptop.v0(loggerFactory);
  }

  /**
   * Provides v0 recommended configuration for a laptop development environment.  This configuration is guaranteed not
   * to change in future releases of the Momento web SDK.
   * @param {MomentoLoggerFactory} [loggerFactory=defaultLoggerFactory]
   * @returns {StorageConfiguration}
   */
  static v0(
    loggerFactory: MomentoLoggerFactory = defaultLoggerFactory
  ): StorageConfiguration {
    const deadlineMillis = 5000;
    const grpcConfig: StorageGrpcConfiguration =
      new StaticStorageGrpcConfiguration({
        deadlineMillis,
        maxSessionMemoryMb: defaultMaxSessionMemoryMb,
      });
    const transportStrategy: StorageTransportStrategy =
      new StaticStorageTransportStrategy({
        grpcConfiguration: grpcConfig,
        maxIdleMillis: defaultMaxIdleMillis,
      });
    return new Laptop({
      loggerFactory: loggerFactory,
      transportStrategy: transportStrategy,
      middlewares: defaultMiddlewares,
      throwOnErrors: false,
    });
  }
}
