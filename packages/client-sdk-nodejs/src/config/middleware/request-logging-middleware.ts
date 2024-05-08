import {
  Middleware,
  MiddlewareMessage,
  MiddlewareMetadata,
  MiddlewareRequestHandler,
  MiddlewareStatus,
} from './middleware';
import {
  DefaultMomentoLoggerFactory,
  MomentoLogger,
  MomentoLoggerFactory,
} from '../..';

class LoggingMiddlewareRequestHandler implements MiddlewareRequestHandler {
  private readonly logger: MomentoLogger;
  private readonly requestId: string;
  constructor(logger: MomentoLogger, requestId: string) {
    this.logger = logger;
    this.requestId = requestId;
  }

  onRequestMetadata(metadata: MiddlewareMetadata): Promise<MiddlewareMetadata> {
    this.logger.info(
      JSON.stringify({
        event: 'onRequestMetadata',
        requestId: this.requestId,
        ...metadata.toJsonObject(),
      })
    );
    return Promise.resolve(metadata);
  }
  onRequestBody(request: MiddlewareMessage): Promise<MiddlewareMessage> {
    this.logger.info(
      JSON.stringify({
        event: 'onRequestBody',
        requestId: this.requestId,
        requestSize: request.messageLength(),
        ...request.toLogFormat(),
      })
    );
    return Promise.resolve(request);
  }

  onResponseMetadata(
    metadata: MiddlewareMetadata
  ): Promise<MiddlewareMetadata> {
    this.logger.info(
      JSON.stringify({
        event: 'onResponseMetadata',
        requestId: this.requestId,
        ...metadata.toJsonObject(),
      })
    );
    return Promise.resolve(metadata);
  }

  onResponseBody(
    response: MiddlewareMessage | null
  ): Promise<MiddlewareMessage | null> {
    this.logger.info(
      JSON.stringify({
        event: 'onResponseBody',
        requestId: this.requestId,
        ...response?._grpcMessage?.toObject(),
      })
    );
    return Promise.resolve(response);
  }

  onResponseStatus(status: MiddlewareStatus): Promise<MiddlewareStatus> {
    this.logger.info(
      JSON.stringify({
        event: 'onResponseStatus',
        requestId: this.requestId,
        status: status.code(),
      })
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
  constructor(
    loggerFactory: MomentoLoggerFactory = new DefaultMomentoLoggerFactory()
  ) {
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
