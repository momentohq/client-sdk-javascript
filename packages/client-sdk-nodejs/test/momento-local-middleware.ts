import {TestRetryMetricsCollector} from './test-retry-metrics-collector';
import {Middleware, MiddlewareRequestHandler, MomentoLogger} from '../src';
import {
  MiddlewareMessage,
  MiddlewareMetadata,
  MiddlewareStatus,
} from '../src/config/middleware/middleware';
import {Metadata} from '@grpc/grpc-js';
import {
  MomentoRPCMethod,
  MomentoRPCMethodMetadataConverter,
} from '../src/config/retry/momento-rpc-method';
import {MomentoErrorCodeMetadataConverter} from '../src/config/retry/momento-error-code-metadata-converter';

class MomentoLocalMiddlewareRequestHandler implements MiddlewareRequestHandler {
  private cacheName: string | null = null;
  private momentoLocalMiddlewareArgs: MomentoLocalMiddlewareArgs;

  constructor(momentoLocalMiddlewareArgs: MomentoLocalMiddlewareArgs) {
    this.momentoLocalMiddlewareArgs = momentoLocalMiddlewareArgs;
  }

  onRequestBody(request: MiddlewareMessage): Promise<MiddlewareMessage> {
    const requestType = request.constructorName();
    if (this.cacheName) {
      this.momentoLocalMiddlewareArgs.testMetricsCollector.addTimestamp(
        this.cacheName,
        requestType as MomentoRPCMethod,
        Date.now()
      );
    } else {
      this.momentoLocalMiddlewareArgs.logger.debug(
        'No cache name available. Timestamp will not be collected.'
      );
    }
    return Promise.resolve(request);
  }

  onRequestMetadata(metadata: MiddlewareMetadata): Promise<MiddlewareMetadata> {
    const grpcMetadata = metadata._grpcMetadata;

    // Adding gRPC metadata
    this.setGrpcMetadata(
      grpcMetadata,
      'request-id',
      this.momentoLocalMiddlewareArgs.requestId
    );
    if (this.momentoLocalMiddlewareArgs.returnError) {
      this.setGrpcMetadata(
        grpcMetadata,
        'return-error',
        MomentoErrorCodeMetadataConverter.convert(
          this.momentoLocalMiddlewareArgs.returnError
        )
      );
    }
    this.setGrpcMetadata(
      grpcMetadata,
      'error-rpcs',
      this.momentoLocalMiddlewareArgs.errorRpcList
        ? this.momentoLocalMiddlewareArgs.errorRpcList
            .map(rpcMethod =>
              MomentoRPCMethodMetadataConverter.convert(rpcMethod)
            )
            .join(' ')
        : ''
    );
    this.setGrpcMetadata(
      grpcMetadata,
      'delay-rpcs',
      this.momentoLocalMiddlewareArgs.delayRpcList
        ? this.momentoLocalMiddlewareArgs.delayRpcList
            .map(rpcMethod =>
              MomentoRPCMethodMetadataConverter.convert(rpcMethod)
            )
            .join(' ')
        : ''
    );
    this.setGrpcMetadata(
      grpcMetadata,
      'error-count',
      this.momentoLocalMiddlewareArgs.errorCount?.toString()
    );
    this.setGrpcMetadata(
      grpcMetadata,
      'delay-ms',
      this.momentoLocalMiddlewareArgs.delayMillis?.toString()
    );
    this.setGrpcMetadata(
      grpcMetadata,
      'delay-count',
      this.momentoLocalMiddlewareArgs.delayCount?.toString()
    );
    this.setGrpcMetadata(
      grpcMetadata,
      'stream-error-rpcs',
      this.momentoLocalMiddlewareArgs.streamErrorRpcList
        ? this.momentoLocalMiddlewareArgs.streamErrorRpcList
            .map(rpcMethod =>
              MomentoRPCMethodMetadataConverter.convert(rpcMethod)
            )
            .join(' ')
        : ''
    );
    if (this.momentoLocalMiddlewareArgs.streamError) {
      this.setGrpcMetadata(
        grpcMetadata,
        'stream-error',
        MomentoErrorCodeMetadataConverter.convert(
          this.momentoLocalMiddlewareArgs.streamError
        )
      );
    }
    this.setGrpcMetadata(
      grpcMetadata,
      'stream-error-message-limit',
      this.momentoLocalMiddlewareArgs.streamErrorMessageLimit?.toString()
    );
    const cacheName = grpcMetadata.get('cache');
    if (cacheName && cacheName.length > 0) {
      this.cacheName = cacheName[0].toString();
    } else {
      this.momentoLocalMiddlewareArgs.logger.debug(
        'No cache name found in metadata.'
      );
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
      metadata.set(key, value);
    }
  }
}

interface MomentoLocalMiddlewareArgs {
  logger: MomentoLogger;
  testMetricsCollector: TestRetryMetricsCollector;
  requestId: string;
  returnError?: string;
  errorRpcList?: string[];
  errorCount?: number;
  delayRpcList?: string[];
  delayMillis?: number;
  delayCount?: number;
  streamErrorRpcList?: string[];
  streamError?: string;
  streamErrorMessageLimit?: number;
}

class MomentoLocalMiddleware implements Middleware {
  shouldLoadLate?: boolean;
  private readonly momentoLocalMiddlewareArgs: MomentoLocalMiddlewareArgs;

  constructor(momentoLocalMiddlewareArgs: MomentoLocalMiddlewareArgs) {
    this.shouldLoadLate = true;
    this.momentoLocalMiddlewareArgs = momentoLocalMiddlewareArgs;
  }

  onNewRequest(): MiddlewareRequestHandler {
    return new MomentoLocalMiddlewareRequestHandler(
      this.momentoLocalMiddlewareArgs
    );
  }
}

export {
  MomentoLocalMiddleware,
  MomentoLocalMiddlewareArgs,
  MomentoLocalMiddlewareRequestHandler,
};
