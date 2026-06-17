import {
  CredentialProvider,
  DeleteFunction,
  FunctionInfo,
  FunctionVersionInfo,
  InvalidArgumentError,
  ListFunctions,
  ListFunctionVersions,
  MomentoLogger,
  MomentoLoggerFactory,
  PutFunction,
  UnknownError,
} from '@gomomento/sdk-core';
import {
  IFunctionClient,
  PutFunctionOptions,
} from '@gomomento/sdk-core/dist/src/internal/clients/function/IFunctionClient';
import {validateCacheName} from '@gomomento/sdk-core/dist/src/internal/utils';
import {FunctionConfiguration} from '../config/function-configuration';
import {function_client} from '@gomomento/generated-types/dist/function';
import {function_types} from '@gomomento/generated-types/dist/function_types';
import {IdleGrpcClientWrapper} from './grpc/idle-grpc-client-wrapper';
import {GrpcClientWrapper} from './grpc/grpc-client-wrapper';
import {Header, HeaderInterceptor} from './grpc/headers-interceptor';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  ChannelCredentials,
  ClientReadableStream,
  Interceptor,
  Metadata,
  ServiceError,
} from '@grpc/grpc-js';
import {version} from '../../package.json';
import {FunctionClientAllProps} from './function-client-all-props';
import {middlewaresInterceptor} from './grpc/middlewares-interceptor';
import {
  Middleware,
  MiddlewareRequestHandlerContext,
} from '../config/middleware/middleware';
import {grpcChannelOptionsFromGrpcConfig} from './grpc/grpc-channel-options';
import {RetryInterceptor} from './grpc/retry-interceptor';

export const CONNECTION_ID_KEY = Symbol('connectionID');

// Wasm artifacts ship inline in the PutFunction request and can be large, so raise the gRPC message-size
// caps above the data-plane defaults (which are tuned for small cache items).
const MAX_MESSAGE_SIZE_BYTES = 32 * 1024 * 1024;

export class FunctionClient implements IFunctionClient {
  private readonly configuration: FunctionConfiguration;
  private readonly credentialProvider: CredentialProvider;
  private readonly logger: MomentoLogger;
  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;
  private readonly requestTimeoutMs: number;
  private readonly clientWrapper: GrpcClientWrapper<function_client.FunctionRegistryClient>;
  private readonly interceptors: Interceptor[];
  // Server-streaming calls (list*) use interceptors WITHOUT the retry interceptor — a stream cannot be
  // naively retried.
  private readonly streamingInterceptors: Interceptor[];

  constructor(props: FunctionClientAllProps, functionClientId: string) {
    this.configuration = props.configuration;
    this.cacheServiceErrorMapper = new CacheServiceErrorMapper(
      props.configuration.getThrowOnErrors()
    );
    this.credentialProvider = props.credentialProvider;
    this.logger = this.configuration.getLoggerFactory().getLogger(this);
    const grpcConfig = this.configuration
      .getTransportStrategy()
      .getGrpcConfig();

    this.requestTimeoutMs = grpcConfig.getDeadlineMillis();
    this.validateRequestTimeout(this.requestTimeoutMs);
    this.logger.debug(
      `Creating function client using endpoint: '${this.credentialProvider.getCacheEndpoint()}'`
    );

    const channelOptions = {
      ...grpcChannelOptionsFromGrpcConfig(grpcConfig),
      'grpc.max_send_message_length': MAX_MESSAGE_SIZE_BYTES,
      'grpc.max_receive_message_length': MAX_MESSAGE_SIZE_BYTES,
    };

    this.clientWrapper = new IdleGrpcClientWrapper({
      clientFactoryFn: () =>
        new function_client.FunctionRegistryClient(
          this.credentialProvider.getCacheEndpoint(),
          this.credentialProvider.isEndpointSecure()
            ? ChannelCredentials.createSsl()
            : ChannelCredentials.createInsecure(),
          channelOptions
        ),
      loggerFactory: this.configuration.getLoggerFactory(),
      clientTimeoutMillis: this.requestTimeoutMs,
      maxIdleMillis: this.configuration
        .getTransportStrategy()
        .getMaxIdleMillis(),
    });

    const context: MiddlewareRequestHandlerContext = {};
    context[CONNECTION_ID_KEY] = functionClientId;
    this.interceptors = this.initializeInterceptors(
      this.configuration.getLoggerFactory(),
      this.configuration.getMiddlewares(),
      context
    );
    this.streamingInterceptors = this.initializeStreamingInterceptors(
      this.configuration.getLoggerFactory(),
      this.configuration.getMiddlewares(),
      context
    );
  }

  close() {
    this.logger.debug('Closing function client');
    this.clientWrapper.getClient().close();
  }

  private validateRequestTimeout(timeout?: number) {
    this.logger.debug(`Request timeout ms: ${String(timeout)}`);
    if (timeout !== undefined && timeout <= 0) {
      throw new InvalidArgumentError(
        'request timeout must be greater than zero.'
      );
    }
  }

  private buildHeaders(): Header[] {
    return [
      new Header('Authorization', this.credentialProvider.getAuthToken()),
      new Header('agent', `nodejs:function:${version}`),
      new Header('runtime-version', `nodejs:${process.versions.node}`),
    ];
  }

  private initializeInterceptors(
    _loggerFactory: MomentoLoggerFactory,
    middlewares: Middleware[],
    middlewareRequestContext: MiddlewareRequestHandlerContext
  ): Interceptor[] {
    return [
      middlewaresInterceptor(
        _loggerFactory,
        middlewares,
        middlewareRequestContext
      ),
      HeaderInterceptor.createHeadersInterceptor(this.buildHeaders()),
      RetryInterceptor.createRetryInterceptor({
        clientName: 'FunctionClient',
        loggerFactory: _loggerFactory,
        overallRequestTimeoutMs: this.requestTimeoutMs,
      }),
    ];
  }

  private initializeStreamingInterceptors(
    _loggerFactory: MomentoLoggerFactory,
    middlewares: Middleware[],
    middlewareRequestContext: MiddlewareRequestHandlerContext
  ): Interceptor[] {
    return [
      middlewaresInterceptor(
        _loggerFactory,
        middlewares,
        middlewareRequestContext
      ),
      HeaderInterceptor.createHeadersInterceptor(this.buildHeaders()),
    ];
  }

  private createMetadata(cacheName: string): Metadata {
    const metadata = new Metadata();
    metadata.set('cache', cacheName);
    return metadata;
  }

  public async putFunction(
    cacheName: string,
    functionName: string,
    wasmBytes: Uint8Array,
    options?: PutFunctionOptions
  ): Promise<PutFunction.Response> {
    try {
      validateCacheName(cacheName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new PutFunction.Error(err)
      );
    }
    this.logger.trace(
      `Issuing 'putFunction' request; cache: ${cacheName}, name: ${functionName}, wasm bytes: ${wasmBytes.length}`
    );
    return await this.sendPutFunction(
      cacheName,
      functionName,
      wasmBytes,
      options
    );
  }

  private async sendPutFunction(
    cacheName: string,
    functionName: string,
    wasmBytes: Uint8Array,
    options?: PutFunctionOptions
  ): Promise<PutFunction.Response> {
    const environment = new Map<string, function_types._EnvironmentValue>();
    for (const [key, value] of Object.entries(
      options?.environmentVariables ?? {}
    )) {
      environment.set(
        key,
        new function_types._EnvironmentValue({literal: value})
      );
    }
    const request = new function_client._PutFunctionRequest({
      cache_name: cacheName,
      name: functionName,
      description: options?.description ?? '',
      environment: environment,
      inline: wasmBytes,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper
        .getClient()
        .PutFunction(
          request,
          metadata,
          {interceptors: this.interceptors},
          (err: ServiceError | null, resp: unknown) => {
            const fn = (
              resp as function_client._PutFunctionResponse | undefined
            )?.function;
            if (fn) {
              resolve(new PutFunction.Success(fn.function_id, functionName));
            } else {
              // resp present but no function is an anomalous response; convertError(null) yields a generic
              // SdkError, so this never throws/hangs.
              this.cacheServiceErrorMapper.resolveOrRejectError({
                err: err,
                errorResponseFactoryFn: e => new PutFunction.Error(e),
                resolveFn: resolve,
                rejectFn: reject,
              });
            }
          }
        );
    });
  }

  public async deleteFunction(
    cacheName: string,
    functionName: string
  ): Promise<DeleteFunction.Response> {
    try {
      validateCacheName(cacheName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new DeleteFunction.Error(err)
      );
    }
    this.logger.trace(
      `Issuing 'deleteFunction' request; cache: ${cacheName}, name: ${functionName}`
    );
    return await this.sendDeleteFunction(cacheName, functionName);
  }

  private async sendDeleteFunction(
    cacheName: string,
    functionName: string
  ): Promise<DeleteFunction.Response> {
    const request = new function_client._DeleteFunctionRequest({
      cache_name: cacheName,
      name: functionName,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper
        .getClient()
        .DeleteFunction(
          request,
          metadata,
          {interceptors: this.interceptors},
          (err: ServiceError | null, resp: unknown) => {
            if (resp) {
              resolve(new DeleteFunction.Success());
            } else {
              this.cacheServiceErrorMapper.resolveOrRejectError({
                err: err,
                errorResponseFactoryFn: e => new DeleteFunction.Error(e),
                resolveFn: resolve,
                rejectFn: reject,
              });
            }
          }
        );
    });
  }

  public async listFunctions(
    cacheName: string
  ): Promise<ListFunctions.Response> {
    try {
      validateCacheName(cacheName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new ListFunctions.Error(err)
      );
    }
    this.logger.trace(`Issuing 'listFunctions' request; cache: ${cacheName}`);
    return await this.sendListFunctions(cacheName);
  }

  private async sendListFunctions(
    cacheName: string
  ): Promise<ListFunctions.Response> {
    const request = new function_client._ListFunctionsRequest({
      cache_name: cacheName,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise((resolve, reject) => {
      const functions: FunctionInfo[] = [];
      const call: ClientReadableStream<function_types._Function> =
        this.clientWrapper.getClient().ListFunctions(request, metadata, {
          interceptors: this.streamingInterceptors,
          deadline: Date.now() + this.requestTimeoutMs,
        });
      call.on('data', (resp: function_types._Function) => {
        try {
          functions.push(
            new FunctionInfo(
              resp.function_id,
              resp.name,
              resp.description,
              resp.latest_version
            )
          );
        } catch (e) {
          call.cancel();
          resolve(
            new ListFunctions.Error(
              new UnknownError(e instanceof Error ? e.message : String(e))
            )
          );
        }
      });
      call.on('error', (err: ServiceError) => {
        this.cacheServiceErrorMapper.resolveOrRejectError({
          err: err,
          errorResponseFactoryFn: e => new ListFunctions.Error(e),
          resolveFn: resolve,
          rejectFn: reject,
        });
      });
      call.on('end', () => {
        resolve(new ListFunctions.Success(functions));
      });
    });
  }

  public async listFunctionVersions(
    functionId: string
  ): Promise<ListFunctionVersions.Response> {
    if (!functionId || functionId.trim().length === 0) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        new InvalidArgumentError('functionId must not be empty'),
        err => new ListFunctionVersions.Error(err)
      );
    }
    this.logger.trace(
      `Issuing 'listFunctionVersions' request; functionId: ${functionId}`
    );
    return await this.sendListFunctionVersions(functionId);
  }

  private async sendListFunctionVersions(
    functionId: string
  ): Promise<ListFunctionVersions.Response> {
    const request = new function_client._ListFunctionVersionsRequest({
      function_id: functionId,
    });
    // listFunctionVersions is keyed by function id, not by cache, so no cache metadata header is set.
    const metadata = new Metadata();
    return await new Promise((resolve, reject) => {
      const versions: FunctionVersionInfo[] = [];
      const call: ClientReadableStream<function_types._FunctionVersion> =
        this.clientWrapper.getClient().ListFunctionVersions(request, metadata, {
          interceptors: this.streamingInterceptors,
          deadline: Date.now() + this.requestTimeoutMs,
        });
      call.on('data', (resp: function_types._FunctionVersion) => {
        try {
          // id and wasm_id are optional proto submessages: their getters return undefined when absent, so
          // guard the nested access (otherwise a sparse row would throw inside this listener — an uncaught
          // exception that never settles the promise).
          const id = resp.id;
          const wasmId = resp.wasm_id;
          versions.push(
            new FunctionVersionInfo(
              id?.id ?? '',
              id?.version ?? 0,
              resp.description,
              wasmId?.id ?? ''
            )
          );
        } catch (e) {
          call.cancel();
          resolve(
            new ListFunctionVersions.Error(
              new UnknownError(e instanceof Error ? e.message : String(e))
            )
          );
        }
      });
      call.on('error', (err: ServiceError) => {
        this.cacheServiceErrorMapper.resolveOrRejectError({
          err: err,
          errorResponseFactoryFn: e => new ListFunctionVersions.Error(e),
          resolveFn: resolve,
          rejectFn: reject,
        });
      });
      call.on('end', () => {
        resolve(new ListFunctionVersions.Success(versions));
      });
    });
  }
}
