import {
  Configurations,
  CacheConfiguration,
  FixedCountRetryStrategy,
  DefaultMomentoLoggerFactory,
  Middleware,
  StaticGrpcConfiguration,
  StaticTransportStrategy,
  StaticTopicGrpcConfiguration,
  TopicClientConfiguration,
  StaticTopicTransportStrategy,
} from '../../../src';
import {ReadConcern} from '@gomomento/sdk-core';

describe('configuration.ts', () => {
  const testLoggerFactory = new DefaultMomentoLoggerFactory();
  const testRetryStrategy = new FixedCountRetryStrategy({
    loggerFactory: testLoggerFactory,
    maxAttempts: 1,
  });
  const testGrpcConfiguration = new StaticGrpcConfiguration({
    deadlineMillis: 90210,
    maxSessionMemoryMb: 90211,
    numClients: 2,
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
    throwOnErrors: false,
    readConcern: ReadConcern.BALANCED,
    compression: undefined,
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
      numClients: 3,
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
        numClients: testGrpcConfiguration.getNumClients(),
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

  it('should support overriding throwOnErrors strategy', () => {
    const throwOnErrors = true;
    const configWithThrowOnErrors =
      testConfiguration.withThrowOnErrors(throwOnErrors);
    expect(configWithThrowOnErrors.getLoggerFactory()).toEqual(
      testLoggerFactory
    );
    expect(configWithThrowOnErrors.getRetryStrategy()).toEqual(
      testRetryStrategy
    );
    expect(configWithThrowOnErrors.getTransportStrategy()).toEqual(
      testTransportStrategy
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

describe('topic-configuration.ts', () => {
  const testLoggerFactory = new DefaultMomentoLoggerFactory();
  const testGrpcConfiguration = new StaticTopicGrpcConfiguration({
    deadlineMillis: 90210,
  });
  const testTransportStrategy = new StaticTopicTransportStrategy({
    grpcConfiguration: testGrpcConfiguration,
  });
  const testMiddlewares: Middleware[] = [];

  const testConfiguration = new TopicClientConfiguration({
    loggerFactory: testLoggerFactory,
    transportStrategy: testTransportStrategy,
    throwOnErrors: false,
    middlewares: testMiddlewares,
  });

  it('should support overriding client timeout in transport strategy', () => {
    const newClientTimeoutMillis = 42;
    const expectedTransportStrategy = new StaticTopicTransportStrategy({
      grpcConfiguration: new StaticTopicGrpcConfiguration({
        deadlineMillis: newClientTimeoutMillis,
      }),
    });
    const configWithNewClientTimeout =
      testConfiguration.withClientTimeoutMillis(newClientTimeoutMillis);
    expect(configWithNewClientTimeout.getLoggerFactory()).toEqual(
      testLoggerFactory
    );

    expect(configWithNewClientTimeout.getTransportStrategy()).toEqual(
      expectedTransportStrategy
    );
  });

  it('should support overriding number of clients in transport strategy', () => {
    const numClients = 8;
    const expectedTransportStrategy = new StaticTopicTransportStrategy({
      grpcConfiguration: new StaticTopicGrpcConfiguration({
        deadlineMillis: testGrpcConfiguration.getDeadlineMillis(),
        numClients: numClients,
        numStreamClients: testGrpcConfiguration.getNumStreamClients(),
        numUnaryClients: testGrpcConfiguration.getNumUnaryClients(),
      }),
    });
    const configWithNewNumberOfClients =
      testConfiguration.withNumConnections(numClients);
    expect(configWithNewNumberOfClients.getLoggerFactory()).toEqual(
      testLoggerFactory
    );

    expect(configWithNewNumberOfClients.getTransportStrategy()).toEqual(
      expectedTransportStrategy
    );
    expect(
      configWithNewNumberOfClients
        .getTransportStrategy()
        .getGrpcConfig()
        .getNumUnaryClients()
    ).toEqual(4); // default value
    expect(
      configWithNewNumberOfClients
        .getTransportStrategy()
        .getGrpcConfig()
        .getNumStreamClients()
    ).toEqual(4); // default value
  });

  it('should support overriding number of stream and unary clients in transport strategy', () => {
    const numStreamClients = 5;
    const numUnaryClients = 4;
    const expectedTransportStrategy = new StaticTopicTransportStrategy({
      grpcConfiguration: new StaticTopicGrpcConfiguration({
        deadlineMillis: testGrpcConfiguration.getDeadlineMillis(),
        numStreamClients: numStreamClients,
        numUnaryClients: numUnaryClients,
      }),
    });
    const configWithNewNumberOfClients = testConfiguration
      .withNumStreamConnections(numStreamClients)
      .withNumUnaryConnections(numUnaryClients);
    expect(configWithNewNumberOfClients.getLoggerFactory()).toEqual(
      testLoggerFactory
    );

    expect(configWithNewNumberOfClients.getTransportStrategy()).toEqual(
      expectedTransportStrategy
    );

    // numClients should be undefined since we are using the new methods
    expect(
      configWithNewNumberOfClients
        .getTransportStrategy()
        .getGrpcConfig()
        .getNumClients()
    ).toEqual(undefined);
  });
});
