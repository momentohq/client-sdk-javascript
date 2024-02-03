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
  MiddlewareMessage,
  MiddlewareMetadata,
  MiddlewareRequestHandler,
  MiddlewareRequestHandlerContext,
  MiddlewareStatus,
} from '../../config/middleware/middleware';
import {Message} from 'google-protobuf';
import {MomentoLoggerFactory} from '../../';
import {cache_client} from '@gomomento/generated-types/dist/cacheclient';
import { Status } from '@grpc/grpc-js/build/src/constants';

export function middlewaresInterceptor(
  loggerFactory: MomentoLoggerFactory,
  middlewares: Middleware[],
  middlewareRequestContext: MiddlewareRequestHandlerContext,
  grpcClient: cache_client.ScsClient | null = null
): Interceptor {
  const logger = loggerFactory.getLogger('grpc-interceptor');

  return (options: InterceptorOptions, nextCall: NextCall) => {
    const middlewareRequestHandlers = middlewares.map(m =>
      m.onNewRequest(middlewareRequestContext)
    );
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
              (h: MiddlewareRequestHandler) => (m: MiddlewareMetadata) =>
                h.onResponseMetadata(m),
              new MiddlewareMetadata(metadata),
              (metadata: MiddlewareMetadata) => next(metadata._grpcMetadata)
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
              (h: MiddlewareRequestHandler) =>
                (request: MiddlewareMessage | null) =>
                  h.onResponseBody(request),
              new MiddlewareMessage(message as Message),
              (msg: MiddlewareMessage | null) => next(msg?._grpcMessage)
            );
          },
          onReceiveStatus: function (
            status: StatusObject,
            next: (status: StatusObject) => void
          ): void {
            if (status.code === Status.DEADLINE_EXCEEDED) {
              logger.debug(
                `Received status: ${status.code} ${
                  status.details
                } and grpc connection status: ${
                  grpcClient?.getChannel()?.getConnectivityState(false) ??
                  'unable to get connection status'
                }`
              );
            }
            applyMiddlewareHandlers(
              'onResponseStatus',
              reversedMiddlewareRequestHandlers,
              (h: MiddlewareRequestHandler) => (s: MiddlewareStatus) =>
                h.onResponseStatus(s),
              new MiddlewareStatus(status),
              (s: MiddlewareStatus) => next(s._grpcStatus)
            );
          },
        };

        applyMiddlewareHandlers(
          'onRequestMetadata',
          middlewareRequestHandlers,
          (h: MiddlewareRequestHandler) => (m: MiddlewareMetadata) =>
            h.onRequestMetadata(m),
          new MiddlewareMetadata(metadata),
          (m: MiddlewareMetadata) => next(m._grpcMetadata, newListener)
        );
      },
      // unfortunately grpc uses `any` in their type defs for these
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sendMessage: function (message: any, next: (message: any) => void): void {
        applyMiddlewareHandlers(
          'onRequestBody',
          middlewareRequestHandlers,
          (h: MiddlewareRequestHandler) => (request: MiddlewareMessage) =>
            h.onRequestBody(request),
          new MiddlewareMessage(message as Message),
          (m: MiddlewareMessage) => next(m._grpcMessage)
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
