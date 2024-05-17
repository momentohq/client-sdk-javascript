import {Metadata, StatusObject} from '@grpc/grpc-js';
import {Message} from 'google-protobuf';
import {
  RequestLog,
  CacheRequestToLogInterfaceConverter,
} from './cache-request-logging';

export class MiddlewareMetadata {
  readonly _grpcMetadata: Metadata;
  constructor(metadata: Metadata) {
    this._grpcMetadata = metadata;
  }

  toJsonObject() {
    return this._grpcMetadata.toJSON();
  }

  toJsonString(): string {
    return JSON.stringify(this._grpcMetadata.toJSON());
  }
}
export class MiddlewareStatus {
  readonly _grpcStatus: StatusObject;
  constructor(status: StatusObject) {
    this._grpcStatus = status;
  }

  code() {
    return this._grpcStatus.code;
  }
}

export class MiddlewareMessage {
  readonly _grpcMessage: Message;
  constructor(message: Message) {
    this._grpcMessage = message;
  }

  messageLength(): number {
    if (this._grpcMessage !== null && this._grpcMessage !== undefined) {
      return this._grpcMessage.serializeBinary().length;
    }
    return 0;
  }

  constructorName(): string {
    return this._grpcMessage.constructor.name;
  }

  // Note: APIs that use streaming interceptors (e.g. GetBatch and SetBatch)
  // will not see these debug messages
  toLogFormat(): RequestLog {
    const requestToLogConverter = CacheRequestToLogInterfaceConverter.get(
      this.constructorName()
    );
    if (requestToLogConverter === undefined) {
      console.warn(
        'Unable to find requestToLogConverter for',
        this.constructorName()
      );
      return {requestType: this.constructorName()};
    }
    return requestToLogConverter(this._grpcMessage);
  }
}

export interface MiddlewareRequestHandler {
  onRequestMetadata(metadata: MiddlewareMetadata): Promise<MiddlewareMetadata>;
  onRequestBody(request: MiddlewareMessage): Promise<MiddlewareMessage>;

  onResponseMetadata(metadata: MiddlewareMetadata): Promise<MiddlewareMetadata>;
  onResponseBody(
    response: MiddlewareMessage | null
  ): Promise<MiddlewareMessage | null>;
  onResponseStatus(status: MiddlewareStatus): Promise<MiddlewareStatus>;
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
  init?(): void;
  close?(): void;
}
