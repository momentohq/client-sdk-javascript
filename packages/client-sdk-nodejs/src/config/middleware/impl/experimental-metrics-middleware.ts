import {
  Middleware,
  MiddlewareMessage,
  MiddlewareMetadata,
  MiddlewareRequestHandler,
  MiddlewareRequestHandlerContext,
  MiddlewareStatus,
} from '../middleware';
import {MomentoLogger, MomentoLoggerFactory} from '@gomomento/sdk-core';
import {CONNECTION_ID_KEY} from '../../../internal/cache-data-client';

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
  'connectionID',
];

export interface ExperimentalRequestMetrics {
  MomentoMetricsMiddleware: {
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
    /**
     * The ID of the specific connection that made the request
     */
    connectionID: string;
  };
}

export abstract class ExperimentalMetricsMiddlewareRequestHandler
  implements MiddlewareRequestHandler
{
  private readonly parent: ExperimentalMetricsMiddleware;
  protected readonly logger: MomentoLogger;
  private readonly connectionID: string;

  private readonly numActiveRequestsAtStart: number;
  private readonly startTime: number;
  private requestBodyTime: number;
  private requestType: string;
  private requestSize: number;
  private responseStatusCode: number;
  private responseSize: number;

  private receivedResponseBody: boolean;
  private receivedResponseStatus: boolean;

  constructor(
    parent: ExperimentalMetricsMiddleware,
    logger: MomentoLogger,
    context: MiddlewareRequestHandlerContext
  ) {
    this.parent = parent;
    this.logger = logger;
    this.connectionID = context[CONNECTION_ID_KEY];

    this.numActiveRequestsAtStart = parent.incrementActiveRequestCount();
    this.startTime = new Date().getTime();

    this.receivedResponseBody = false;
    this.receivedResponseStatus = false;
  }

  abstract emitMetrics(metrics: ExperimentalRequestMetrics): Promise<void>;

  onRequestBody(request: MiddlewareMessage): Promise<MiddlewareMessage> {
    this.requestSize = request.messageLength();
    this.requestType = request._grpcMessage.constructor.name;
    this.requestBodyTime = new Date().getTime();
    return Promise.resolve(request);
  }

  onRequestMetadata(metadata: MiddlewareMetadata): Promise<MiddlewareMetadata> {
    return Promise.resolve(metadata);
  }

  onResponseBody(
    response: MiddlewareMessage | null
  ): Promise<MiddlewareMessage | null> {
    if (response !== null) {
      this.responseSize = response.messageLength();
    } else {
      this.responseSize = 0;
    }
    this.receivedResponseBody = true;
    if (this.done()) this.recordMetrics();
    return Promise.resolve(response);
  }

  onResponseMetadata(
    metadata: MiddlewareMetadata
  ): Promise<MiddlewareMetadata> {
    return Promise.resolve(metadata);
  }

  onResponseStatus(status: MiddlewareStatus): Promise<MiddlewareStatus> {
    this.receivedResponseStatus = true;
    this.responseStatusCode = status.code();
    if (this.done()) this.recordMetrics();
    return Promise.resolve(status);
  }

  private done(): boolean {
    return this.receivedResponseBody && this.receivedResponseStatus;
  }

  private recordMetrics(): void {
    const endTime = new Date().getTime();
    const metrics: ExperimentalRequestMetrics = {
      MomentoMetricsMiddleware: {
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
        connectionID: this.connectionID,
      },
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
  protected readonly logger: MomentoLogger;

  private readonly requestHandlerFactoryFn: (
    parent: ExperimentalMetricsMiddleware,
    logger: MomentoLogger,
    context: MiddlewareRequestHandlerContext
  ) => MiddlewareRequestHandler;

  constructor(
    loggerFactory: MomentoLoggerFactory,
    requestHandlerFactoryFn: (
      parent: ExperimentalMetricsMiddleware,
      logger: MomentoLogger,
      context: MiddlewareRequestHandlerContext
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

  onNewRequest(
    context: MiddlewareRequestHandlerContext
  ): MiddlewareRequestHandler {
    return this.requestHandlerFactoryFn(this, this.logger, context);
  }
}
