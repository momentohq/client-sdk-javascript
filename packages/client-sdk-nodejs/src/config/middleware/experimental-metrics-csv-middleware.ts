import * as fs from 'fs';
import {MomentoLogger, MomentoLoggerFactory} from '../../';
import {
  ExperimentalMetricsMiddleware,
  ExperimentalMetricsMiddlewareRequestHandler,
  ExperimentalRequestMetrics,
} from './impl/experimental-metrics-middleware';

class ExperimentalMetricsCsvMiddlewareRequestHandler extends ExperimentalMetricsMiddlewareRequestHandler {
  private readonly csvPath: string;

  constructor(
    parent: ExperimentalMetricsMiddleware,
    logger: MomentoLogger,
    csvPath: string
  ) {
    super(parent, logger);
    this.csvPath = csvPath;
  }

  async emitMetrics(metrics: ExperimentalRequestMetrics): Promise<void> {
    const csvRow = [
      metrics.numActiveRequestsAtStart,
      metrics.numActiveRequestsAtFinish,
      metrics.requestType,
      metrics.status,
      metrics.startTime,
      metrics.requestBodyTime,
      metrics.endTime,
      metrics.duration,
      metrics.requestSize,
      metrics.responseSize,
    ].join(',');
    try {
      await fs.promises.appendFile(this.csvPath, `${csvRow}\n`);
    } catch (err) {
      if (err !== null) {
        this.logger.error(
          'Error writing to metrics csv file at path: %s : %s',
          this.csvPath,
          err
        );
      }
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
      (p, l) =>
        new ExperimentalMetricsCsvMiddlewareRequestHandler(p, l, csvPath)
    );
    this.csvPath = csvPath;
    fs.writeFileSync(this.csvPath, `${this.fieldNames().join(',')}\n`);
  }
}
