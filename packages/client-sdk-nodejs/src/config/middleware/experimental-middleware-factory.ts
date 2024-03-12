// The options interface for clarity and type safety
import {MomentoLoggerFactory} from '@gomomento/sdk-core';
import {ExperimentalEventLoopPerformanceMetricsMiddleware} from './experimental-event-loop-perf-middleware';
import {ExperimentalMetricsLoggingMiddleware} from './experimental-metrics-logging-middleware';
import {ExperimentalActiveRequestCountLoggingMiddleware} from './experimental-active-request-count-middleware';
import {Middleware} from './middleware';
import {ExperimentalMetricsCsvMiddleware} from './experimental-metrics-csv-middleware';

interface ExperimenalMetricsMiddlewareOptions {
  eventLoopMetricsLog?: boolean;
  perRequestMetricsLog?: boolean;
  activeRequestCountMetricsLog?: boolean;
  perRequestMetricsCSVPath?: string;
}

// Static class encapsulating the factory functionality
export class MiddlewareFactory {
  public static createMetricsMiddlewares(
    loggerFactory: MomentoLoggerFactory,
    options: ExperimenalMetricsMiddlewareOptions
  ): Middleware[] {
    const middlewares: Middleware[] = [];

    if (options.eventLoopMetricsLog === true) {
      middlewares.push(
        new ExperimentalEventLoopPerformanceMetricsMiddleware(loggerFactory)
      );
    }
    if (options.perRequestMetricsCSVPath !== undefined) {
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

    return middlewares;
  }
}
