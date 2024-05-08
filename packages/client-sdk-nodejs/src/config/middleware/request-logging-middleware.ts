import {
  Middleware,
  MiddlewareMessage,
  MiddlewareMetadata,
  MiddlewareRequestHandler,
  MiddlewareStatus,
} from './middleware';
import {MomentoLogger, MomentoLoggerFactory} from '../..';

class LoggingMiddlewareRequestHandler implements MiddlewareRequestHandler {
  private readonly logger: MomentoLogger;
  private readonly requestId: string;
  constructor(logger: MomentoLogger, requestId: string) {
    this.logger = logger;
    this.requestId = requestId;
  }

  onRequestMetadata(metadata: MiddlewareMetadata): Promise<MiddlewareMetadata> {
    this.logger.debug(
      'Logging middleware: request %s onRequestMetadata: %s',
      this.requestId,
      metadata.toJsonString()
    );
    return Promise.resolve(metadata);
  }
  onRequestBody(request: MiddlewareMessage): Promise<MiddlewareMessage> {
    this.logger.debug(
      'Logging middleware: request %s onRequestBody: request type: %s, request size: %s, details: %s',
      this.requestId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      request.constructorName(),
      request.messageLength(),
      request.toString()
    );
    return Promise.resolve(request);
  }

  onResponseMetadata(
    metadata: MiddlewareMetadata
  ): Promise<MiddlewareMetadata> {
    this.logger.debug(
      'Logging middleware: request %s onResponseMetadata: %s',
      this.requestId,
      metadata.toJsonString()
    );
    return Promise.resolve(metadata);
  }

  onResponseBody(
    response: MiddlewareMessage | null
  ): Promise<MiddlewareMessage | null> {
    this.logger.debug(
      'Logging middleware: request %s onResponseBody: response type: %s, response size: %s',
      this.requestId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      response?.constructorName(),
      response?.messageLength() ?? 0
    );
    return Promise.resolve(response);
  }

  onResponseStatus(status: MiddlewareStatus): Promise<MiddlewareStatus> {
    this.logger.debug(
      'Logging middleware: request %s onResponseStatus: status code: %s',
      this.requestId,
      status.code()
    );
    return Promise.resolve(status);
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
export class RequestLoggingMiddleware implements Middleware {
  private readonly logger: MomentoLogger;
  private nextRequestId: number;
  constructor(loggerFactory: MomentoLoggerFactory) {
    this.logger = loggerFactory.getLogger(this);
    this.nextRequestId = 0;
  }

  onNewRequest(): MiddlewareRequestHandler {
    this.nextRequestId++;
    return new LoggingMiddlewareRequestHandler(
      this.logger,
      this.nextRequestId.toString()
    );
  }
}
