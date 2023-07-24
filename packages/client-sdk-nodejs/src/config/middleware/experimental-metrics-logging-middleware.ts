import {MomentoLogger, MomentoLoggerFactory} from '../../';
import {
  ExperimentalMetricsMiddleware,
  ExperimentalMetricsMiddlewareRequestHandler,
  ExperimentalRequestMetrics,
} from './impl/experimental-metrics-middleware';

class ExperimentalMetricsLoggingMiddlewareRequestHandler extends ExperimentalMetricsMiddlewareRequestHandler {
  constructor(parent: ExperimentalMetricsMiddleware, logger: MomentoLogger) {
    super(parent, logger);
  }

  emitMetrics(metrics: ExperimentalRequestMetrics): Promise<void> {
    this.logger.info(JSON.stringify(metrics));
    return Promise.resolve();
  }
}

/**
 * This middleware enables per-request client-side metrics.  Metrics for each
 * request will be written to a CSV file; this file can be analyzed or shared
 * with Momento to diagnose performance issues.
 *
 * The metrics format is currently considered experimental; in a future release,
 * once the format is considered stable, this class will be renamed to remove
 * the Experimental prefix.
 *
 * WARNING: enabling this middleware may have minor performance implications,
 * so enable with caution.
 *
 * WARNING: depending on your request volume, the CSV file size may grow quickly;
 * neither sampling nor file compression / rotation are included at this time
 * (though they may be added in the future).
 *
 * See `advanced.ts` in the examples directory for an example of how to set up
 * your {Configuration} to enable this middleware.
 */
export class ExperimentalMetricsLoggingMiddleware extends ExperimentalMetricsMiddleware {
  static numActiveRequests = 0;

  constructor(loggerFactory: MomentoLoggerFactory) {
    super(
      loggerFactory,
      (p, l) => new ExperimentalMetricsLoggingMiddlewareRequestHandler(p, l)
    );
  }
}
