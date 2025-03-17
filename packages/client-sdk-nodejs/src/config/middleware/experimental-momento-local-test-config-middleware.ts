import {Metadata} from '@grpc/grpc-js';
import {
  Middleware,
  MiddlewareMessage,
  MiddlewareMetadata,
  MiddlewareRequestHandler,
  MiddlewareStatus,
} from './middleware';
import {MomentoErrorCodeMetadataConverter} from '../retry/momento-error-code-metadata-converter';
import {MomentoRPCMethodMetadataConverter} from '../retry/momento-rpc-method';

class ExperimentalMomentoLocalMiddlewareRequestHandler
  implements MiddlewareRequestHandler
{
  private readonly metadata: ExperimentalMomentoLocalTestConfigMetadata;
  constructor(metadata: ExperimentalMomentoLocalTestConfigMetadata) {
    this.metadata = metadata;
  }

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
    value?: unknown
  ): void {
    if (value === undefined) return;

    let convertedKey: string;
    let convertedValue: string;

    switch (key) {
      case 'requestId':
        convertedKey = 'request-id';
        convertedValue = value as string;
        break;
      case 'returnError':
        convertedKey = 'return-error';
        convertedValue = MomentoErrorCodeMetadataConverter.convert(
          value as string
        );
        break;
      case 'errorRpcs':
        convertedKey = 'error-rpcs';
        convertedValue = (value as string[])
          .map(rpcMethod =>
            MomentoRPCMethodMetadataConverter.convert(rpcMethod)
          )
          .join(' ');
        break;
      case 'errorCount':
        convertedKey = 'error-count';
        convertedValue = (value as number).toString();
        break;
      case 'delayRpcs':
        convertedKey = 'delay-rpcs';
        convertedValue = (value as string[])
          .map(rpcMethod =>
            MomentoRPCMethodMetadataConverter.convert(rpcMethod)
          )
          .join(' ');
        break;
      case 'delayMs':
        convertedKey = 'delay-ms';
        convertedValue = (value as number).toString();
        break;
      case 'delayCount':
        convertedKey = 'delay-count';
        convertedValue = (value as number).toString();
        break;
      case 'streamErrorRpcs':
        convertedKey = 'stream-error-rpcs';
        convertedValue = (value as string[])
          .map(rpcMethod =>
            MomentoRPCMethodMetadataConverter.convert(rpcMethod)
          )
          .join(' ');
        break;
      case 'streamError':
        convertedKey = 'stream-error';
        convertedValue = value as string;
        break;
      case 'streamErrorMessageLimit':
        convertedKey = 'stream-error-message-limit';
        convertedValue = (value as number).toString();
        break;
      default:
        convertedKey = key;
        convertedValue = value as string;
    }

    metadata.set(convertedKey, convertedValue);
  }
}

interface ExperimentalMomentoLocalTestConfigMetadata {
  requestId: string;
  returnError?: string;
  errorRpcs?: string[];
  errorCount?: number;
  delayRpcs?: string[];
  delayMs?: number;
  delayCount?: number;
  streamErrorRpcs?: string[];
  streamError?: string;
  streamErrorMessageLimit?: number;
}

class ExperimentalMomentoLocalTestConfigMiddleware implements Middleware {
  shouldLoadLate: boolean;
  private readonly metadata: ExperimentalMomentoLocalTestConfigMetadata;
  constructor(metadata: ExperimentalMomentoLocalTestConfigMetadata) {
    this.shouldLoadLate = true;
    this.metadata = metadata;
  }

  onNewRequest(): MiddlewareRequestHandler {
    return new ExperimentalMomentoLocalMiddlewareRequestHandler(this.metadata);
  }
}

export {
  ExperimentalMomentoLocalTestConfigMiddleware,
  ExperimentalMomentoLocalTestConfigMetadata,
  ExperimentalMomentoLocalMiddlewareRequestHandler,
};
