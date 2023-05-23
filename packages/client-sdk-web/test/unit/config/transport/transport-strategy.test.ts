import {
  StaticGrpcConfiguration,
  StaticTransportStrategy,
} from '../../../../src/config/transport';

describe('StaticGrpcConfiguration', () => {
  const testDeadlineMillis = 90210;
  const testGrpcConfiguration = new StaticGrpcConfiguration({
    deadlineMillis: testDeadlineMillis,
  });

  it('should support overriding deadline millis', () => {
    const newDeadlineMillis = 42;
    const configWithNewDeadline =
      testGrpcConfiguration.withDeadlineMillis(newDeadlineMillis);
    expect(configWithNewDeadline.getDeadlineMillis()).toEqual(
      newDeadlineMillis
    );
  });
});

describe('StaticTransportStrategy', () => {
  const testDeadlineMillis = 90210;
  const testGrpcConfiguration = new StaticGrpcConfiguration({
    deadlineMillis: testDeadlineMillis,
  });

  const testTransportStrategy = new StaticTransportStrategy({
    grpcConfiguration: testGrpcConfiguration,
  });

  it('should support overriding grpc config', () => {
    const newDeadlineMillis = 42;
    const newGrpcConfig = new StaticGrpcConfiguration({
      deadlineMillis: newDeadlineMillis,
    });
    const strategyWithNewGrpcConfig =
      testTransportStrategy.withGrpcConfig(newGrpcConfig);
    expect(strategyWithNewGrpcConfig.getGrpcConfig()).toEqual(newGrpcConfig);
  });

  it('should support overriding client timeout', () => {
    const newClientTimeout = 42;
    const expectedGrpcConfig = new StaticGrpcConfiguration({
      deadlineMillis: newClientTimeout,
    });
    const strategyWithNewClientTimeout =
      testTransportStrategy.withClientTimeoutMillis(newClientTimeout);
    expect(strategyWithNewClientTimeout.getGrpcConfig()).toEqual(
      expectedGrpcConfig
    );
  });
});
