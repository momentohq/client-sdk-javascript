import {Middleware, MiddlewareRequestHandler} from '@gomomento/sdk';
import {metrics} from '@opentelemetry/api';
import {Counter} from '@opentelemetry/api/build/src/metrics/Metric';
import {
  MiddlewareMessage,
  MiddlewareMetadata,
  MiddlewareStatus,
} from '@gomomento/sdk/dist/src/config/middleware/middleware';

class ExampleMetricMiddlewareRequestHandler implements MiddlewareRequestHandler {
  private requestCounter: Counter;
  constructor(requestCounter: Counter) {
    this.requestCounter = requestCounter;
  }
  onRequestMetadata(metadata: MiddlewareMetadata): Promise<MiddlewareMetadata> {
    return Promise.resolve(metadata);
  }

  onRequestBody(request: MiddlewareMessage): Promise<MiddlewareMessage> {
    const requestType = request.constructor.name;
    this.requestCounter.add(1, {'request.type': requestType});
    return Promise.resolve(request);
  }

  onResponseMetadata(metadata: MiddlewareMetadata): Promise<MiddlewareMetadata> {
    return Promise.resolve(metadata);
  }

  onResponseBody(response: MiddlewareMessage | null): Promise<MiddlewareMessage | null> {
    return Promise.resolve(response);
  }

  onResponseStatus(status: MiddlewareStatus): Promise<MiddlewareStatus> {
    return Promise.resolve(status);
  }
}

/**
 * Basic middleware implementation that captures a request count metric. See experimental-metrics-csv-middleware.ts for
 * more comprehensive metrics, although be aware that that class is meant for troubleshooting and will eat disk space quickly.
 */
export class ExampleMetricMiddleware implements Middleware {
  private readonly requestCounter: Counter;
  constructor() {
    const meter = metrics.getMeter('metric-middleware-meter');

    this.requestCounter = meter.createCounter('momento_requests_counter', {
      description: 'Momento GRPC requests',
    });
  }

  onNewRequest(): MiddlewareRequestHandler {
    return new ExampleMetricMiddlewareRequestHandler(this.requestCounter);
  }
}
