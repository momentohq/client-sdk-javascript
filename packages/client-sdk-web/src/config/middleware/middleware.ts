import {Message} from 'google-protobuf';
import {Metadata, Request, Status} from 'grpc-web';

export class MiddlewareMetadata {
  readonly _grpcMetadata: Metadata;
  constructor(metadata: Metadata) {
    this._grpcMetadata = metadata;
  }

  toJsonString(): string {
    return JSON.stringify(this._grpcMetadata);
  }
}
export class MiddlewareStatus {
  readonly _grpcStatus: Status;
  constructor(status: Status) {
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

  responseType(): string {
    return this._grpcMessage.constructor.name;
  }

  messageLength(): number {
    if (this._grpcMessage !== null && this._grpcMessage !== undefined) {
      return this._grpcMessage.serializeBinary().length;
    }
    return 0;
  }
}

export class MiddlewareRequest {
  readonly _grpcRequest: Request<Message, Message>;

  constructor(request: Request<Message, Message>) {
    this._grpcRequest = request;
  }

  getMetadata(): {[s: string]: string} {
    return this._grpcRequest.getMetadata();
  }

  getRequestType(): string {
    return this._grpcRequest.constructor.name;
  }

  getBodySize() {
    return this._grpcRequest.getRequestMessage().serializeBinary().length;
  }
}

export interface MiddlewareRequestHandler {
  onRequest(request: MiddlewareRequest): MiddlewareRequest;
  onResponseMetadata(metadata: MiddlewareMetadata): MiddlewareMetadata;
  onResponseData(response: MiddlewareMessage): MiddlewareMessage;
  onResponseStatus(status: MiddlewareStatus): MiddlewareStatus;
  onResponseEnd(): void;
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
