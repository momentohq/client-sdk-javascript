import {MomentoLogger, MomentoLoggerFactory} from '../../';
import {
  ExperimentalMetricsMiddleware,
  ExperimentalMetricsMiddlewareRequestHandler,
  ExperimentalRequestMetrics,
} from './impl/experimental-metrics-middleware';
import {MiddlewareRequestHandlerContext} from './middleware';

class ExperimentalMetricsLoggingMiddlewareRequestHandler extends ExperimentalMetricsMiddlewareRequestHandler {
  constructor(
    parent: ExperimentalMetricsMiddleware,
    logger: MomentoLogger,
    context: MiddlewareRequestHandlerContext
  ) {
    super(parent, logger, context);
  }

  emitMetrics(metrics: ExperimentalRequestMetrics): Promise<void> {
    this.logger.info(JSON.stringify(metrics));
    return Promise.resolve();
  }
}

/**
 * This middleware enables per-request client-side metrics.  Metrics for each
 * request will be written to logs; the log data can be analyzed or shared
 * with Momento to diagnose performance issues.
 *
 * The metrics format is currently considered experimental; in a future release,
 * once the format is considered stable, this class will be renamed to remove
 * the Experimental prefix.
 *
 * WARNING: enabling this middleware may have minor performance implications,
 * so enable with caution.
 *
 * WARNING: depending on your request volume, this middleware will produce a high
 * volume of log output. If you are writing logs directly to local disk, be aware
 * of disk usage and make sure you have log rotation / compression enabled via a
 * tool such as `logrotate`.
 *
 * See `advanced.ts` in the examples directory for an example of how to set up
 * your {Configuration} to enable this middleware.
 */
export class ExperimentalMetricsLoggingMiddleware extends ExperimentalMetricsMiddleware {
  static numActiveRequests = 0;

  constructor(loggerFactory: MomentoLoggerFactory) {
    super(
      loggerFactory,
      (p, l, c) =>
        new ExperimentalMetricsLoggingMiddlewareRequestHandler(p, l, c)
    );
  }
}
