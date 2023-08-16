import {Metadata, StatusObject} from '@grpc/grpc-js';
import {Message} from 'google-protobuf';

export interface MiddlewareRequestHandler {
  onRequestMetadata(metadata: Metadata): Promise<Metadata>;
  onRequestBody(request: Message): Promise<Message>;

  onResponseMetadata(metadata: Metadata): Promise<Metadata>;
  onResponseBody(response: Message | null): Promise<Message | null>;
  onResponseStatus(status: StatusObject): Promise<StatusObject>;
}

export interface MiddlewareRequestHandlerContext {
  [key: symbol]: string;
}

/**
 * The Middleware interface allows the Configuration to provide a higher-order function that wraps all requests.
 * This allows future support for things like client-side metrics or other diagnostics helpers.
 *
 * An optional context can be provided that is essentially a <key, value> map {@link MiddlewareRequestHandlerContext}.
 * The context object is available to each individual invocation of the request handler for the middleware.
 */
export interface Middleware {
  onNewRequest(
    context?: MiddlewareRequestHandlerContext
  ): MiddlewareRequestHandler;
}
