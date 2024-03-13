import {
  Middleware,
  MiddlewareMessage,
  MiddlewareMetadata,
  MiddlewareRequestHandler,
  MiddlewareStatus,
} from './middleware';
import {constants, PerformanceEntry} from 'perf_hooks';
import {MomentoLogger, MomentoLoggerFactory} from '@gomomento/sdk-core';

interface GCEvent extends PerformanceEntry {
  timestamp: number;
}

class ExperimentalGarbageCollectionPerformanceMetricsMiddlewareRequestHandler
  implements MiddlewareRequestHandler
{
  onRequestBody(request: MiddlewareMessage): Promise<MiddlewareMessage> {
    return Promise.resolve(request);
  }

  onRequestMetadata(metadata: MiddlewareMetadata): Promise<MiddlewareMetadata> {
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

/**
 * This middleware enables garbage collection metrics. It subscribers to a GC performance observer provided by
 * node's built-in performance hooks, and logs key GC events.
 */
export class ExperimentalGarbageCollectionPerformanceMetricsMiddleware
  implements Middleware
{
  private readonly logger: MomentoLogger;
  private readonly gcObserver: PerformanceObserver;

  constructor(loggerFactory: MomentoLoggerFactory) {
    this.logger = loggerFactory.getLogger(this);

    this.gcObserver = new PerformanceObserver(items => {
      items
        .getEntries()
        .filter(
          // NODE_PERFORMANCE_GC_MAJOR indicates a major GC event such as STW (stop-the-world) pauses
          // and other long delays. This filter is to control the volume of GC logs if we were to enable
          // this on a customer's client.
          item =>
            (item as PerformanceEntry).kind ===
            constants.NODE_PERFORMANCE_GC_MAJOR
        )
        .forEach(item => {
          const performanceEntry: PerformanceEntry =
            item.toJSON() as PerformanceEntry;
          const gcEvent: GCEvent = {
            ...performanceEntry,
            timestamp: Date.now(),
          };
          this.logger.info(JSON.stringify(gcEvent));
        });
    });
    this.gcObserver.observe({entryTypes: ['gc']});
  }

  onNewRequest(): MiddlewareRequestHandler {
    return new ExperimentalGarbageCollectionPerformanceMetricsMiddlewareRequestHandler();
  }

  close() {
    this.gcObserver.disconnect();
  }
}
