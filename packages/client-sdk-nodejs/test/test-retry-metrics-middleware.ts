import {TestRetryMetricsCollector} from './test-retry-metrics-collector';
import {Middleware, MiddlewareRequestHandler, MomentoLogger} from '../src';
import {
  MiddlewareMessage,
  MiddlewareMetadata,
  MiddlewareStatus,
} from '../src/config/middleware/middleware';
import {Metadata} from '@grpc/grpc-js';
import {MomentoRPCMethod} from '../src/config/retry/momento-rpc-method';

class TestMetricsMiddlewareRequestHandler implements MiddlewareRequestHandler {
  private cacheName: string | null = null;

  constructor(
    private readonly logger: MomentoLogger,
    private readonly testMetricsCollector: TestRetryMetricsCollector,
    private readonly requestId: string,
    private readonly returnError?: string,
    private readonly errorRpcList: string[] = [],
    private readonly errorCount?: number,
    private readonly delayRpcList: string[] = [],
    private readonly delayMillis?: number,
    private readonly delayCount?: number
  ) {}

  onRequestBody(request: MiddlewareMessage): Promise<MiddlewareMessage> {
    const requestType = request.constructorName();
    if (this.cacheName) {
      this.testMetricsCollector.addTimestamp(
        this.cacheName,
        requestType as MomentoRPCMethod,
        Date.now()
      );
    } else {
      this.logger.debug(
        'No cache name available. Timestamp will not be collected.'
      );
    }
    return Promise.resolve(request);
  }

  onRequestMetadata(metadata: MiddlewareMetadata): Promise<MiddlewareMetadata> {
    const grpcMetadata = metadata._grpcMetadata;
    this.setGrpcMetadata(grpcMetadata, 'request-id', this.requestId);
    this.setGrpcMetadata(grpcMetadata, 'return-error', this.returnError);
    this.setGrpcMetadata(
      grpcMetadata,
      'error-rpcs',
      this.errorRpcList.join(' ')
    );
    this.setGrpcMetadata(
      grpcMetadata,
      'delay-rpcs',
      this.delayRpcList.join(' ')
    );
    this.setGrpcMetadata(
      grpcMetadata,
      'error-count',
      this.errorCount?.toString()
    );
    this.setGrpcMetadata(
      grpcMetadata,
      'delay-ms',
      this.delayMillis?.toString()
    );
    this.setGrpcMetadata(
      grpcMetadata,
      'delay-count',
      this.delayCount?.toString()
    );
    const cacheName = grpcMetadata.get('cache');
    if (cacheName && cacheName.length > 0) {
      this.cacheName = cacheName[0].toString();
    } else {
      this.logger.debug('No cache name found in metadata.');
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

  constructor(private readonly args: TestRetryMetricsMiddlewareArgs) {
    this.shouldLoadLate = true;
  }

  onNewRequest(): MiddlewareRequestHandler {
    return new TestMetricsMiddlewareRequestHandler(
      this.args.logger,
      this.args.testMetricsCollector,
      this.args.requestId,
      this.args.returnError,
      this.args.errorRpcList,
      this.args.errorCount,
      this.args.delayRpcList,
      this.args.delayMillis,
      this.args.delayCount
    );
  }
}

export {
  TestRetryMetricsMiddleware,
  TestRetryMetricsMiddlewareArgs,
  TestMetricsMiddlewareRequestHandler,
};
