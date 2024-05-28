import {
  LeaderboardClientConfiguration,
  LeaderboardConfiguration,
} from './leaderboard-configuration';
import {MomentoLoggerFactory} from '@gomomento/sdk-core';

import {
  GrpcConfiguration,
  StaticGrpcConfiguration,
  StaticTransportStrategy,
  TransportStrategy,
} from '../';
import {DefaultMomentoLoggerFactory} from './logging/default-momento-logger';
import {Middleware} from './middleware/middleware';

// 4 minutes.  We want to remain comfortably underneath the idle timeout for AWS NLB, which is 350s.
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
export class Laptop extends LeaderboardClientConfiguration {
  /**
   * Provides the latest recommended configuration for a laptop development environment.  NOTE: this configuration may
   * change in future releases to take advantage of improvements we identify for default configurations.
   * @param {MomentoLoggerFactory} [loggerFactory=defaultLoggerFactory]
   * @returns {LeaderboardConfiguration}
   */
  static latest(
    loggerFactory: MomentoLoggerFactory = defaultLoggerFactory
  ): LeaderboardConfiguration {
    return Laptop.v1(loggerFactory);
  }

  /**
   * Provides v1 recommended configuration for a laptop development environment.  This configuration is guaranteed not
   * to change in future releases of the Momento web SDK.
   * @param {MomentoLoggerFactory} [loggerFactory=defaultLoggerFactory]
   * @returns {LeaderboardConfiguration}
   */
  static v1(
    loggerFactory: MomentoLoggerFactory = defaultLoggerFactory
  ): LeaderboardConfiguration {
    const deadlineMillis = 15000;
    const grpcConfig: GrpcConfiguration = new StaticGrpcConfiguration({
      deadlineMillis: deadlineMillis,
      maxSessionMemoryMb: defaultMaxSessionMemoryMb,
      keepAlivePermitWithoutCalls: 1,
      keepAliveTimeMs: 5000,
      keepAliveTimeoutMs: 1000,
    });
    const transportStrategy: TransportStrategy = new StaticTransportStrategy({
      grpcConfiguration: grpcConfig,
      maxIdleMillis: defaultMaxIdleMillis,
    });
    return new Laptop({
      loggerFactory: loggerFactory,
      transportStrategy: transportStrategy,
      throwOnErrors: false,
      middlewares: defaultMiddlewares,
    });
  }
}
