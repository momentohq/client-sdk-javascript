import {
  MomentoLocalMiddlewareRequestHandler,
  MomentoLocalMiddleware,
} from '../momento-local-middleware';
import {TestRetryMetricsCollector} from '../test-retry-metrics-collector';
import {
  CredentialProvider,
  MomentoErrorCode,
  MomentoLogger,
} from '@gomomento/sdk-core';
import {
  CacheClient,
  Configurations,
  DefaultMomentoLoggerFactory,
} from '../../src';
import {v4} from 'uuid';
import {
  MomentoRPCMethod,
  MomentoRPCMethodMetadataConverter,
} from '../../src/config/retry/momento-rpc-method';
import {Metadata} from '@grpc/grpc-js';
import {MiddlewareMetadata} from '../../src/config/middleware/middleware';
import {MomentoErrorCodeMetadataConverter} from '../../src/config/retry/momento-error-code-metadata-converter';

describe('MomentoLocalMiddleware', () => {
  let middleware: MomentoLocalMiddleware;
  let cacheClient: CacheClient;
  let testMetricsCollector: TestRetryMetricsCollector;
  let momentoLogger: MomentoLogger;

  beforeEach(async () => {
    testMetricsCollector = new TestRetryMetricsCollector();
    momentoLogger = new DefaultMomentoLoggerFactory().getLogger(
      'MomentoLocalMiddleware'
    );
    middleware = new MomentoLocalMiddleware({
      logger: momentoLogger,
      testMetricsCollector,
      requestId: v4(),
    });

    // Create CacheClient with middleware enabled
    cacheClient = await CacheClient.create({
      configuration: Configurations.Laptop.v1().withMiddlewares([middleware]),
      credentialProvider:
        CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY'),
      defaultTtlSeconds: 60,
    });
  });

  test('should add a timestamp on request body for a single cache', async () => {
    const cacheName = v4();
    await cacheClient.get(cacheName, 'key');
    const allMetrics = testMetricsCollector.getAllMetrics();
    expect(allMetrics).toEqual({
      [cacheName]: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        [MomentoRPCMethod.Get]: expect.arrayContaining([expect.any(Number)]),
      },
    });
  });

  test('should add a timestamp on request body for multiple caches', async () => {
    const cacheName1 = v4();
    const cacheName2 = v4();
    await cacheClient.get(cacheName1, 'key');
    await cacheClient.get(cacheName2, 'key');
    const allMetrics = testMetricsCollector.getAllMetrics();
    expect(allMetrics).toEqual({
      [cacheName1]: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        [MomentoRPCMethod.Get]: expect.arrayContaining([expect.any(Number)]),
      },
      [cacheName2]: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        [MomentoRPCMethod.Get]: expect.arrayContaining([expect.any(Number)]),
      },
    });
  });

  test('should add a timestamp on request body for multiple requests', async () => {
    const cacheName = v4();
    await cacheClient.set(cacheName, 'key', 'value');
    await cacheClient.get(cacheName, 'key');
    const allMetrics = testMetricsCollector.getAllMetrics();
    expect(allMetrics).toEqual({
      [cacheName]: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        [MomentoRPCMethod.Get]: expect.arrayContaining([expect.any(Number)]),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        [MomentoRPCMethod.Set]: expect.arrayContaining([expect.any(Number)]),
      },
    });
  });

  test('should add correct metadata to grpc metadata', async () => {
    const requestId = v4();
    const returnError = MomentoErrorCode.SERVER_UNAVAILABLE;
    const errorRpcList = [MomentoRPCMethod.Get, MomentoRPCMethod.Set];
    const errorCount = 3;
    const delayRpcList = [MomentoRPCMethod.Get, MomentoRPCMethod.Set];
    const delayMillis = 1000;
    const delayCount = 3;
    const streamErrorRpcList = [
      MomentoRPCMethod.TopicSubscribe,
      MomentoRPCMethod.TopicPublish,
    ];
    const streamError = MomentoErrorCode.SERVER_UNAVAILABLE;
    const streamErrorMessageLimit = 3;

    const grpcMetadata = new Metadata();
    const middlewareMetadata: MiddlewareMetadata = {
      _grpcMetadata: grpcMetadata,
      toJsonObject: () => ({}), // Mock implementation
      toJsonString: () => JSON.stringify({}), // Mock implementation
    };
    const momentoLocalMiddlewareArgs = {
      logger: momentoLogger,
      testMetricsCollector,
      requestId,
      returnError,
      errorRpcList,
      errorCount,
      delayRpcList,
      delayMillis,
      delayCount,
      streamErrorRpcList,
      streamError,
      streamErrorMessageLimit,
    };

    const handler = new MomentoLocalMiddlewareRequestHandler(
      momentoLocalMiddlewareArgs
    );
    await handler.onRequestMetadata(middlewareMetadata);

    const expectedErrorRpcsList = [
      `${MomentoRPCMethodMetadataConverter.convert(
        MomentoRPCMethod.Get
      )} ${MomentoRPCMethodMetadataConverter.convert(MomentoRPCMethod.Set)}`,
    ];
    const expectedReturnError =
      MomentoErrorCodeMetadataConverter.convert(returnError);
    const expectedStreamErrorRpcsList = [
      `${MomentoRPCMethodMetadataConverter.convert(
        MomentoRPCMethod.TopicSubscribe
      )} ${MomentoRPCMethodMetadataConverter.convert(
        MomentoRPCMethod.TopicPublish
      )}`,
    ];
    const expectedStreamError =
      MomentoErrorCodeMetadataConverter.convert(streamError);

    expect(grpcMetadata.get('request-id')).toEqual([requestId]);
    expect(grpcMetadata.get('return-error')).toEqual([expectedReturnError]);
    expect(grpcMetadata.get('error-rpcs')).toEqual(expectedErrorRpcsList);
    expect(grpcMetadata.get('error-count')).toEqual([errorCount.toString()]);
    expect(grpcMetadata.get('delay-rpcs')).toEqual(expectedErrorRpcsList);
    expect(grpcMetadata.get('delay-ms')).toEqual([delayMillis.toString()]);
    expect(grpcMetadata.get('delay-count')).toEqual([delayCount.toString()]);
    expect(grpcMetadata.get('stream-error-rpcs')).toEqual(
      expectedStreamErrorRpcsList
    );
    expect(grpcMetadata.get('stream-error')).toEqual([expectedStreamError]);
    expect(grpcMetadata.get('stream-error-message-limit')).toEqual([
      streamErrorMessageLimit.toString(),
    ]);
  });
});
