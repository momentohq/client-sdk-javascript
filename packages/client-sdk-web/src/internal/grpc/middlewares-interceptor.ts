import {
  Middleware,
  MiddlewareMessage,
  MiddlewareMetadata,
  MiddlewareRequest,
  MiddlewareRequestHandler,
  MiddlewareRequestHandlerContext,
  MiddlewareStatus,
} from '../../config/middleware/middleware';
import {Message} from 'google-protobuf';
import {MomentoLogger, MomentoLoggerFactory} from '../../';
import {
  ClientReadableStream,
  Metadata,
  Request,
  RpcError,
  Status,
  StreamInterceptor,
} from 'grpc-web';

export function middlewaresInterceptor(
  loggerFactory: MomentoLoggerFactory,
  middlewares: Middleware[],
  middlewareRequestContext: MiddlewareRequestHandlerContext
): StreamInterceptor<Message, Message> {
  return new MiddlewareStreamInterceptor(
    loggerFactory,
    middlewares,
    middlewareRequestContext
  );
}

class MiddlewareStreamInterceptor
  implements StreamInterceptor<Message, Message>
{
  readonly logger: MomentoLogger;
  readonly middlewares: Middleware[];
  readonly middlewareRequestContext: MiddlewareRequestHandlerContext;

  constructor(
    loggerFactory: MomentoLoggerFactory,
    middlewares: Middleware[],
    middlewareRequestContext: MiddlewareRequestHandlerContext
  ) {
    this.logger = loggerFactory.getLogger(this.constructor.name);
    this.middlewares = middlewares;
    this.middlewareRequestContext = middlewareRequestContext;
  }

  intercept(
    request: Request<Message, Message>,
    invoker: (
      request: Request<Message, Message>
    ) => ClientReadableStream<Message>
  ): ClientReadableStream<Message> {
    const middlewareRequestHandlers = this.middlewares.map(m =>
      m.onNewRequest(this.middlewareRequestContext)
    );

    const middlewareRequest = new MiddlewareRequest(request);
    const transformedRequest = middlewareRequestHandlers.reduce(
      (acc, h) => h.onRequest(acc),
      middlewareRequest
    );

    return new MiddlewareInterceptedStream(
      this.logger,
      this.middlewareRequestContext,
      middlewareRequestHandlers,
      invoker(transformedRequest._grpcRequest)
    );
  }
}

class MiddlewareInterceptedStream implements ClientReadableStream<Message> {
  readonly logger: MomentoLogger;
  readonly middlewareRequestContext: MiddlewareRequestHandlerContext;
  readonly middlewareRequestHandlers: MiddlewareRequestHandler[];
  readonly reversedMiddlewareRequestHandlers: MiddlewareRequestHandler[];
  readonly stream: ClientReadableStream<Message>;

  constructor(
    logger: MomentoLogger,
    middlewareRequestContext: MiddlewareRequestHandlerContext,
    middlewareRequestHandlers: MiddlewareRequestHandler[],
    stream: ClientReadableStream<Message>
  ) {
    this.logger = logger;
    this.middlewareRequestContext = middlewareRequestContext;
    this.middlewareRequestHandlers = middlewareRequestHandlers;
    this.stream = stream;

    this.reversedMiddlewareRequestHandlers = [
      ...this.middlewareRequestHandlers,
    ].reverse();
  }

  on(
    eventType: 'error',
    callback: (err: RpcError) => void
  ): ClientReadableStream<Message>;
  on(
    eventType: 'status',
    callback: (status: Status) => void
  ): ClientReadableStream<Message>;
  on(
    eventType: 'metadata',
    callback: (status: Metadata) => void
  ): ClientReadableStream<Message>;
  on(
    eventType: 'data',
    callback: (response: Message) => void
  ): ClientReadableStream<Message>;
  on(eventType: 'end', callback: () => void): ClientReadableStream<Message>;
  on(
    eventType: 'error' | 'status' | 'metadata' | 'data' | 'end',
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    callback: (arg: any) => void
  ): ClientReadableStream<Message> {
    switch (eventType) {
      case 'error':
        return this.onResponseError(eventType, callback);
      case 'status':
        return this.onResponseStatus(eventType, callback);
      case 'metadata':
        return this.onResponseMetadata(eventType, callback);
      case 'data':
        return this.onResponseData(eventType, callback);
      case 'end':
        return this.onResponseEnd(eventType, callback as () => void);
      default:
        return this.stream.on(eventType, callback);
    }
  }

  removeListener(eventType: 'error', callback: (err: RpcError) => void): void;
  removeListener(eventType: 'status', callback: (status: Status) => void): void;
  removeListener(
    eventType: 'metadata',
    callback: (status: Metadata) => void
  ): void;
  removeListener(
    eventType: 'data',
    callback: (response: Message) => void
  ): void;
  removeListener(eventType: 'end', callback: () => void): void;
  removeListener(
    _eventType: 'error' | 'status' | 'metadata' | 'data' | 'end',
    _callback: (arg: any) => void
  ): void {
    return;
  }

  cancel(): void {
    this.stream.cancel();
  }

  private onResponseError(
    eventType: 'error',
    callback: (err: RpcError) => void
  ): ClientReadableStream<Message> {
    return this.stream.on(eventType, callback);
  }

  private onResponseStatus(
    eventType: 'status',
    callback: (status: Status) => void
  ): ClientReadableStream<Message> {
    const newCallback = (status: Status) => {
      const modifiedStatus = applyMiddlewareHandlers(
        'onResponseStatus',
        this.reversedMiddlewareRequestHandlers,
        (h: MiddlewareRequestHandler) => (s: MiddlewareStatus) =>
          h.onResponseStatus(s),
        new MiddlewareStatus(status)
      );
      callback(modifiedStatus._grpcStatus);
    };
    return this.stream.on(eventType, newCallback);
  }

  private onResponseMetadata(
    eventType: 'metadata',
    callback: (metadata: Metadata) => void
  ): ClientReadableStream<Message> {
    const newCallback = (metadata: Metadata) => {
      const modifiedMetadata = applyMiddlewareHandlers(
        'onResponseMetadata',
        this.reversedMiddlewareRequestHandlers,
        (h: MiddlewareRequestHandler) => (m: MiddlewareMetadata) =>
          h.onResponseMetadata(m),
        new MiddlewareMetadata(metadata)
      );

      callback(modifiedMetadata._grpcMetadata);
    };
    return this.stream.on(eventType, newCallback);
  }

  private onResponseData(
    eventType: 'data',
    callback: (response: Message) => void
  ): ClientReadableStream<Message> {
    const newCallback = (response: Message) => {
      const modifiedResponse = applyMiddlewareHandlers(
        'onResponseData',
        this.reversedMiddlewareRequestHandlers,
        (h: MiddlewareRequestHandler) => (request: MiddlewareMessage) =>
          h.onResponseData(request),
        new MiddlewareMessage(response)
      );
      callback(modifiedResponse._grpcMessage);
    };
    return this.stream.on(eventType, newCallback);
  }

  private onResponseEnd(
    eventType: 'end',
    callback: () => void
  ): ClientReadableStream<Message> {
    const newCallback = () => {
      applyMiddlewareHandlers(
        'onResponseEnd',
        this.reversedMiddlewareRequestHandlers,
        (h: MiddlewareRequestHandler) => () => h.onResponseEnd(),
        undefined
      );
      callback();
    };
    return this.stream.on(eventType, newCallback);
  }
}

function applyMiddlewareHandlers<T>(
  name: string,
  handlers: MiddlewareRequestHandler[],
  middlewareHandlerReduceFn: (h: MiddlewareRequestHandler) => (t: T) => T,
  originalInput: T
): T {
  let remainingHandlers = handlers;
  let newT = originalInput;
  while (remainingHandlers.length > 0) {
    const nextHandler = middlewareHandlerReduceFn(remainingHandlers[0]);
    newT = nextHandler(newT);
    remainingHandlers = remainingHandlers.slice(1);
  }

  return newT;
}
