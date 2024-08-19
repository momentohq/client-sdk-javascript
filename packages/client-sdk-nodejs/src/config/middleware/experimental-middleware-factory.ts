// The options interface for clarity and type safety
import {MomentoLoggerFactory} from '@gomomento/sdk-core';
import {ExperimentalEventLoopPerformanceMetricsMiddleware} from './experimental-event-loop-perf-middleware';
import {ExperimentalMetricsLoggingMiddleware} from './experimental-metrics-logging-middleware';
import {ExperimentalActiveRequestCountLoggingMiddleware} from './experimental-active-request-count-middleware';
import {Middleware} from './middleware';
import {ExperimentalMetricsCsvMiddleware} from './experimental-metrics-csv-middleware';
import {ExperimentalGarbageCollectionPerformanceMetricsMiddleware} from './experimental-garbage-collection-middleware';

interface ExperimentalMetricsMiddlewareOptions {
  /**
   * Setting this to true will emit a periodic JSON log for the event loop profile of the nodeJS process.
   */
  eventLoopMetricsLog?: boolean;
  /**
   * Setting this to true will emit a JSON log during major GC events, as observed by node's perf_hooks.
   */
  garbageCollectionMetricsLog?: boolean;
  /**
   * Setting this to true will emit a JSON log for each Momento request, that includes the client-side latency
   * among other request profile statistics.
   */
  perRequestMetricsLog?: boolean;
  /**
   * Setting this to true will emit a periodic JSON log for active Momento request count on the nodeJS process
   * as observed when the periodic task wakes up. This can be handy with eventLoopMetricsLog to observe the event loop
   * delay against the maximum number of concurrent connections the application is observing.
   */
  activeRequestCountMetricsLog?: boolean;
  /**
   * Setting this to true will write a CSV recrd for each Momento request, that includes the client-side latency
   * among other request profile statistics. The path is the file path on your disk where the CSV file is stored.
   */
  perRequestMetricsCSVPath?: string;
}

// Static class encapsulating the factory functionality
export class MiddlewareFactory {
  public static createMetricsMiddlewares(
    loggerFactory: MomentoLoggerFactory,
    options: ExperimentalMetricsMiddlewareOptions
  ): Middleware[] {
    const middlewares: Middleware[] = [];

    if (options.eventLoopMetricsLog === true) {
      middlewares.push(
        new ExperimentalEventLoopPerformanceMetricsMiddleware(loggerFactory)
      );
    }
    if (options.perRequestMetricsCSVPath != null) {
      middlewares.push(
        new ExperimentalMetricsCsvMiddleware(
          options.perRequestMetricsCSVPath,
          loggerFactory
        )
      );
    } else if (options.perRequestMetricsLog === true) {
      middlewares.push(new ExperimentalMetricsLoggingMiddleware(loggerFactory));
    }

    if (options.activeRequestCountMetricsLog === true) {
      middlewares.push(
        new ExperimentalActiveRequestCountLoggingMiddleware(loggerFactory)
      );
    }

    if (options.garbageCollectionMetricsLog === true) {
      middlewares.push(
        new ExperimentalGarbageCollectionPerformanceMetricsMiddleware(
          loggerFactory
        )
      );
    }

    return middlewares;
  }
}
