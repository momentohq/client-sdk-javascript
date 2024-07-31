import {Status} from '@grpc/grpc-js/build/src/constants';
import {
  ClientMethodDefinition,
  Deserialize,
  Serialize,
} from '@grpc/grpc-js/build/src/make-client';
import {
  DefaultMomentoLoggerFactory,
  FixedCountRetryStrategy,
  StaticStorageGrpcConfiguration,
  StaticStorageTransportStrategy,
  StorageClientConfiguration,
} from '../../src';
import {DefaultStorageRetryStrategy} from '../../src/config/retry/storage-default-retry-strategy';
import {Metadata, StatusObject} from '@grpc/grpc-js';

describe('storage configuration', () => {
  const testLoggerFactory = new DefaultMomentoLoggerFactory();
  const testGrpcConfiguration = new StaticStorageGrpcConfiguration({
    deadlineMillis: 5000,
  });
  const testTransportStrategy = new StaticStorageTransportStrategy({
    grpcConfiguration: testGrpcConfiguration,
    responseDataReceivedTimeout: 1000,
  });
  const testRetryStrategy = new DefaultStorageRetryStrategy({
    loggerFactory: testLoggerFactory,
  });
  const testConfiguration = new StorageClientConfiguration({
    loggerFactory: testLoggerFactory,
    transportStrategy: testTransportStrategy,
    retryStrategy: testRetryStrategy,
  });

  it('should support overriding retry strategy', () => {
    const newRetryStrategy = new FixedCountRetryStrategy({
      loggerFactory: testLoggerFactory,
      maxAttempts: 2,
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
    const newTransportStrategy = new StaticStorageTransportStrategy({
      grpcConfiguration: testGrpcConfiguration,
      responseDataReceivedTimeout: 5000,
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

  it('default storage retry strategy retries when eligible', () => {
    function testSerialize(value: string): Buffer {
      return Buffer.from(value);
    }
    const sFunc: Serialize<string> = testSerialize;

    function TestDeserialize(bytes: Buffer): string {
      return bytes.toString();
    }
    const dFunc: Deserialize<string> = TestDeserialize;

    const testClientRequest: ClientMethodDefinition<string, string> = {
      path: '/store.Store/Put',
      requestStream: false,
      responseStream: false,
      requestSerialize: sFunc,
      responseDeserialize: dFunc,
    };

    const testGrpcStatusDeadlineExceeded: StatusObject = {
      code: Status.DEADLINE_EXCEEDED,
      details: 'deadline exceeded',
      metadata: new Metadata(),
    };
    expect(
      testRetryStrategy
        .determineWhenToRetryRequest({
          grpcStatus: testGrpcStatusDeadlineExceeded,
          grpcRequest: testClientRequest as ClientMethodDefinition<
            unknown,
            unknown
          >,
          attemptNumber: 1,
        })
        ?.valueOf()
    ).toEqual(100); // will retry after 100ms

    const testGrpcStatusInternalError = {
      code: Status.INTERNAL,
      details: 'internal server error',
      metadata: new Metadata(),
    };
    expect(
      testRetryStrategy
        .determineWhenToRetryRequest({
          grpcStatus: testGrpcStatusInternalError,
          grpcRequest: testClientRequest as ClientMethodDefinition<
            unknown,
            unknown
          >,
          attemptNumber: 1,
        })
        ?.valueOf()
    ).toEqual(100); // will retry after 100ms

    const testGrpcStatusUnavailable = {
      code: Status.UNAVAILABLE,
      details: 'server unavailable',
      metadata: new Metadata(),
    };
    expect(
      testRetryStrategy
        .determineWhenToRetryRequest({
          grpcStatus: testGrpcStatusUnavailable,
          grpcRequest: testClientRequest as ClientMethodDefinition<
            unknown,
            unknown
          >,
          attemptNumber: 1,
        })
        ?.valueOf()
    ).toEqual(100); // will retry after 100ms

    const testGrpcStatusCancelled = {
      code: Status.CANCELLED,
      details: 'cancelled',
      metadata: new Metadata(),
    };
    expect(
      testRetryStrategy.determineWhenToRetryRequest({
        grpcStatus: testGrpcStatusCancelled,
        grpcRequest: testClientRequest as ClientMethodDefinition<
          unknown,
          unknown
        >,
        attemptNumber: 1,
      })
    ).toBeNull(); // will not retry
  });
});
