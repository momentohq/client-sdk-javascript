import {
  Middleware,
  MiddlewareMessage,
  MiddlewareMetadata,
  MiddlewareRequest,
  MiddlewareRequestHandler,
  MiddlewareStatus,
} from './middleware';
import {MomentoLogger} from '../../';

class ExperimentalLoggingMiddlewareRequestHandler
  implements MiddlewareRequestHandler
{
  private readonly logger: MomentoLogger;
  private readonly requestId: string;
  constructor(logger: MomentoLogger, requestId: string) {
    this.logger = logger;
    this.requestId = requestId;
  }

  onRequest(request: MiddlewareRequest): MiddlewareRequest {
    this.logger.info(
      `Logging middleware onRequest: request ${
        this.requestId
      } | metadata: ${JSON.stringify(
        request.getMetadata()
      )} | request type: ${request.getRequestType()} | request size: ${request.getBodySize()}`
    );
    return request;
  }

  onResponseMetadata(metadata: MiddlewareMetadata): MiddlewareMetadata {
    this.logger.info(
      `Logging middleware: request ${
        this.requestId
      } onResponseMetadata: ${metadata.toJsonString()}`
    );
    return metadata;
  }

  onResponseData(response: MiddlewareMessage): MiddlewareMessage {
    this.logger.info(
      `Logging middleware: request ${
        this.requestId
      } onResponseBody: response type: ${response.responseType()}, response size: ${response.messageLength()}`
    );
    return response;
  }

  onResponseStatus(status: MiddlewareStatus): MiddlewareStatus {
    this.logger.info(
      `Logging middleware: request ${
        this.requestId
      } onResponseStatus: status code: ${status.code()}`
    );
    return status;
  }

  onResponseEnd(): void {
    this.logger.info(
      `Logging middleware: request ${this.requestId} onResponseEnd`
    );
  }
}

/**
 * This middleware implements per-request logging which can be used for
 * debugging.  The log format is currently considered experimental; in a
 * future release, once the log format is considered stable, this class will
 * be renamed to remove the Experimental prefix.
 *
 * WARNING: enabling this middleware may have minor performance implications,
 * so enable with caution.
 *
 * In order for this middleware to produce output you will need to have
 * set up your {Configuration} with a {MomentoLoggerFactory} instance that
 * is configured to log at DEBUG level or lower.  See `advanced.ts` in the
 * examples directory for an example of how to set up your {Configuration} to
 * enable this middleware.
 */
export class ExperimentalRequestLoggingMiddleware implements Middleware {
  private readonly logger: MomentoLogger;
  private nextRequestId: number;
  constructor(logger: MomentoLogger) {
    this.logger = logger;
    this.nextRequestId = 0;
  }

  onNewRequest(): MiddlewareRequestHandler {
    this.nextRequestId++;
    return new ExperimentalLoggingMiddlewareRequestHandler(
      this.logger,
      this.nextRequestId.toString()
    );
  }
}
