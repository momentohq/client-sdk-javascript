import * as fs from 'fs';
import {MomentoLogger, MomentoLoggerFactory} from '../../';
import {
  ExperimentalMetricsMiddleware,
  ExperimentalMetricsMiddlewareRequestHandler,
  ExperimentalRequestMetrics,
} from './impl/experimental-metrics-middleware';
import {MiddlewareRequestHandlerContext} from './middleware';

class ExperimentalMetricsCsvMiddlewareRequestHandler extends ExperimentalMetricsMiddlewareRequestHandler {
  private readonly csvPath: string;

  constructor(
    parent: ExperimentalMetricsMiddleware,
    logger: MomentoLogger,
    context: MiddlewareRequestHandlerContext,
    csvPath: string
  ) {
    super(parent, logger, context);
    this.csvPath = csvPath;
  }

  async emitMetrics(metrics: ExperimentalRequestMetrics): Promise<void> {
    const csvRow = [
      metrics.momento.numActiveRequestsAtStart,
      metrics.momento.numActiveRequestsAtFinish,
      metrics.momento.requestType,
      metrics.momento.status,
      metrics.momento.startTime,
      metrics.momento.requestBodyTime,
      metrics.momento.endTime,
      metrics.momento.duration,
      metrics.momento.requestSize,
      metrics.momento.responseSize,
      metrics.momento.connectionID,
    ].join(',');
    try {
      await fs.promises.appendFile(this.csvPath, `${csvRow}\n`);
    } catch (err) {
      this.logger.error(
        'Error writing to metrics csv file at path: %s : %s',
        this.csvPath,
        err
      );
    }
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
export class ExperimentalMetricsCsvMiddleware extends ExperimentalMetricsMiddleware {
  static numActiveRequests = 0;

  private readonly csvPath: string;

  constructor(csvPath: string, loggerFactory: MomentoLoggerFactory) {
    super(
      loggerFactory,
      (p, l, c) =>
        new ExperimentalMetricsCsvMiddlewareRequestHandler(p, l, c, csvPath)
    );
    this.csvPath = csvPath;
    fs.writeFileSync(this.csvPath, `${this.fieldNames().join(',')}\n`);
  }
}
