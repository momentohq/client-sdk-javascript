import {MomentoLogger, MomentoLoggerFactory} from '../logging/momento-logger';
import {Middleware, MiddlewareRequestHandler} from './middleware';
import {Metadata, StatusObject} from '@grpc/grpc-js';
import {Message} from 'google-protobuf';

export class LoggingMiddlewareRequestHandler
  implements MiddlewareRequestHandler
{
  private readonly logger: MomentoLogger;
  constructor(logger: MomentoLogger) {
    this.logger = logger;
  }

  onRequestMetadata(metadata: Metadata): Promise<Metadata> {
    this.logger.info(
      'Logging middleware: onRequestMetadata: %s',
      JSON.stringify(metadata.toJSON())
    );
    return Promise.resolve(metadata);
  }
  onRequestBody(request: Message): Promise<Message> {
    this.logger.info(
      'Logging middleware: onRequestBody: request type: %s',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      request.constructor.name
    );
    return Promise.resolve(request);
  }

  onResponseMetadata(metadata: Metadata): Promise<Metadata> {
    this.logger.info(
      'Logging middleware: onResponseMetadata: %s',
      JSON.stringify(metadata.toJSON())
    );
    return Promise.resolve(metadata);
  }

  onResponseBody(response: Message): Promise<Message> {
    this.logger.info(
      'Logging middleware: onResponseBody: response type: %s',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      response.constructor.name
    );
    return Promise.resolve(response);
  }

  onResponseStatus(status: StatusObject): Promise<StatusObject> {
    this.logger.info(
      'Logging middleware: onResponseStatus: status code: %s',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      status.code
    );
    return Promise.resolve(status);
  }
}

export class LoggingMiddleware implements Middleware {
  private readonly logger: MomentoLogger;
  constructor(loggerFactory: MomentoLoggerFactory) {
    this.logger = loggerFactory.getLogger(this);
  }

  onNewRequest(): MiddlewareRequestHandler {
    this.logger.warn('LOGGING MIDDLEWARE.onNewRequest');
    return new LoggingMiddlewareRequestHandler(this.logger);
  }
}
