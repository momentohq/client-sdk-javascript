import {Metadata} from '@grpc/grpc-js';
import {
  Middleware,
  MiddlewareMessage,
  MiddlewareMetadata,
  MiddlewareRequestHandler,
  MiddlewareStatus,
} from './middleware';

class MomentoLocalMiddlewareRequestHandler implements MiddlewareRequestHandler {
  constructor(private readonly metadata: MomentoLocalTestConfigMetadata) {}

  onRequestBody(request: MiddlewareMessage): Promise<MiddlewareMessage> {
    return Promise.resolve(request);
  }

  onRequestMetadata(metadata: MiddlewareMetadata): Promise<MiddlewareMetadata> {
    const grpcMetadata = metadata._grpcMetadata;
    for (const [key, value] of Object.entries(this.metadata)) {
      this.setGrpcMetadata(grpcMetadata, key, value as string);
    }
    return Promise.resolve(metadata);
  }

  onResponseMetadata(
    metadata: MiddlewareMetadata
  ): Promise<MiddlewareMetadata> {
    return Promise.resolve(metadata);
  }

  onResponseBody(
    response: MiddlewareMessage | null
  ): Promise<MiddlewareMessage | null> {
    return Promise.resolve(response);
  }

  onResponseStatus(status: MiddlewareStatus): Promise<MiddlewareStatus> {
    return Promise.resolve(status);
  }

  private setGrpcMetadata(
    metadata: Metadata,
    key: string,
    value?: string
  ): void {
    if (value) {
      // convert key to lowercase kebab-case as momento-local expects
      key = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      metadata.set(key, value.toString());
    }
  }
}

interface MomentoLocalTestConfigMetadata {
  requestId: string;
  returnError?: string;
  errorRpcs?: string[];
  errorCount?: number;
  delayRpcs?: string[];
  delayMs?: number;
  delayCount?: number;
}

class MomentoLocalTestConfigMiddleware implements Middleware {
  shouldLoadLate: boolean;
  constructor(private readonly metadata: MomentoLocalTestConfigMetadata) {
    this.shouldLoadLate = true;
  }

  onNewRequest(): MiddlewareRequestHandler {
    return new MomentoLocalMiddlewareRequestHandler(this.metadata);
  }
}

export {
  MomentoLocalTestConfigMiddleware,
  MomentoLocalTestConfigMetadata,
  MomentoLocalMiddlewareRequestHandler,
};
