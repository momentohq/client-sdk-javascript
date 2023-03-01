import {Middleware, MiddlewareRequestHandler} from './middleware';
import {MomentoLogger, MomentoLoggerFactory} from '../logging/momento-logger';
import {Metadata, StatusObject} from '@grpc/grpc-js';
import {Message} from 'google-protobuf';

class ExampleAsyncMiddlewareRequestHandler implements MiddlewareRequestHandler {
  private readonly logger: MomentoLogger;

  constructor(logger: MomentoLogger) {
    this.logger = logger;
  }

  async onRequestMetadata(metadata: Metadata): Promise<Metadata> {
    this.logger.info('ExampleAsyncMiddleware.onRequestMetadata enter');
    await delay(500);
    this.logger.info('ExampleAsyncMiddleware.onRequestMetadata exit');
    return metadata;
  }

  async onRequestBody(request: Message): Promise<Message> {
    this.logger.info('ExampleAsyncMiddleware.onRequestBody enter');
    await delay(500);
    this.logger.info('ExampleAsyncMiddleware.onRequestBody exit');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return request;
  }

  async onResponseMetadata(metadata: Metadata): Promise<Metadata> {
    this.logger.info('ExampleAsyncMiddleware.onResponseMetadata enter');
    await delay(500);
    this.logger.info('ExampleAsyncMiddleware.onResponseMetadata exit');
    return metadata;
  }

  async onResponseBody(response: Message | null): Promise<Message | null> {
    this.logger.info('ExampleAsyncMiddleware.onResponseBody enter');
    await delay(500);
    this.logger.info('ExampleAsyncMiddleware.onResponseBody exit');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response;
  }

  async onResponseStatus(status: StatusObject): Promise<StatusObject> {
    this.logger.info('ExampleAsyncMiddleware.onResponseStatus enter');
    await delay(500);
    this.logger.info('ExampleAsyncMiddleware.onResponseStatus exit');
    return status;
  }
}

/**
 * This class provides an example of how users can implement a Middleware that
 * requires async calls.
 */
export class ExampleAsyncMiddleware implements Middleware {
  private readonly logger: MomentoLogger;

  constructor(loggerFactory: MomentoLoggerFactory) {
    this.logger = loggerFactory.getLogger(this);
  }
  onNewRequest(): MiddlewareRequestHandler {
    this.logger.info('ExampleAsyncMiddleware handling new request');
    return new ExampleAsyncMiddlewareRequestHandler(this.logger);
  }
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
