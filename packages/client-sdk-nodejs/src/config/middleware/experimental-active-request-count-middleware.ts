import {MomentoLogger, MomentoLoggerFactory} from '../../';
import {MiddlewareRequestHandlerContext} from './middleware';
import {
  ExperimentalMetricsMiddleware,
  ExperimentalMetricsMiddlewareRequestHandler,
  ExperimentalRequestMetrics,
} from './impl/experimental-metrics-middleware';

class ExperimentalActiveRequestCountLoggingMiddlewareRequestHandler extends ExperimentalMetricsMiddlewareRequestHandler {
  constructor(
    parent: ExperimentalMetricsMiddleware,
    logger: MomentoLogger,
    context: MiddlewareRequestHandlerContext
  ) {
    super(parent, logger, context);
  }

  protected recordMetrics(): void {
    this.parent.decrementActiveRequestCount();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  emitMetrics(metrics: ExperimentalRequestMetrics): Promise<void> {
    return Promise.resolve();
  }
}

/**
 * This middleware enables a periodic task to emit the active request count every second as a JSON
 *
 * See `advanced.ts` in the examples directory for an example of how to set up
 * your {Configuration} to enable this middleware.
 */
export class ExperimentalActiveRequestCountLoggingMiddleware extends ExperimentalMetricsMiddleware {
  private isLoggingStarted = false;
  private readonly metricsLogInterval = 1000;
  // this is typed as any because JS returns a number for intervalId but
  // TS returns a NodeJS.Timeout.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private intervalId: any | null = null; // Store the interval ID

  constructor(loggerFactory: MomentoLoggerFactory) {
    super(
      loggerFactory,
      (p, l, c) =>
        new ExperimentalActiveRequestCountLoggingMiddlewareRequestHandler(
          p,
          l,
          c
        )
    );
    if (!this.isLoggingStarted) {
      this.isLoggingStarted = true;
      this.startLogging();
    }
  }

  private startLogging(): void {
    this.intervalId = setInterval(() => {
      const metrics = {
        activeRequestCount: this.activeRequestCount(),
        timestamp: Date.now(),
      };
      this.logger.info(JSON.stringify(metrics));
    }, this.metricsLogInterval);
  }

  close() {
    if (this.intervalId !== null) {
      this.logger.debug('Stopping active request count metrics logging.');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isLoggingStarted = false;
      this.logger.debug('Active request count metrics logging stopped.');
    }
  }
}
