import {
  StaticGrpcConfiguration,
  StaticTransportStrategy,
} from '../../../../src';

describe('StaticGrpcConfiguration', () => {
  const testDeadlineMillis = 90210;
  const testMaxSessionMemoryMb = 90211;
  const testNumClients = 4;
  const testGrpcConfiguration = new StaticGrpcConfiguration({
    deadlineMillis: testDeadlineMillis,
    maxSessionMemoryMb: testMaxSessionMemoryMb,
    numClients: testNumClients,
  });

  it('should support overriding deadline millis', () => {
    const newDeadlineMillis = 42;
    const configWithNewDeadline =
      testGrpcConfiguration.withDeadlineMillis(newDeadlineMillis);
    expect(configWithNewDeadline.getDeadlineMillis()).toEqual(
      newDeadlineMillis
    );
    expect(configWithNewDeadline.getMaxSessionMemoryMb()).toEqual(
      testMaxSessionMemoryMb
    );
  });

  it('should support overriding max session memory', () => {
    const newMaxSessionMemory = 42;
    const configWithNewMaxSessionMemory =
      testGrpcConfiguration.withMaxSessionMemoryMb(newMaxSessionMemory);
    expect(configWithNewMaxSessionMemory.getDeadlineMillis()).toEqual(
      testDeadlineMillis
    );
    expect(configWithNewMaxSessionMemory.getMaxSessionMemoryMb()).toEqual(
      newMaxSessionMemory
    );
  });

  it('should support overriding num clients', () => {
    const newNumClients = 9;
    const configWithNewDeadline =
      testGrpcConfiguration.withNumClients(newNumClients);
    expect(configWithNewDeadline.getNumClients()).toEqual(newNumClients);
    expect(configWithNewDeadline.getMaxSessionMemoryMb()).toEqual(
      testMaxSessionMemoryMb
    );
  });
});

describe('StaticTransportStrategy', () => {
  const testDeadlineMillis = 90210;
  const testMaxSessionMemoryMb = 90211;
  const testNumClients = 5;
  const testGrpcConfiguration = new StaticGrpcConfiguration({
    deadlineMillis: testDeadlineMillis,
    maxSessionMemoryMb: testMaxSessionMemoryMb,
    numClients: testNumClients,
  });

  const testMaxIdleMillis = 90212;
  const testTransportStrategy = new StaticTransportStrategy({
    grpcConfiguration: testGrpcConfiguration,
    maxIdleMillis: testMaxIdleMillis,
  });

  it('should support overriding grpc config', () => {
    const newDeadlineMillis = 42;
    const newMaxSessionMemoryMb = 43;
    const newGrpcConfig = new StaticGrpcConfiguration({
      deadlineMillis: newDeadlineMillis,
      maxSessionMemoryMb: newMaxSessionMemoryMb,
      numClients: testNumClients,
    });
    const strategyWithNewGrpcConfig =
      testTransportStrategy.withGrpcConfig(newGrpcConfig);
    expect(strategyWithNewGrpcConfig.getGrpcConfig()).toEqual(newGrpcConfig);
    expect(strategyWithNewGrpcConfig.getMaxIdleMillis()).toEqual(
      testMaxIdleMillis
    );
  });

  it('should support overriding max idle mills', () => {
    const newMaxIdleMillis = 42;
    const strategyWithNewMaxIdleMillis =
      testTransportStrategy.withMaxIdleMillis(newMaxIdleMillis);
    expect(strategyWithNewMaxIdleMillis.getGrpcConfig()).toEqual(
      testGrpcConfiguration
    );
    expect(strategyWithNewMaxIdleMillis.getMaxIdleMillis()).toEqual(
      newMaxIdleMillis
    );
  });

  it('should support overriding client timeout', () => {
    const newClientTimeout = 42;
    const expectedGrpcConfig = new StaticGrpcConfiguration({
      deadlineMillis: newClientTimeout,
      maxSessionMemoryMb: testMaxSessionMemoryMb,
      numClients: testNumClients,
    });
    const strategyWithNewClientTimeout =
      testTransportStrategy.withClientTimeoutMillis(newClientTimeout);
    expect(strategyWithNewClientTimeout.getGrpcConfig()).toEqual(
      expectedGrpcConfig
    );
    expect(strategyWithNewClientTimeout.getMaxIdleMillis()).toEqual(
      testMaxIdleMillis
    );
  });
});
