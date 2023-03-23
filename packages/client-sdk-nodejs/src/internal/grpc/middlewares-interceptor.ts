import {
  InterceptingCall,
  Interceptor,
  InterceptorOptions,
  Listener,
  Metadata,
  Requester,
  StatusObject,
} from '@grpc/grpc-js';
import {NextCall} from '@grpc/grpc-js/build/src/client-interceptors';
import {
  Middleware,
  MiddlewareRequestHandler,
} from '../../config/middleware/middleware';
import {Message} from 'google-protobuf';
import {MomentoLoggerFactory} from '../../common/config/logging';

export function middlewaresInterceptor(
  loggerFactory: MomentoLoggerFactory,
  middlewares: Middleware[]
): Interceptor {
  return (options: InterceptorOptions, nextCall: NextCall) => {
    const middlewareRequestHandlers = middlewares.map(m => m.onNewRequest());
    // create a copy of the handlers and reverse it, because for the response life cycle actions we should call
    // the middlewares in the opposite order.
    const reversedMiddlewareRequestHandlers = [
      ...middlewareRequestHandlers,
    ].reverse();

    const requester: Requester = {
      start: function (
        metadata: Metadata,
        listener: Listener,
        next: (metadata: Metadata, listener: Listener) => void
      ): void {
        const newListener: Listener = {
          onReceiveMetadata: function (
            metadata: Metadata,
            next: (metadata: Metadata) => void
          ): void {
            applyMiddlewareHandlers(
              'onResponseMetadata',
              reversedMiddlewareRequestHandlers,
              (h: MiddlewareRequestHandler) => (m: Metadata) =>
                h.onResponseMetadata(m),
              metadata,
              next
            );
          },
          onReceiveMessage: function (
            // unfortunately grpc uses `any` in their type defs for these
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            message: any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            next: (message: any) => void
          ): void {
            applyMiddlewareHandlers(
              'onResponseBody',
              reversedMiddlewareRequestHandlers,
              (h: MiddlewareRequestHandler) => (request: Message) =>
                h.onResponseBody(request),
              message,
              next
            );
          },
          onReceiveStatus: function (
            status: StatusObject,
            next: (status: StatusObject) => void
          ): void {
            applyMiddlewareHandlers(
              'onResponseStatus',
              reversedMiddlewareRequestHandlers,
              (h: MiddlewareRequestHandler) => (s: StatusObject) =>
                h.onResponseStatus(s),
              status,
              next
            );
          },
        };

        applyMiddlewareHandlers(
          'onRequestMetadata',
          middlewareRequestHandlers,
          (h: MiddlewareRequestHandler) => (m: Metadata) =>
            h.onRequestMetadata(m),
          metadata,
          (m: Metadata) => next(m, newListener)
        );
      },
      // unfortunately grpc uses `any` in their type defs for these
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sendMessage: function (message: any, next: (message: any) => void): void {
        applyMiddlewareHandlers(
          'onRequestBody',
          middlewareRequestHandlers,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (h: MiddlewareRequestHandler) => (request: any) =>
            h.onRequestBody(request as Message),
          message,
          next
        );
      },
    };
    return new InterceptingCall(nextCall(options), requester);
  };
}

function applyMiddlewareHandlers<T>(
  name: string,
  handlers: MiddlewareRequestHandler[],
  middlewareHandlerReduceFn: (
    h: MiddlewareRequestHandler
  ) => (t: T) => Promise<T>,
  originalInput: T,
  nextFn: (t: T) => void
) {
  let remainingHandlers = handlers;
  let middlewarePromise: Promise<T> = Promise.resolve(originalInput);
  while (remainingHandlers.length > 0) {
    const nextHandler = middlewareHandlerReduceFn(remainingHandlers[0]);
    middlewarePromise = middlewarePromise
      .then(newT => nextHandler(newT))
      .catch(e => {
        throw e;
      });
    remainingHandlers = remainingHandlers.slice(1);
  }

  middlewarePromise
    .then(newT => nextFn(newT))
    .catch(e => {
      throw e;
    });
}
