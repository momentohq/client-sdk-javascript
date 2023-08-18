import {
  Middleware,
  MiddlewareMessage,
  MiddlewareMetadata,
  MiddlewareRequestHandler,
  MiddlewareStatus,
} from '../../config/middleware/middleware';
import {MomentoLogger, MomentoLoggerFactory} from '../../';

class InFlightRequestCountMiddlewareRequestHandler
  implements MiddlewareRequestHandler
{
  private readonly logger: MomentoLogger;
  private readonly inFlightRequestsAtStart: number;

  private receivedResponseBody: boolean;
  private receivedResponseStatus: boolean;

  constructor(logger: MomentoLogger) {
    this.logger = logger;
    this.inFlightRequestsAtStart =
      ++InFlightRequestCountMiddleware.numActiveRequests;
  }

  onRequestBody(request: MiddlewareMessage): Promise<MiddlewareMessage> {
    return Promise.resolve(request);
  }

  onRequestMetadata(metadata: MiddlewareMetadata): Promise<MiddlewareMetadata> {
    return Promise.resolve(metadata);
  }

  onResponseBody(
    response: MiddlewareMessage | null
  ): Promise<MiddlewareMessage | null> {
    this.receivedResponseBody = true;
    if (this.done()) this.logStatusInformation();
    return Promise.resolve(response);
  }

  onResponseMetadata(
    metadata: MiddlewareMetadata
  ): Promise<MiddlewareMetadata> {
    return Promise.resolve(metadata);
  }

  onResponseStatus(status: MiddlewareStatus): Promise<MiddlewareStatus> {
    this.receivedResponseStatus = true;
    if (this.done()) this.logStatusInformation();
    return Promise.resolve(status);
  }

  private done(): boolean {
    return this.receivedResponseBody && this.receivedResponseStatus;
  }

  private logStatusInformation(): void {
    const inFlightRequestsAtEnd =
      --InFlightRequestCountMiddleware.numActiveRequests;
    this.logger.debug(
      `Request completed; in-flight requests at start: ${this.inFlightRequestsAtStart}, in-flight requests at completion: ${inFlightRequestsAtEnd}`
    );
  }
}

export class InFlightRequestCountMiddleware implements Middleware {
  static numActiveRequests = 0;
  private readonly logger: MomentoLogger;

  constructor(loggerFactory: MomentoLoggerFactory) {
    this.logger = loggerFactory.getLogger(this);
  }

  onNewRequest(): MiddlewareRequestHandler {
    return new InFlightRequestCountMiddlewareRequestHandler(this.logger);
  }
}
