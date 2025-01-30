import {Metadata} from '@grpc/grpc-js';
import {
  MomentoLocalTestConfigMetadata,
  MomentoLocalTestConfigMiddleware,
} from '../../../../src/config/middleware/momento-local-test-config-middleware';
import {v4} from 'uuid';
import {MiddlewareMetadata} from '../../../../src/config/middleware/middleware';
import {MomentoRPCMethod} from '../../../../src/config/retry/momento-rpc-method';
import {MomentoErrorCodeMetadataConverter} from '../../../../src/config/retry/momento-error-code-metadata-converter';
import {MomentoErrorCode} from '@gomomento/sdk-core';

describe('MomentoLocalTestConfigMiddleware', () => {
  let middleware: MomentoLocalTestConfigMiddleware;
  let metadata: MomentoLocalTestConfigMetadata;

  beforeEach(() => {
    metadata = {
      requestId: v4(),
      returnError: MomentoErrorCodeMetadataConverter.convert(
        MomentoErrorCode.SERVER_UNAVAILABLE
      ),
      errorRpcs: [MomentoRPCMethod.Get],
      errorCount: 1,
      delayRpcs: [MomentoRPCMethod.Get],
      delayMs: 1000,
      delayCount: 1,
    };

    middleware = new MomentoLocalTestConfigMiddleware(metadata);
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
    expect(grpcMetadata.get('return-error')).toEqual([MomentoRPCMethod.Get]);
    expect(grpcMetadata.get('error-rpcs')).toEqual([MomentoRPCMethod.Get]);
    expect(grpcMetadata.get('error-count')).toEqual([
      metadata.errorCount?.toString(),
    ]);
    expect(grpcMetadata.get('delay-rpcs')).toEqual([MomentoRPCMethod.Get]);
    expect(grpcMetadata.get('delay-ms')).toEqual([
      metadata.delayMs?.toString(),
    ]);
    expect(grpcMetadata.get('delay-count')).toEqual([
      metadata.delayCount?.toString(),
    ]);
  });

  test('should return a new handler instance on new request', () => {
    const handler = middleware.onNewRequest();
    expect(handler).toBeDefined();
  });
});
