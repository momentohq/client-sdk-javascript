import {Metadata, StatusObject} from '@grpc/grpc-js';
import {Message} from 'google-protobuf';

export interface MiddlewareRequestHandler {
  onRequestMetadata(metadata: Metadata): Promise<Metadata>;
  onRequestBody(request: Message): Promise<Message>;

  onResponseMetadata(metadata: Metadata): Promise<Metadata>;
  onResponseBody(response: Message): Promise<Message>;
  onResponseStatus(status: StatusObject): Promise<StatusObject>;
}

/**
 * The Middleware interface allows the Configuration to provide a higher-order function that wraps all requests.
 * This allows future support for things like client-side metrics or other diagnostics helpers.
 */
export interface Middleware {
  onNewRequest(): MiddlewareRequestHandler;
}
