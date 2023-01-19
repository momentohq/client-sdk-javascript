import {SimpleCacheConfiguration} from '../../src/config/configuration';
import {LogFormat, LoggerOptions, LogLevel} from '../../src';
import {
  StaticGrpcConfiguration,
  StaticTransportStrategy,
} from '../../src/config/transport/transport-strategy';

describe('configuration.ts', () => {
  const testLoggerOptions: LoggerOptions = {
    level: LogLevel.WARN,
    format: LogFormat.CONSOLE,
  };
  const testGrpcConfiguration = new StaticGrpcConfiguration({
    deadlineMillis: 90210,
    maxSessionMemoryMb: 90211,
  });
  const testMaxIdleMillis = 90212;
  const testTransportStrategy = new StaticTransportStrategy({
    grpcConfiguration: testGrpcConfiguration,
    maxIdleMillis: testMaxIdleMillis,
  });
  const testConfiguration = new SimpleCacheConfiguration({
    loggerOptions: testLoggerOptions,
    transportStrategy: testTransportStrategy,
  });

  it('should support overriding logger options', () => {
    const newLoggerOptions = {
      level: LogLevel.DEBUG,
      format: LogFormat.JSON,
    };
    const configWithNewLoggerOptions =
      testConfiguration.withLoggerOptions(newLoggerOptions);
    expect(configWithNewLoggerOptions.getLoggerOptions()).toEqual(
      newLoggerOptions
    );
    expect(configWithNewLoggerOptions.getTransportStrategy()).toEqual(
      testTransportStrategy
    );
  });

  it('should support overriding transport strategy', () => {
    const newGrpcConfiguration = new StaticGrpcConfiguration({
      deadlineMillis: 5000,
      maxSessionMemoryMb: 5001,
    });
    const newMaxIdleMillis = 5002;
    const newTransportStrategy = new StaticTransportStrategy({
      grpcConfiguration: newGrpcConfiguration,
      maxIdleMillis: newMaxIdleMillis,
    });
    const configWithNewTransportStrategy =
      testConfiguration.withTransportStrategy(newTransportStrategy);
    expect(configWithNewTransportStrategy.getLoggerOptions()).toEqual(
      testLoggerOptions
    );
    expect(configWithNewTransportStrategy.getTransportStrategy()).toEqual(
      newTransportStrategy
    );
  });

  it('should support overriding client timeout in transport strategy', () => {
    const newClientTimeoutMillis = 42;
    const expectedTransportStrategy = new StaticTransportStrategy({
      grpcConfiguration: new StaticGrpcConfiguration({
        deadlineMillis: newClientTimeoutMillis,
        maxSessionMemoryMb: testGrpcConfiguration.getMaxSessionMemoryMb(),
      }),
      maxIdleMillis: testMaxIdleMillis,
    });
    const configWithNewClientTimeout =
      testConfiguration.withClientTimeoutMillis(newClientTimeoutMillis);
    expect(configWithNewClientTimeout.getLoggerOptions()).toEqual(
      testLoggerOptions
    );
    expect(configWithNewClientTimeout.getTransportStrategy()).toEqual(
      expectedTransportStrategy
    );
  });
});
