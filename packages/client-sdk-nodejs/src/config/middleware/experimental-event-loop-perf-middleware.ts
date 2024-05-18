import {
  Middleware,
  MiddlewareMessage,
  MiddlewareMetadata,
  MiddlewareRequestHandler,
  MiddlewareStatus,
} from './middleware';
import {
  EventLoopUtilization,
  monitorEventLoopDelay,
  performance,
} from 'perf_hooks';
import {MomentoLogger, MomentoLoggerFactory} from '@gomomento/sdk-core';
import {IntervalHistogram} from 'node:perf_hooks';

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

  /**
   * The timestamp when the state metrics got recorded
   */
  timestamp: number;
}

class ExperimentalEventLoopPerformanceMetricsMiddlewareRequestHandler
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
 * This middleware enables event-loop performance metrics.It runs a periodic task specified by metricsLogInterval
 * to gather various event-loop metrics that can be correlated with the overall application's performance. This is
 * particularly helpful to analyze and correlate resource contention with higher network latencies.
 *
 * See {@link StateMetrics} for each heuristic/metric and their description.
 */
export class ExperimentalEventLoopPerformanceMetricsMiddleware
  implements Middleware
{
  private readonly metricsLogInterval = 1000;
  private readonly eventLoopDelayInterval = 20;
  private eldMonitor: IntervalHistogram;
  private elu: EventLoopUtilization;
  private isLoggingStarted = false;
  // this is typed as any because JS returns a number for intervalId but
  // TS returns a NodeJS.Timeout.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private intervalId: any | null = null; // Store the interval ID
  private readonly logger: MomentoLogger;

  constructor(loggerFactory: MomentoLoggerFactory) {
    this.logger = loggerFactory.getLogger(this);
  }

  init() {
    if (!this.isLoggingStarted) {
      this.isLoggingStarted = true;
      this.startLogging();
    }
  }

  private startLogging(): void {
    this.eldMonitor = monitorEventLoopDelay({
      resolution: this.eventLoopDelayInterval,
    });
    this.eldMonitor.enable();
    this.elu = performance.eventLoopUtilization();

    this.intervalId = setInterval(() => {
      this.elu = performance.eventLoopUtilization(this.elu);
      const metrics: StateMetrics = {
        eventLoopUtilization: this.elu.utilization,
        eventLoopDelayMean: this.eldMonitor.mean,
        eventLoopDelayMin: this.eldMonitor.min,
        eventLoopDelayP50: this.eldMonitor.percentile(50),
        eventLoopDelayP75: this.eldMonitor.percentile(75),
        eventLoopDelayP90: this.eldMonitor.percentile(90),
        eventLoopDelayP95: this.eldMonitor.percentile(95),
        eventLoopDelayP99: this.eldMonitor.percentile(99),
        eventLoopDelayMax: this.eldMonitor.max,
        timestamp: Date.now(),
      };
      this.logger.info(JSON.stringify(metrics));
      this.eldMonitor.reset();
    }, this.metricsLogInterval);
  }

  onNewRequest(): MiddlewareRequestHandler {
    return new ExperimentalEventLoopPerformanceMetricsMiddlewareRequestHandler();
  }

  close() {
    if (this.intervalId !== null) {
      this.logger.debug('Stopping event loop metrics logging.');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isLoggingStarted = false;
      this.logger.debug('Event loop metrics logging stopped.');
    }
  }
}
