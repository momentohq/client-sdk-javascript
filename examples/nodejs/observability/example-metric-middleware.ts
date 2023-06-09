import {Metadata, StatusObject} from '@grpc/grpc-js';
import {Middleware, MiddlewareRequestHandler} from '@gomomento/sdk';
import {metrics} from '@opentelemetry/api';
import {Counter} from '@opentelemetry/api/build/src/metrics/Metric';
import {Message} from 'google-protobuf';

class ExampleMetricMiddlewareRequestHandler implements MiddlewareRequestHandler {
  private requestCounter: Counter;
  constructor(requestCounter: Counter) {
    this.requestCounter = requestCounter;
  }
  onRequestMetadata(metadata: Metadata): Promise<Metadata> {
    return Promise.resolve(metadata);
  }

  onRequestBody(request: Message): Promise<Message> {
    const requestType = request.constructor.name;
    this.requestCounter.add(1, {'request.type': requestType});
    return Promise.resolve(request);
  }

  onResponseMetadata(metadata: Metadata): Promise<Metadata> {
    return Promise.resolve(metadata);
  }

  onResponseBody(response: Message | null): Promise<Message | null> {
    return Promise.resolve(response);
  }

  onResponseStatus(status: StatusObject): Promise<StatusObject> {
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
