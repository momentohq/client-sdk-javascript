import {InternalLeaderboardClient} from '@gomomento/sdk-core/dist/src/internal/clients';
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
  SortedSetOrder,
} from '@gomomento/sdk-core';
import {LeaderboardClientProps} from '../leaderboard-client-props';
import {normalizeSdkError} from '@gomomento/sdk-core/dist/src/errors';
import {
  validateCacheName,
  validateLeaderboardName,
  validateSortedSetRanks,
  validateSortedSetScores,
  validateSortedSetOffset,
  validateSortedSetCount,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {delay} from '@gomomento/common-integration-tests';
import {LeaderboardConfiguration} from '../config/leaderboard-configuration';

export class LeaderboardClient implements InternalLeaderboardClient {
  private readonly configuration: LeaderboardConfiguration;
  private readonly credentialProvider: CredentialProvider;
  private readonly logger: MomentoLogger;
  private readonly requestTimeoutMs: number;
  // TODO: add LeaderboardClient class member

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

    // TODO: create LeaderboardClient
  }

  private validateRequestTimeout(timeout?: number) {
    this.logger.debug(`Request timeout ms: ${String(timeout)}`);
    if (timeout !== undefined && timeout <= 0) {
      throw new InvalidArgumentError(
        'request timeout must be greater than zero.'
      );
    }
  }

  public async leaderboardUpsert(
    cacheName: string,
    leaderboardName: string,
    elements: Map<bigint | number, number>
  ): Promise<LeaderboardUpsert.Response> {
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
    } catch (err) {
      return new LeaderboardUpsert.Error(normalizeSdkError(err as Error));
    }
    await delay(1); // to keep async in the API signature
    return new LeaderboardUpsert.Error(
      normalizeSdkError(new Error('Not Yet Implemented'))
    );
  }

  public async leaderboardFetchByScore(
    cacheName: string,
    leaderboardName: string,
    order?: SortedSetOrder,
    minScore?: number,
    maxScore?: number,
    offset?: number,
    count?: number
  ): Promise<LeaderboardFetch.Response> {
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
      validateSortedSetScores(minScore, maxScore);
      if (offset !== undefined) {
        validateSortedSetOffset(offset);
      }
      if (count !== undefined) {
        validateSortedSetCount(count);
      }
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
    startRank: number,
    endRank?: number,
    order?: SortedSetOrder
  ): Promise<LeaderboardFetch.Response> {
    try {
      validateCacheName(cacheName);
      validateLeaderboardName(leaderboardName);
      validateSortedSetRanks(startRank, endRank);
    } catch (err) {
      return new LeaderboardFetch.Error(normalizeSdkError(err as Error));
    }
    await delay(1); // to keep async in the API signature
    return new LeaderboardFetch.Error(
      normalizeSdkError(new Error('Not Yet Implemented'))
    );
  }

  public async leaderboardGetRank(
    cacheName: string,
    leaderboardName: string,
    id: bigint | number
  ): Promise<LeaderboardGetRank.Response> {
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
