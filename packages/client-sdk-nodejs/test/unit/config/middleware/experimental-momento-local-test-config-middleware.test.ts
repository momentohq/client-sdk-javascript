import {Metadata} from '@grpc/grpc-js';
import {
  ExperimentalMomentoLocalTestConfigMetadata,
  ExperimentalMomentoLocalTestConfigMiddleware,
} from '../../../../src/config/middleware/experimental-momento-local-test-config-middleware';
import {v4} from 'uuid';
import {MiddlewareMetadata} from '../../../../src/config/middleware/middleware';
import {MomentoRPCMethod} from '../../../../src/config/retry/momento-rpc-method';
import {MomentoErrorCode} from '@gomomento/sdk-core';

describe('ExperimentalMomentoLocalTestConfigMiddleware', () => {
  let middleware: ExperimentalMomentoLocalTestConfigMiddleware;
  let metadata: ExperimentalMomentoLocalTestConfigMetadata;

  beforeEach(() => {
    metadata = {
      requestId: v4(),
      returnError: MomentoErrorCode.SERVER_UNAVAILABLE,
      errorRpcs: [MomentoRPCMethod.Get],
      errorCount: 1,
      delayRpcs: [MomentoRPCMethod.Get],
      delayMs: 1000,
      delayCount: 1,
      streamErrorRpcs: [MomentoRPCMethod.TopicSubscribe],
      streamError: MomentoErrorCode.SERVER_UNAVAILABLE,
      streamErrorMessageLimit: 10,
    };

    middleware = new ExperimentalMomentoLocalTestConfigMiddleware(metadata);
  });

  test('should inject metadata correctly into request', async () => {
    const grpcMetadata = new Metadata();
    const middlewareMetadata: MiddlewareMetadata = {
      _grpcMetadata: grpcMetadata,
      toJsonObject: () => ({}), // Mock implementation
      toJsonString: () => JSON.stringify({}), // Mock implementation
    };
    await middleware.onNewRequest().onRequestMetadata(middlewareMetadata);

    expect(grpcMetadata.get('request-id')).toEqual([metadata.requestId]);
    expect(grpcMetadata.get('return-error')).toEqual(['unavailable']);
    expect(grpcMetadata.get('error-rpcs')).toEqual(['get']);
    expect(grpcMetadata.get('error-count')).toEqual([
      metadata.errorCount?.toString(),
    ]);
    expect(grpcMetadata.get('delay-rpcs')).toEqual(['get']);
    expect(grpcMetadata.get('delay-ms')).toEqual([
      metadata.delayMs?.toString(),
    ]);
    expect(grpcMetadata.get('delay-count')).toEqual([
      metadata.delayCount?.toString(),
    ]);
    expect(grpcMetadata.get('stream-error-rpcs')).toEqual(['topic-subscribe']);
    expect(grpcMetadata.get('stream-error')).toEqual([
      MomentoErrorCode.SERVER_UNAVAILABLE,
    ]);
    expect(grpcMetadata.get('stream-error-message-limit')).toEqual([
      metadata.streamErrorMessageLimit?.toString(),
    ]);
  });

  test('should return a new handler instance on new request', () => {
    const handler = middleware.onNewRequest();
    expect(handler).toBeDefined();
  });
});
