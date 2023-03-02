import {SimpleCacheConfiguration} from './configuration';
import {
  TransportStrategy,
  StaticGrpcConfiguration,
  StaticTransportStrategy,
} from './transport/transport-strategy';
import {GrpcConfiguration} from './transport/grpc-configuration';
import {FixedCountRetryStrategy} from './retry/fixed-count-retry-strategy';
import {MomentoLoggerFactory} from './logging/momento-logger';
import {RetryStrategy} from './retry/retry-strategy';
import {DefaultMomentoLoggerFactory} from './logging/default-momento-logger';
import {Middleware} from './middleware/middleware';

// 4 minutes.  We want to remain comfortably underneath the idle timeout for AWS NLB, which is 350s.
const defaultMaxIdleMillis = 4 * 60 * 1_000;
const defaultMaxSessionMemoryMb = 256;
const defaultLoggerFactory: MomentoLoggerFactory =
  new DefaultMomentoLoggerFactory();
const defaultMiddlewares: Middleware[] = [];

function defaultRetryStrategy(
  loggerFactory: MomentoLoggerFactory
): RetryStrategy {
  return new FixedCountRetryStrategy({
    loggerFactory: loggerFactory,
    maxAttempts: 3,
  });
}

/**
 * Laptop config provides defaults suitable for a medium-to-high-latency dev environment.  Permissive timeouts, retries, and
 * relaxed latency and throughput targets.
 * @export
 * @class Laptop
 */
export class Laptop extends SimpleCacheConfiguration {
  /**
   * Provides the latest recommended configuration for a laptop development environment.  NOTE: this configuration may
   * change in future releases to take advantage of improvements we identify for default configurations.
   * @param {MomentoLoggerFactory} [loggerFactory=defaultLoggerFactory]
   * @returns {SimpleCacheConfiguration}
   */
  static latest(
    loggerFactory: MomentoLoggerFactory = defaultLoggerFactory
  ): SimpleCacheConfiguration {
    return Laptop.v1(loggerFactory);
  }

  /**
   * Provides v1 recommended configuration for a laptop development environment.  This configuration is guaranteed not
   * to change in future releases of the Momento node.js SDK.
   * @param {MomentoLoggerFactory} [loggerFactory=defaultLoggerFactory]
   * @returns {SimpleCacheConfiguration}
   */
  static v1(
    loggerFactory: MomentoLoggerFactory = defaultLoggerFactory
  ): SimpleCacheConfiguration {
    const deadlineMillis = 5000;
    const grpcConfig: GrpcConfiguration = new StaticGrpcConfiguration({
      deadlineMillis: deadlineMillis,
      maxSessionMemoryMb: defaultMaxSessionMemoryMb,
    });
    const transportStrategy: TransportStrategy = new StaticTransportStrategy({
      grpcConfiguration: grpcConfig,
      maxIdleMillis: defaultMaxIdleMillis,
    });
    return new Laptop({
      loggerFactory: loggerFactory,
      retryStrategy: defaultRetryStrategy(loggerFactory),
      transportStrategy: transportStrategy,
      middlewares: defaultMiddlewares,
    });
  }
}

class InRegionDefault extends SimpleCacheConfiguration {
  /**
   * Provides the latest recommended configuration for a typical in-region environment.  NOTE: this configuration may
   * change in future releases to take advantage of improvements we identify for default configurations.
   * @param {MomentoLoggerFactory} [loggerFactory=defaultLoggerFactory]
   * @returns {SimpleCacheConfiguration}
   */
  static latest(
    loggerFactory: MomentoLoggerFactory = defaultLoggerFactory
  ): SimpleCacheConfiguration {
    return InRegionDefault.v1(loggerFactory);
  }

  /**
   * Provides v1 recommended configuration for a typical in-region environment.  This configuration is guaranteed not
   * to change in future releases of the Momento node.js SDK.
   * @param {MomentoLoggerFactory} [loggerFactory=defaultLoggerFactory]
   * @returns {SimpleCacheConfiguration}
   */
  static v1(
    loggerFactory: MomentoLoggerFactory = defaultLoggerFactory
  ): SimpleCacheConfiguration {
    const deadlineMillis = 1100;
    const grpcConfig: GrpcConfiguration = new StaticGrpcConfiguration({
      deadlineMillis: deadlineMillis,
      maxSessionMemoryMb: defaultMaxSessionMemoryMb,
    });
    const transportStrategy: TransportStrategy = new StaticTransportStrategy({
      grpcConfiguration: grpcConfig,
      maxIdleMillis: defaultMaxIdleMillis,
    });
    return new InRegionDefault({
      loggerFactory: loggerFactory,
      retryStrategy: defaultRetryStrategy(loggerFactory),
      transportStrategy: transportStrategy,
      middlewares: defaultMiddlewares,
    });
  }
}

class InRegionLowLatency extends SimpleCacheConfiguration {
  /**
   * Provides the latest recommended configuration for an in-region environment with aggressive low-latency requirements.
   * NOTE: this configuration may change in future releases to take advantage of improvements we identify for default
   * configurations.
   * @param {MomentoLoggerFactory} [loggerFactory=defaultLoggerFactory]
   * @returns {SimpleCacheConfiguration}
   */
  static latest(
    loggerFactory: MomentoLoggerFactory = defaultLoggerFactory
  ): SimpleCacheConfiguration {
    return InRegionLowLatency.v1(loggerFactory);
  }

  /**
   * Provides v1 recommended configuration for an in-region environment with aggressive low-latency requirements.
   * This configuration is guaranteed not to change in future releases of the Momento node.js SDK.
   * @param {MomentoLoggerFactory} [loggerFactory=defaultLoggerFactory]
   * @returns {SimpleCacheConfiguration}
   */
  static v1(
    loggerFactory: MomentoLoggerFactory = defaultLoggerFactory
  ): SimpleCacheConfiguration {
    const deadlineMillis = 500;
    const grpcConfig: GrpcConfiguration = new StaticGrpcConfiguration({
      deadlineMillis: deadlineMillis,
      maxSessionMemoryMb: defaultMaxSessionMemoryMb,
    });
    const transportStrategy: TransportStrategy = new StaticTransportStrategy({
      grpcConfiguration: grpcConfig,
      maxIdleMillis: defaultMaxIdleMillis,
    });
    return new InRegionDefault({
      loggerFactory: loggerFactory,
      retryStrategy: defaultRetryStrategy(loggerFactory),
      transportStrategy: transportStrategy,
      middlewares: defaultMiddlewares,
    });
  }
}

/**
 * InRegion provides defaults suitable for an environment where your client is running in the same region as the Momento
 * service.  It has more aggressive timeouts and retry behavior than the Laptop config.
 * @export
 * @class InRegion
 */
export class InRegion {
  /**
   * This config prioritizes throughput and client resource utilization.  It has a slightly relaxed client-side timeout
   * setting to maximize throughput.
   * @type {InRegionDefault}
   */
  static Default = InRegionDefault;
  /**
   * This config prioritizes keeping p99.9 latencies as low as possible, potentially sacrificing
   * some throughput to achieve this.  It has a very aggressive client-side timeout.  Use this
   * configuration if the most important factor is to ensure that cache unavailability doesn't force
   * unacceptably high latencies for your own application.
   * @type {InRegionLowLatency}
   */
  static LowLatency = InRegionLowLatency;
}
