import {TestRetryMetricsCollector} from './test-retry-metrics-collector';
import {Middleware, MiddlewareRequestHandler, MomentoLogger} from '../src';
import {
  MiddlewareMessage,
  MiddlewareMetadata,
  MiddlewareStatus,
} from '../src/config/middleware/middleware';
import {MomentoRPCMethod} from './momento-rpc-method';

export class TestMetricsMiddlewareRequestHandler
  implements MiddlewareRequestHandler
{
  private readonly logger: MomentoLogger;
  private readonly testMetricsCollector: TestRetryMetricsCollector;
  private readonly requestId: string;
  private cacheName: string | null = null;

  constructor(
    logger: MomentoLogger,
    testMetricsCollector: TestRetryMetricsCollector,
    requestId: string
  ) {
    this.logger = logger;
    this.testMetricsCollector = testMetricsCollector;
    this.requestId = requestId;
  }

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
    const cacheName = grpcMetadata.get('cache');
    grpcMetadata.set('request-id', this.requestId);
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
}

export class TestRetryMetricsMiddleware implements Middleware {
  private readonly logger: MomentoLogger;
  private readonly testMetricsCollector: TestRetryMetricsCollector;
  private readonly requestId: string;
  shouldLoadLate?: boolean;

  constructor(
    logger: MomentoLogger,
    testMetricsCollector: TestRetryMetricsCollector,
    requestId: string
  ) {
    this.logger = logger;
    this.testMetricsCollector = testMetricsCollector;
    this.requestId = requestId;
    this.shouldLoadLate = true;
  }

  onNewRequest(): MiddlewareRequestHandler {
    return new TestMetricsMiddlewareRequestHandler(
      this.logger,
      this.testMetricsCollector,
      this.requestId
    );
  }
}
