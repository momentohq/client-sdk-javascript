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

export class Laptop extends SimpleCacheConfiguration {
  static latest(loggerOptions: LoggerOptions = defaultLoggerOptions) {
    const maxIdleMillis = defaultMaxIdleMillis;
    const deadlineMilliseconds = 5000;
    const grpcConfig: GrpcConfiguration = new StaticGrpcConfiguration(
      deadlineMilliseconds,
      defaultMaxSessionMemoryMb
    );
    const transportStrategy: TransportStrategy = new StaticTransportStrategy(
      null,
      grpcConfig
    );
    return new Laptop(loggerOptions, transportStrategy, maxIdleMillis);
  }
}

class InRegionDefault extends SimpleCacheConfiguration {
  static latest(loggerOptions: LoggerOptions = defaultLoggerOptions) {
    const maxIdleMillis = defaultMaxIdleMillis;
    const deadlineMilliseconds = 1100;
    const grpcConfig: GrpcConfiguration = new StaticGrpcConfiguration(
      deadlineMilliseconds,
      defaultMaxSessionMemoryMb
    );
    const transportStrategy: TransportStrategy = new StaticTransportStrategy(
      null,
      grpcConfig
    );
    return new InRegionDefault(loggerOptions, transportStrategy, maxIdleMillis);
  }
}

class InRegionLowLatency extends SimpleCacheConfiguration {
  static latest(loggerOptions: LoggerOptions = defaultLoggerOptions) {
    const maxIdleMillis = defaultMaxIdleMillis;
    const deadlineMilliseconds = 500;
    const grpcConfig: GrpcConfiguration = new StaticGrpcConfiguration(
      deadlineMilliseconds,
      defaultMaxSessionMemoryMb
    );
    const transportStrategy: TransportStrategy = new StaticTransportStrategy(
      null,
      grpcConfig
    );
    return new InRegionDefault(loggerOptions, transportStrategy, maxIdleMillis);
  }
}

export class InRegion {
  static Default = InRegionDefault;
  static LowLatency = InRegionLowLatency;
}
