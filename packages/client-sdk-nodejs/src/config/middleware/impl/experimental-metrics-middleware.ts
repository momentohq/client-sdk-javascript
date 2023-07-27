import {Middleware, MiddlewareRequestHandler} from '../middleware';
import {Metadata, StatusObject} from '@grpc/grpc-js';
import {Message} from 'google-protobuf';
import {MomentoLogger, MomentoLoggerFactory} from '@gomomento/sdk-core';

const FIELD_NAMES: Array<string> = [
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

export interface ExperimentalRequestMetrics {
  /**
   * number of requests active at the start of the request
   */
  numActiveRequestsAtStart: number;
  /**
   * number of requests active at the finish of the request (including the request itself)
   */
  numActiveRequestsAtFinish: number;
  /**
   * The generated grpc object type of the request
   */
  requestType: string;
  /**
   * The grpc status code of the response
   */
  status: number;
  /**
   * The time the request started (millis since epoch)
   */
  startTime: number;
  /**
   * The time the body of the request was available to the grpc library (millis since epoch)
   */
  requestBodyTime: number;
  /**
   * The time the request completed (millis since epoch)
   */
  endTime: number;
  /**
   * The duration of the request (in millis)
   */
  duration: number;
  /**
   * The size of the request body in bytes
   */
  requestSize: number;
  /**
   * The size of the response body in bytes
   */
  responseSize: number;
}

export abstract class ExperimentalMetricsMiddlewareRequestHandler
  implements MiddlewareRequestHandler
{
  private readonly parent: ExperimentalMetricsMiddleware;
  protected readonly logger: MomentoLogger;

  private readonly numActiveRequestsAtStart: number;
  private readonly startTime: number;
  private requestBodyTime: number;
  private requestType: string;
  private requestSize: number;
  private responseStatusCode: number;
  private responseSize: number;

  private receivedResponseBody: boolean;
  private receivedResponseStatus: boolean;

  constructor(parent: ExperimentalMetricsMiddleware, logger: MomentoLogger) {
    this.parent = parent;
    this.logger = logger;

    this.numActiveRequestsAtStart = parent.incrementActiveRequestCount();
    this.startTime = new Date().getTime();

    this.receivedResponseBody = false;
    this.receivedResponseStatus = false;
  }

  abstract emitMetrics(metrics: ExperimentalRequestMetrics): Promise<void>;

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
    const metrics: ExperimentalRequestMetrics = {
      numActiveRequestsAtStart: this.numActiveRequestsAtStart,
      numActiveRequestsAtFinish: this.parent.activeRequestCount(),
      requestType: this.requestType,
      status: this.responseStatusCode,
      startTime: this.startTime,
      requestBodyTime: this.requestBodyTime,
      endTime: endTime,
      duration: endTime - this.startTime,
      requestSize: this.requestSize,
      responseSize: this.responseSize,
    };
    this.emitMetrics(metrics).catch(e =>
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.error(`An error occurred when trying to emit metrics: ${e}`)
    );
    this.parent.decrementActiveRequestCount();
  }
}

/**
 * This middleware enables per-request client-side metrics.  This is an abstract
 * class that does not route the metrics to a specific destination; concrete subclasses
 * may store the metrics as they see fit.
 *
 * The metrics format is currently considered experimental; in a future release,
 * once the format is considered stable, this class will be renamed to remove
 * the Experimental prefix.
 *
 * WARNING: enabling this middleware may have minor performance implications,
 * so enable with caution.
 *
 * See `advanced.ts` in the examples directory for an example of how to set up
 * your {Configuration} to enable this middleware.
 */
export abstract class ExperimentalMetricsMiddleware implements Middleware {
  private numActiveRequests = 0;
  private readonly logger: MomentoLogger;
  private readonly requestHandlerFactoryFn: (
    parent: ExperimentalMetricsMiddleware,
    logger: MomentoLogger
  ) => MiddlewareRequestHandler;

  constructor(
    loggerFactory: MomentoLoggerFactory,
    requestHandlerFactoryFn: (
      parent: ExperimentalMetricsMiddleware,
      logger: MomentoLogger
    ) => MiddlewareRequestHandler
  ) {
    this.logger = loggerFactory.getLogger(this);
    this.requestHandlerFactoryFn = requestHandlerFactoryFn;
  }

  fieldNames(): Array<string> {
    return FIELD_NAMES;
  }

  incrementActiveRequestCount(): number {
    return ++this.numActiveRequests;
  }

  activeRequestCount(): number {
    return this.numActiveRequests;
  }

  decrementActiveRequestCount(): void {
    --this.numActiveRequests;
  }

  onNewRequest(): MiddlewareRequestHandler {
    return this.requestHandlerFactoryFn(this, this.logger);
  }
}
