import {TestRetryMetricsCollector} from './test-retry-metrics-collector';
import {Middleware, MiddlewareRequestHandler, MomentoLogger} from '../src';
import {
  MiddlewareMessage,
  MiddlewareMetadata,
  MiddlewareStatus,
} from '../src/config/middleware/middleware';
import {Metadata} from '@grpc/grpc-js';
import {
  MomentoRPCMethod,
  MomentoRPCMethodMetadataConverter,
} from '../src/config/retry/momento-rpc-method';
import {MomentoErrorCodeMetadataConverter} from '../src/config/retry/momento-error-code-metadata-converter';

class TestMetricsMiddlewareRequestHandler implements MiddlewareRequestHandler {
  private cacheName: string | null = null;
  private testRetryMetricsMiddlewareArgs: TestRetryMetricsMiddlewareArgs;

  constructor(testRetryMetricsMiddlewareArgs: TestRetryMetricsMiddlewareArgs) {
    this.testRetryMetricsMiddlewareArgs = testRetryMetricsMiddlewareArgs;
  }

  onRequestBody(request: MiddlewareMessage): Promise<MiddlewareMessage> {
    const requestType = request.constructorName();
    if (this.cacheName) {
      this.testRetryMetricsMiddlewareArgs.testMetricsCollector.addTimestamp(
        this.cacheName,
        requestType as MomentoRPCMethod,
        Date.now()
      );
    } else {
      this.testRetryMetricsMiddlewareArgs.logger.debug(
        'No cache name available. Timestamp will not be collected.'
      );
    }
    return Promise.resolve(request);
  }

  onRequestMetadata(metadata: MiddlewareMetadata): Promise<MiddlewareMetadata> {
    const grpcMetadata = metadata._grpcMetadata;

    // Adding gRPC metadata
    this.setGrpcMetadata(
      grpcMetadata,
      'request-id',
      this.testRetryMetricsMiddlewareArgs.requestId
    );
    if (this.testRetryMetricsMiddlewareArgs.returnError) {
      this.setGrpcMetadata(
        grpcMetadata,
        'return-error',
        MomentoErrorCodeMetadataConverter.convert(
          this.testRetryMetricsMiddlewareArgs.returnError
        )
      );
    }
    this.setGrpcMetadata(
      grpcMetadata,
      'error-rpcs',
      this.testRetryMetricsMiddlewareArgs.errorRpcList
        ? this.testRetryMetricsMiddlewareArgs.errorRpcList
            .map(rpcMethod =>
              MomentoRPCMethodMetadataConverter.convert(rpcMethod)
            )
            .join(' ')
        : ''
    );
    this.setGrpcMetadata(
      grpcMetadata,
      'delay-rpcs',
      this.testRetryMetricsMiddlewareArgs.delayRpcList
        ? this.testRetryMetricsMiddlewareArgs.delayRpcList
            .map(rpcMethod =>
              MomentoRPCMethodMetadataConverter.convert(rpcMethod)
            )
            .join(' ')
        : ''
    );
    this.setGrpcMetadata(
      grpcMetadata,
      'error-count',
      this.testRetryMetricsMiddlewareArgs.errorCount?.toString()
    );
    this.setGrpcMetadata(
      grpcMetadata,
      'delay-ms',
      this.testRetryMetricsMiddlewareArgs.delayMillis?.toString()
    );
    this.setGrpcMetadata(
      grpcMetadata,
      'delay-count',
      this.testRetryMetricsMiddlewareArgs.delayCount?.toString()
    );

    const cacheName = grpcMetadata.get('cache');
    if (cacheName && cacheName.length > 0) {
      this.cacheName = cacheName[0].toString();
    } else {
      this.testRetryMetricsMiddlewareArgs.logger.debug(
        'No cache name found in metadata.'
      );
    }
    return Promise.resolve(metadata);
  }

  onResponseMetadata(
    metadata: MiddlewareMetadata
  ): Promise<MiddlewareMetadata> {
    return Promise.resolve(metadata);
  }

  onResponseBody(
    response: MiddlewareMessage | null
  ): Promise<MiddlewareMessage | null> {
    return Promise.resolve(response);
  }

  onResponseStatus(status: MiddlewareStatus): Promise<MiddlewareStatus> {
    return Promise.resolve(status);
  }

  private setGrpcMetadata(
    metadata: Metadata,
    key: string,
    value?: string
  ): void {
    if (value) {
      metadata.set(key, value);
    }
  }
}

interface TestRetryMetricsMiddlewareArgs {
  logger: MomentoLogger;
  testMetricsCollector: TestRetryMetricsCollector;
  requestId: string;
  returnError?: string;
  errorRpcList?: string[];
  errorCount?: number;
  delayRpcList?: string[];
  delayMillis?: number;
  delayCount?: number;
}

class TestRetryMetricsMiddleware implements Middleware {
  shouldLoadLate?: boolean;
  private readonly testRetryMetricsMiddlewareArgs: TestRetryMetricsMiddlewareArgs;

  constructor(testRetryMetricsMiddlewareArgs: TestRetryMetricsMiddlewareArgs) {
    this.shouldLoadLate = true;
    this.testRetryMetricsMiddlewareArgs = testRetryMetricsMiddlewareArgs;
  }

  onNewRequest(): MiddlewareRequestHandler {
    return new TestMetricsMiddlewareRequestHandler(
      this.testRetryMetricsMiddlewareArgs
    );
  }
}

export {
  TestRetryMetricsMiddleware,
  TestRetryMetricsMiddlewareArgs,
  TestMetricsMiddlewareRequestHandler,
};
