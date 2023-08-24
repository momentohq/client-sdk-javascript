import {MomentoLogger, MomentoLoggerFactory} from '../../';
import {
  ExperimentalMetricsMiddleware,
  ExperimentalMetricsMiddlewareRequestHandler,
  ExperimentalRequestMetrics,
} from './impl/experimental-metrics-middleware';
import {MiddlewareRequestHandlerContext} from './middleware';
import {
  EventLoopDelayMonitor,
  EventLoopUtilization,
  monitorEventLoopDelay,
  performance,
} from 'perf_hooks';

interface StateMetrics {
  /**
   * The proportion of time the event loop was busy over the last second.
   */
  eventLoopUtilization: number;

  /**
   * The average event loop delay over the last second, measured in 20ms increments.
   */
  eventLoopDelayMean: number;

  /**
   * The minimum event loop delay over the last second, measured in 20ms increments.
   */
  eventLoopDelayMin: number;

  /**
   * The 50th percentile event loop delay over the last second, measured in 20ms increments.
   */
  eventLoopDelayP50: number;

  /**
   * The 75th percentile event loop delay over the last second, measured in 20ms increments.
   */
  eventLoopDelayP75: number;

  /**
   * The 90th percentile event loop delay over the last second, measured in 20ms increments.
   */
  eventLoopDelayP90: number;

  /**
   * The 95th percentile event loop delay over the last second, measured in 20ms increments.
   */
  eventLoopDelayP95: number;

  /**
   * The 99th percentile event loop delay over the last second, measured in 20ms increments.
   */
  eventLoopDelayP99: number;

  /**
   * The maximum event loop delay over the last second, measured in 20ms increments.
   */
  eventLoopDelayMax: number;
}

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
 * It also enables regular logging of congestion in the node event loop. Once
 * per second it will output the event loop utilization ratio, as well as stats
 * about the event loop delay, measured in 20ms increments.
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
  private static readonly metricsLogInterval = 1000;
  private static readonly eventLoopDelayInterval = 20;
  private static eldMonitor: EventLoopDelayMonitor;
  private static elu: EventLoopUtilization;
  private static isLoggingStarted = false;
  static numActiveRequests = 0;

  constructor(loggerFactory: MomentoLoggerFactory) {
    super(
      loggerFactory,
      (p, l, c) =>
        new ExperimentalMetricsLoggingMiddlewareRequestHandler(p, l, c)
    );
    if (!ExperimentalMetricsLoggingMiddleware.isLoggingStarted) {
      ExperimentalMetricsLoggingMiddleware.isLoggingStarted = true;
      ExperimentalMetricsLoggingMiddleware.startLogging(this.logger);
    }
  }

  private static startLogging(logger: MomentoLogger): void {
    this.eldMonitor = monitorEventLoopDelay({
      resolution: this.eventLoopDelayInterval,
    });
    this.eldMonitor.enable();
    this.elu = performance.eventLoopUtilization();

    setTimeout(() => {
      setInterval(() => {
        this.elu = performance.eventLoopUtilization(this.elu);
        const metrics: StateMetrics = {
          eventLoopUtilization: this.elu.utilization,
          eventLoopDelayMean: this.normalizeEld(this.eldMonitor.mean),
          eventLoopDelayMin: Math.max(
            0,
            this.normalizeEld(this.eldMonitor.min)
          ),
          eventLoopDelayP50: this.normalizeEld(this.eldMonitor.percentile(50)),
          eventLoopDelayP75: this.normalizeEld(this.eldMonitor.percentile(75)),
          eventLoopDelayP90: this.normalizeEld(this.eldMonitor.percentile(90)),
          eventLoopDelayP95: this.normalizeEld(this.eldMonitor.percentile(95)),
          eventLoopDelayP99: this.normalizeEld(this.eldMonitor.percentile(99)),
          eventLoopDelayMax: this.normalizeEld(this.eldMonitor.max),
        };
        logger.info(JSON.stringify(metrics));
        this.eldMonitor.reset();
      }, this.metricsLogInterval);
    }, this.metricsLogInterval);
  }

  private static normalizeEld(eventLoopDelay: number): number {
    return eventLoopDelay / 1_000_000 - this.eventLoopDelayInterval;
  }
}
