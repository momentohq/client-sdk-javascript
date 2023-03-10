import {Middleware, MiddlewareRequestHandler} from './middleware';
import {Metadata, StatusObject} from '@grpc/grpc-js';
import {Message} from 'google-protobuf';
import * as fs from 'fs';
import {MomentoLogger, MomentoLoggerFactory} from '../logging/momento-logger';

function headerFields(): Array<string> {
  return [
    'numActiveRequestsAtStart',
    'numActiveRequestsAtFinish',
    'requestType',
    'status',
    'startTime',
    'requestBodyTime',
    'endTime',
    'duration',
    'requestSize',
    'responseSize',
  ];
}

interface RequestMetrics {
  numActiveRequestsAtStart: number;
  numActiveRequestsAtFinish: number;
  requestType: string;
  status: number;
  startTime: number;
  requestBodyTime: number;
  endTime: number;
  duration: number;
  requestSize: number;
  responseSize: number;
}

class ExperimentalMetricsCsvMiddlewareRequestHandler
  implements MiddlewareRequestHandler
{
  private readonly logger: MomentoLogger;
  private readonly csvPath: string;
  private readonly numActiveRequestsAtStart: number;
  private readonly startTime: number;
  private requestBodyTime: number;
  private requestType: string;
  private requestSize: number;
  private responseStatusCode: number;
  private responseSize: number;

  private receivedResponseBody: boolean;
  private receivedResponseStatus: boolean;

  constructor(logger: MomentoLogger, csvPath: string) {
    this.logger = logger;
    this.csvPath = csvPath;
    this.numActiveRequestsAtStart =
      ++ExperimentalMetricsCsvMiddleware.numActiveRequests;
    this.startTime = new Date().getTime();

    this.receivedResponseBody = false;
    this.receivedResponseStatus = false;
  }

  onRequestBody(request: Message): Promise<Message> {
    this.requestSize = request.serializeBinary().length;
    this.requestType = request.constructor.name;
    this.requestBodyTime = new Date().getTime();
    return Promise.resolve(request);
  }

  onRequestMetadata(metadata: Metadata): Promise<Metadata> {
    return Promise.resolve(metadata);
  }

  onResponseBody(response: Message | null): Promise<Message | null> {
    if (response !== null) {
      this.responseSize = response.serializeBinary().length;
    } else {
      this.responseSize = 0;
    }
    this.receivedResponseBody = true;
    if (this.done()) this.recordMetrics();
    return Promise.resolve(response);
  }

  onResponseMetadata(metadata: Metadata): Promise<Metadata> {
    return Promise.resolve(metadata);
  }

  onResponseStatus(status: StatusObject): Promise<StatusObject> {
    this.receivedResponseStatus = true;
    this.responseStatusCode = status.code;
    if (this.done()) this.recordMetrics();
    return Promise.resolve(status);
  }

  private done(): boolean {
    return this.receivedResponseBody && this.receivedResponseStatus;
  }

  private recordMetrics(): void {
    const endTime = new Date().getTime();
    const metrics: RequestMetrics = {
      numActiveRequestsAtStart: this.numActiveRequestsAtStart,
      numActiveRequestsAtFinish:
        ExperimentalMetricsCsvMiddleware.numActiveRequests,
      requestType: this.requestType,
      status: this.responseStatusCode,
      startTime: this.startTime,
      requestBodyTime: this.requestBodyTime,
      endTime: endTime,
      duration: endTime - this.startTime,
      requestSize: this.requestSize,
      responseSize: this.responseSize,
    };

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
    fs.appendFile(this.csvPath, `${csvRow}\n`, err => {
      if (err !== null) {
        this.logger.error(
          'Error writing to metrics csv file at path: %s : %s',
          this.csvPath,
          err
        );
      }
    });
    ExperimentalMetricsCsvMiddleware.numActiveRequests--;
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
export class ExperimentalMetricsCsvMiddleware implements Middleware {
  static numActiveRequests = 0;
  private readonly logger: MomentoLogger;

  private readonly csvPath: string;

  constructor(csvPath: string, loggerFactory: MomentoLoggerFactory) {
    this.csvPath = csvPath;
    this.logger = loggerFactory.getLogger(this);
    fs.writeFileSync(this.csvPath, `${headerFields().join(',')}\n`);
  }

  onNewRequest(): MiddlewareRequestHandler {
    return new ExperimentalMetricsCsvMiddlewareRequestHandler(
      this.logger,
      this.csvPath
    );
  }
}
