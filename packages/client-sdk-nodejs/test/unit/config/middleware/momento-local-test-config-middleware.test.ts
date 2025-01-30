import {Metadata} from '@grpc/grpc-js';
import {
  MomentoLocalTestConfigMetadata,
  MomentoLocalTestConfigMiddleware,
} from '../../../../src/config/middleware/momento-local-test-config-middleware';
import {v4} from 'uuid';
import {MiddlewareMetadata} from '../../../../src/config/middleware/middleware';
import {
  MomentoRPCMethod,
  MomentoRPCMethodConverter,
} from '../../../../src/config/retry/momento-rpc-method';
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
      errorRpcs: [MomentoRPCMethodConverter.convert(MomentoRPCMethod.Get)],
      errorCount: 1,
      delayRpcs: [MomentoRPCMethodConverter.convert(MomentoRPCMethod.Get)],
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
    expect(grpcMetadata.get('return-error')).toEqual([
      MomentoErrorCodeMetadataConverter.convert(
        MomentoErrorCode.SERVER_UNAVAILABLE
      ),
    ]);
    expect(grpcMetadata.get('error-rpcs')).toEqual([
      MomentoRPCMethodConverter.convert(MomentoRPCMethod.Get),
    ]);
    expect(grpcMetadata.get('error-count')).toEqual([
      metadata.errorCount?.toString(),
    ]);
    expect(grpcMetadata.get('delay-rpcs')).toEqual([
      MomentoRPCMethodConverter.convert(MomentoRPCMethod.Get),
    ]);
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
