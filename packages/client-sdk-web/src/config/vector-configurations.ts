import {VectorConfiguration} from './vector-configuration';
import {MomentoLoggerFactory} from '@gomomento/sdk-core';

import {
  GrpcConfiguration,
  StaticGrpcConfiguration,
  StaticTransportStrategy,
  TransportStrategy,
} from './transport';
import {DefaultMomentoLoggerFactory} from './logging/default-momento-logger';

const defaultLoggerFactory: MomentoLoggerFactory =
  new DefaultMomentoLoggerFactory();

/**
 * Laptop config provides defaults suitable for a medium-to-high-latency dev environment.
 * @export
 * @class Laptop
 */
export class Laptop extends VectorConfiguration {
  /**
   * Provides the latest recommended configuration for a laptop development environment.  NOTE: this configuration may
   * change in future releases to take advantage of improvements we identify for default configurations.
   * @param {MomentoLoggerFactory} [loggerFactory=defaultLoggerFactory]
   * @returns {VectorConfiguration}
   */
  static latest(
    loggerFactory: MomentoLoggerFactory = defaultLoggerFactory
  ): VectorConfiguration {
    return Laptop.v1(loggerFactory);
  }

  /**
   * Provides v1 recommended configuration for a laptop development environment.  This configuration is guaranteed not
   * to change in future releases of the Momento web SDK.
   * @param {MomentoLoggerFactory} [loggerFactory=defaultLoggerFactory]
   * @returns {VectorConfiguration}
   */
  static v1(
    loggerFactory: MomentoLoggerFactory = defaultLoggerFactory
  ): VectorConfiguration {
    const deadlineMillis = 5000;
    const grpcConfig: GrpcConfiguration = new StaticGrpcConfiguration({
      deadlineMillis: deadlineMillis,
    });
    const transportStrategy: TransportStrategy = new StaticTransportStrategy({
      grpcConfiguration: grpcConfig,
    });
    return new Laptop({
      loggerFactory: loggerFactory,
      transportStrategy: transportStrategy,
    });
  }
}

/**
 * Browser config provides defaults suitable for use in a web browser.
 * @export
 * @class Browser
 */
export class Browser extends VectorConfiguration {
  /**
   * Provides the latest recommended configuration for an in-browser environment.  NOTE: this configuration may
   * change in future releases to take advantage of improvements we identify for default configurations.
   * @param {MomentoLoggerFactory} [loggerFactory=defaultLoggerFactory]
   * @returns {VectorConfiguration}
   */
  static latest(
    loggerFactory: MomentoLoggerFactory = defaultLoggerFactory
  ): VectorConfiguration {
    return Browser.v1(loggerFactory);
  }

  /**
   * Provides v1 recommended configuration for an in-browser environment.  This configuration is guaranteed not
   * to change in future releases of the Momento web SDK.
   * @param {MomentoLoggerFactory} [loggerFactory=defaultLoggerFactory]
   * @returns {VectorConfiguration}
   */
  static v1(
    loggerFactory: MomentoLoggerFactory = defaultLoggerFactory
  ): VectorConfiguration {
    const deadlineMillis = 5000;
    const grpcConfig: GrpcConfiguration = new StaticGrpcConfiguration({
      deadlineMillis: deadlineMillis,
    });
    const transportStrategy: TransportStrategy = new StaticTransportStrategy({
      grpcConfiguration: grpcConfig,
    });
    return new Browser({
      loggerFactory: loggerFactory,
      transportStrategy: transportStrategy,
    });
  }
}
