import {CacheConfiguration} from '../../../src/config/configuration';
import {
  StaticGrpcConfiguration,
  StaticTransportStrategy,
} from '../../../src/config/transport/transport-strategy';
import {FixedCountRetryStrategy} from '../../../src/config/retry/fixed-count-retry-strategy';
import {DefaultMomentoLoggerFactory, Configurations} from '../../../src';
import {Middleware} from '../../../src/config/middleware/middleware';

describe('configuration.ts', () => {
  const testLoggerFactory = new DefaultMomentoLoggerFactory();
  const testRetryStrategy = new FixedCountRetryStrategy({
    loggerFactory: testLoggerFactory,
    maxAttempts: 1,
  });
  const testGrpcConfiguration = new StaticGrpcConfiguration({
    deadlineMillis: 90210,
    maxSessionMemoryMb: 90211,
  });
  const testMaxIdleMillis = 90212;
  const testTransportStrategy = new StaticTransportStrategy({
    grpcConfiguration: testGrpcConfiguration,
    maxIdleMillis: testMaxIdleMillis,
  });
  const testMiddlewares: Middleware[] = [];
  const testConfiguration = new CacheConfiguration({
    loggerFactory: testLoggerFactory,
    retryStrategy: testRetryStrategy,
    transportStrategy: testTransportStrategy,
    middlewares: testMiddlewares,
  });

  it('should support overriding retry strategy', () => {
    const newRetryStrategy = new FixedCountRetryStrategy({
      loggerFactory: testLoggerFactory,
      maxAttempts: 42,
    });
    const configWithNewRetryStrategy =
      testConfiguration.withRetryStrategy(newRetryStrategy);
    expect(configWithNewRetryStrategy.getLoggerFactory()).toEqual(
      testLoggerFactory
    );
    expect(configWithNewRetryStrategy.getRetryStrategy()).toEqual(
      newRetryStrategy
    );
    expect(configWithNewRetryStrategy.getTransportStrategy()).toEqual(
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
    expect(configWithNewTransportStrategy.getLoggerFactory()).toEqual(
      testLoggerFactory
    );
    expect(configWithNewTransportStrategy.getRetryStrategy()).toEqual(
      testRetryStrategy
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
    expect(configWithNewClientTimeout.getLoggerFactory()).toEqual(
      testLoggerFactory
    );
    expect(configWithNewClientTimeout.getRetryStrategy()).toEqual(
      testRetryStrategy
    );
    expect(configWithNewClientTimeout.getTransportStrategy()).toEqual(
      expectedTransportStrategy
    );
  });

  it('should make v1 laptop config available via latest alias', () => {
    expect(Configurations.Laptop.latest()).toEqual(Configurations.Laptop.v1());
  });
  it('should make v1 inregion default config available via latest alias', () => {
    expect(Configurations.InRegion.Default.latest()).toEqual(
      Configurations.InRegion.Default.v1()
    );
  });
  it('should make v1 inregion low latency config available via latest alias', () => {
    expect(Configurations.InRegion.LowLatency.latest()).toEqual(
      Configurations.InRegion.LowLatency.v1()
    );
  });
});
