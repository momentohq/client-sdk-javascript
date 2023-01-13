import {SimpleCacheConfiguration} from './configuration';
import {
  TransportStrategy,
  StaticGrpcConfiguration,
  StaticTransportStrategy,
} from './transport/transport-strategy';
import {GrpcConfiguration} from './transport/grpc-configuration';
import {LogFormat, LoggerOptions, LogLevel} from '../utils/logging';

// 4 minutes.  We want to remain comfortably underneath the idle timeout for AWS NLB, which is 350s.
const defaultMaxIdleMillis = 4 * 60 * 1_000;
const defaultMaxSessionMemoryMb = 256;
const defaultLoggerOptions: LoggerOptions = {
  level: LogLevel.WARN,
  format: LogFormat.CONSOLE,
};

/**
 * Laptop config provides defaults suitable for a medium-to-high-latency dev environment.  Permissive timeouts, retries, and
 * relaxed latency and throughput targets.
 * @export
 * @class Laptop
 */
export class Laptop extends SimpleCacheConfiguration {
  /**
   * Provides the latest recommended configuration for a laptop development environment.
   * @param {LoggerOptions} [loggerOptions=defaultLoggerOptions]  if no options are provided, a sensible default will be used
   * @returns {Laptop}
   */
  static latest(loggerOptions: LoggerOptions = defaultLoggerOptions) {
    const maxIdleMillis = defaultMaxIdleMillis;
    const deadlineMilliseconds = 5000;
    const grpcConfig: GrpcConfiguration = new StaticGrpcConfiguration(
      deadlineMilliseconds,
      defaultMaxSessionMemoryMb
    );
    const transportStrategy: TransportStrategy = new StaticTransportStrategy(
      grpcConfig
    );
    return new Laptop(loggerOptions, transportStrategy, maxIdleMillis);
  }
}

class InRegionDefault extends SimpleCacheConfiguration {
  /**
   * Provides the latest recommended configuration for a low-latency in-region
   * environment.
   *
   * @param {LoggerOptions} [loggerOptions=defaultLoggerOptions]  if no options are provided, a sensible default will be used
   * @returns {InRegionDefault}
   */
  static latest(loggerOptions: LoggerOptions = defaultLoggerOptions) {
    const maxIdleMillis = defaultMaxIdleMillis;
    const deadlineMilliseconds = 1100;
    const grpcConfig: GrpcConfiguration = new StaticGrpcConfiguration(
      deadlineMilliseconds,
      defaultMaxSessionMemoryMb
    );
    const transportStrategy: TransportStrategy = new StaticTransportStrategy(
      grpcConfig
    );
    return new InRegionDefault(loggerOptions, transportStrategy, maxIdleMillis);
  }
}

class InRegionLowLatency extends SimpleCacheConfiguration {
  /**
   * Provides the latest recommended configuration for an InRegion environment.
   * @param {LoggerOptions} [loggerOptions=defaultLoggerOptions]  if no options are provided, a sensible default will be used
   * @returns {InRegionLowLatency}
   */
  static latest(loggerOptions: LoggerOptions = defaultLoggerOptions) {
    const maxIdleMillis = defaultMaxIdleMillis;
    const deadlineMilliseconds = 500;
    const grpcConfig: GrpcConfiguration = new StaticGrpcConfiguration(
      deadlineMilliseconds,
      defaultMaxSessionMemoryMb
    );
    const transportStrategy: TransportStrategy = new StaticTransportStrategy(
      grpcConfig
    );
    return new InRegionDefault(loggerOptions, transportStrategy, maxIdleMillis);
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
