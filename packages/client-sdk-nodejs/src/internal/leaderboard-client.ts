import {
  CredentialProvider,
  InvalidArgumentError,
  LeaderboardDelete,
  LeaderboardFetch,
  LeaderboardGetRank,
  LeaderboardLength,
  LeaderboardRemoveElements,
  LeaderboardUpsert,
  MomentoLogger,
  MomentoLoggerFactory,
  LeaderboardOrder,
} from '@gomomento/sdk-core';
import {LeaderboardClientProps} from '../leaderboard-client-props';
import {normalizeSdkError} from '@gomomento/sdk-core/dist/src/errors';
import {
  validateCacheName,
  validateLeaderboardName,
  validateLeaderboardRanks,
  validateLeaderboardOffset,
  validateLeaderboardCount,
  validateLeaderboardNumberOfElements,
  validateSortedSetScores,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {LeaderboardConfiguration} from '../config/leaderboard-configuration';
import {InternalLeaderboardClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {leaderboard} from '@gomomento/generated-types/dist/leaderboard';
import _Element = leaderboard._Element;
import {IdleGrpcClientWrapper} from './grpc/idle-grpc-client-wrapper';
import {GrpcClientWrapper} from './grpc/grpc-client-wrapper';
// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
// import {TextEncoder} from 'util';
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  ChannelCredentials,
  Interceptor,
  Metadata,
  ServiceError,
  status,
} from '@grpc/grpc-js';
import {version} from '../../package.json';
import {_RankedElement} from '@gomomento/sdk-core/dist/src/messages/responses/grpc-response-types';

export class LeaderboardDataClient implements InternalLeaderboardClient {
  private readonly configuration: LeaderboardConfiguration;
  // private readonly textEncoder: TextEncoder;
  private readonly credentialProvider: CredentialProvider;
  private readonly logger: MomentoLogger;
  private readonly requestTimeoutMs: number;
  private readonly clientWrapper: GrpcClientWrapper<leaderboard.LeaderboardClient>;
  private readonly interceptors: Interceptor[];

  constructor(props: LeaderboardClientProps) {
    this.configuration = props.configuration;
    this.credentialProvider = props.credentialProvider;
    this.logger = this.configuration.getLoggerFactory().getLogger(this);
    const grpcConfig = this.configuration
      .getTransportStrategy()
      .getGrpcConfig();

    this.requestTimeoutMs = grpcConfig.getDeadlineMillis();
    this.validateRequestTimeout(this.requestTimeoutMs);
    this.logger.debug(
      `Creating leaderboard client using endpoint: '${this.credentialProvider.getCacheEndpoint()}'`
    );

    this.clientWrapper = new IdleGrpcClientWrapper({
      clientFactoryFn: () =>
        new leaderboard.LeaderboardClient(
          this.credentialProvider.getCacheEndpoint(),
          ChannelCredentials.createSsl(),
          {
            // default value for max session memory is 10mb.  Under high load, it is easy to exceed this,
            // after which point all requests will fail with a client-side RESOURCE_EXHAUSTED exception.
            'grpc-node.max_session_memory': grpcConfig.getMaxSessionMemoryMb(),
            // This flag controls whether channels use a shared global pool of subchannels, or whether
            // each channel gets its own subchannel pool.  The default value is 0, meaning a single global
            // pool.  Setting it to 1 provides significant performance improvements when we instantiate more
            // than one grpc client.
            'grpc.use_local_subchannel_pool': 1,
            // The following settings are based on https://github.com/grpc/grpc/blob/e35db43c07f27cc13ec061520da1ed185f36abd4/doc/keepalive.md ,
            // and guidance provided on various github issues for grpc-node. They will enable keepalive pings when a
            // client connection is idle.
            'grpc.keepalive_permit_without_calls': 1,
            'grpc.keepalive_timeout_ms': 1000,
            'grpc.keepalive_time_ms': 5000,
          }
        ),
      loggerFactory: this.configuration.getLoggerFactory(),
      maxIdleMillis: this.configuration
        .getTransportStrategy()
        .getMaxIdleMillis(),
    });

    // this.textEncoder = new TextEncoder();
    this.interceptors = this.initializeInterceptors(
      this.configuration.getLoggerFactory()
    );
  }

  private validateRequestTimeout(timeout?: number) {
    this.logger.debug(`Request timeout ms: ${String(timeout)}`);
    if (timeout !== undefined && timeout <= 0) {
      throw new InvalidArgumentError(
        'request timeout must be greater than zero.'
      );
    }
  }

  private initializeInterceptors(
    loggerFactory: MomentoLoggerFactory
  ): Interceptor[] {
    const headers = [
      new Header('Authorization', this.credentialProvider.getAuthToken()),
      new Header('Agent', `nodejs:${version}`),
    ];
    return [
      new HeaderInterceptorProvider(headers).createHeadersInterceptor(),
      ClientTimeoutInterceptor(this.requestTimeoutMs),
    ];
  }

  private createMetadata(cacheName: string): Metadata {
    const metadata = new Metadata();
    metadata.set('cache', cacheName);
    return metadata;
  }

  public async leaderboardUpsert(
    cacheName: string,
    leaderboardName: string,
    elements: Map<bigint | number, number>
  ): Promise<LeaderboardUpsert.Response> {
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
      validateLeaderboardNumberOfElements(elements.size);
    } catch (err) {
      return new LeaderboardUpsert.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(
      `Issuing 'upsert' request; cache: ${cacheName}, leaderboard: ${leaderboardName}, number of elements: ${elements.size}`
    );
    return await this.sendLeaderboardUpsert(
      cacheName,
      leaderboardName,
      elements
    );
  }

  private async sendLeaderboardUpsert(
    cacheName: string,
    leaderboardName: string,
    elements: Map<bigint | number, number>
  ): Promise<LeaderboardUpsert.Response> {
    const convertedElements: _Element[] = [];
    elements.forEach((score, id) =>
      convertedElements.push(new _Element({id: String(id), score: score}))
    );
    const request = new leaderboard._UpsertElementsRequest({
      cache_name: cacheName,
      leaderboard: leaderboardName,
      elements: convertedElements,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.getClient().UpsertElements(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err: ServiceError | null, resp: unknown) => {
          if (resp) {
            resolve(new LeaderboardUpsert.Success());
          } else {
            resolve(new LeaderboardUpsert.Error(cacheServiceErrorMapper(err)));
          }
        }
      );
    });
  }

  public async leaderboardFetchByScore(
    cacheName: string,
    leaderboardName: string,
    order?: LeaderboardOrder,
    minScore?: number,
    maxScore?: number,
    offset?: bigint | number,
    count?: bigint | number
  ): Promise<LeaderboardFetch.Response> {
    const offsetValue = offset ? BigInt(offset) : 0n;
    const countValue = count ? BigInt(count) : 8192n;
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
      validateSortedSetScores(minScore, maxScore);
      validateLeaderboardOffset(offsetValue);
      validateLeaderboardCount(countValue);
    } catch (err) {
      return new LeaderboardFetch.Error(normalizeSdkError(err as Error));
    }
    await delay(1); // to keep async in the API signature
    return new LeaderboardFetch.Error(
      normalizeSdkError(new Error('Not Yet Implemented'))
    );
  }

  public async leaderboardFetchByRank(
    cacheName: string,
    leaderboardName: string,
    startRank?: bigint | number,
    endRank?: bigint | number,
    order?: LeaderboardOrder
  ): Promise<LeaderboardFetch.Response> {
    const rankOrder = order ?? LeaderboardOrder.Ascending;
    const startRankValue = startRank === undefined ? 0n : BigInt(startRank);
    const endRankValue =
      endRank === undefined ? startRankValue + 8192n : BigInt(endRank);
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
      validateLeaderboardRanks(startRankValue, endRankValue);
    } catch (err) {
      return new LeaderboardFetch.Error(normalizeSdkError(err as Error));
    }

    this.logger.trace(
      "Issuing 'leaderboardFetchByRank' request; startRank: %s, endRank : %s, order: %s",
      startRankValue.toString(),
      endRankValue.toString(),
      rankOrder.toString()
    );
    return await this.sendLeaderboardFetchByRank(
      cacheName,
      leaderboardName,
      startRankValue,
      endRankValue,
      rankOrder
    );
  }

  private async sendLeaderboardFetchByRank(
    cacheName: string,
    leaderboardName: string,
    startRank: bigint,
    endRank: bigint,
    order: LeaderboardOrder
  ): Promise<LeaderboardFetch.Response> {
    const protoBufOrder =
      order === LeaderboardOrder.Descending
        ? leaderboard._Order.DESCENDING
        : leaderboard._Order.ASCENDING;

    const protoBufRankRange = new leaderboard._RankRange({
      start_inclusive: startRank.toString(),
      end_exclusive: endRank.toString(),
    });

    const request = new leaderboard._GetByRankRequest({
      cache_name: cacheName,
      leaderboard: leaderboardName,
      rank_range: protoBufRankRange,
      order: protoBufOrder,
    });
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.getClient().GetByRank(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err: ServiceError | null, resp: unknown) => {
          if (resp) {
            const foundElements = (resp as leaderboard._GetByRankResponse)
              .elements;
            const convertedElements: _RankedElement[] = foundElements.map(
              element => {
                return new _RankedElement(
                  BigInt(element.id),
                  element.score,
                  BigInt(element.rank)
                );
              }
            );
            resolve(new LeaderboardFetch.Found(convertedElements));
          } else {
            if (err?.code === status.NOT_FOUND) {
              resolve(new LeaderboardFetch.NotFound());
            } else {
              resolve(new LeaderboardFetch.Error(cacheServiceErrorMapper(err)));
            }
          }
        }
      );
    });
  }

  public async leaderboardGetRank(
    cacheName: string,
    leaderboardName: string,
    id: bigint | number,
    order?: LeaderboardOrder
  ): Promise<LeaderboardGetRank.Response> {
    // fill in default values
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
    } catch (err) {
      return new LeaderboardGetRank.Error(normalizeSdkError(err as Error));
    }
    await delay(1); // to keep async in the API signature
    return new LeaderboardGetRank.Error(
      normalizeSdkError(new Error('Not Yet Implemented'))
    );
  }

  public async leaderboardLength(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardLength.Response> {
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
    } catch (err) {
      return new LeaderboardLength.Error(normalizeSdkError(err as Error));
    }
    await delay(1); // to keep async in the API signature
    return new LeaderboardLength.Error(
      normalizeSdkError(new Error('Not Yet Implemented'))
    );
  }

  public async leaderboardRemoveElements(
    cacheName: string,
    leaderboardName: string,
    ids: Array<bigint | number>
  ): Promise<LeaderboardRemoveElements.Response> {
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
    } catch (err) {
      return new LeaderboardRemoveElements.Error(
        normalizeSdkError(err as Error)
      );
    }
    await delay(1); // to keep async in the API signature
    return new LeaderboardRemoveElements.Error(
      normalizeSdkError(new Error('Not Yet Implemented'))
    );
  }

  public async leaderboardDelete(
    cacheName: string,
    leaderboardName: string
  ): Promise<LeaderboardDelete.Response> {
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
    } catch (err) {
      return new LeaderboardDelete.Error(normalizeSdkError(err as Error));
    }
    await delay(1); // to keep async in the API signature
    return new LeaderboardDelete.Error(
      normalizeSdkError(new Error('Not Yet Implemented'))
    );
  }
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
