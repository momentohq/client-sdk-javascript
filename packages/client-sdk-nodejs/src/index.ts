import {CacheClient, SimpleCacheClient} from './cache-client';
import {TopicClient} from './topic-client';
import * as Configurations from './config/configurations';
import * as AuthClientConfigurations from './config/auth-client-configurations';
import * as TopicConfigurations from './config/topic-configurations';
import * as LeaderboardConfigurations from './config/leaderboard-configurations';
import * as BatchUtils from './batchutils/batch-functions';

import {TopicClientProps} from './topic-client-props';

// Cache Client Response Types
import * as CacheGet from '@gomomento/sdk-core/dist/src/messages/responses/cache-get';
import * as CacheListConcatenateBack from '@gomomento/sdk-core/dist/src/messages/responses/cache-list-concatenate-back';
import * as CacheListConcatenateFront from '@gomomento/sdk-core/dist/src/messages/responses/cache-list-concatenate-front';
import * as CacheListFetch from '@gomomento/sdk-core/dist/src/messages/responses/cache-list-fetch';
import * as CacheListLength from '@gomomento/sdk-core/dist/src/messages/responses/cache-list-length';
import * as CacheListPopBack from '@gomomento/sdk-core/dist/src/messages/responses/cache-list-pop-back';
import * as CacheListPopFront from '@gomomento/sdk-core/dist/src/messages/responses/cache-list-pop-front';
import * as CacheListPushBack from '@gomomento/sdk-core/dist/src/messages/responses/cache-list-push-back';
import * as CacheListPushFront from '@gomomento/sdk-core/dist/src/messages/responses/cache-list-push-front';
import * as CacheListRemoveValue from '@gomomento/sdk-core/dist/src/messages/responses/cache-list-remove-value';
import * as CacheListRetain from '@gomomento/sdk-core/dist/src/messages/responses/cache-list-retain';
import * as CacheSet from '@gomomento/sdk-core/dist/src/messages/responses/cache-set';
import * as CacheDelete from '@gomomento/sdk-core/dist/src/messages/responses/cache-delete';
import * as CacheFlush from '@gomomento/sdk-core/dist/src/messages/responses/cache-flush';
import * as CreateCache from '@gomomento/sdk-core/dist/src/messages/responses/create-cache';
import * as DeleteCache from '@gomomento/sdk-core/dist/src/messages/responses/delete-cache';
import * as ListCaches from '@gomomento/sdk-core/dist/src/messages/responses/list-caches';
import * as CacheSetFetch from '@gomomento/sdk-core/dist/src/messages/responses/cache-set-fetch';
import * as CacheSetContainsElement from '@gomomento/sdk-core/dist/src/messages/responses/cache-set-contains-element';
import * as CacheSetContainsElements from '@gomomento/sdk-core/dist/src/messages/responses/cache-set-contains-elements';
import * as CacheDictionaryFetch from '@gomomento/sdk-core/dist/src/messages/responses/cache-dictionary-fetch';
import * as CacheDictionarySetField from '@gomomento/sdk-core/dist/src/messages/responses/cache-dictionary-set-field';
import * as CacheDictionarySetFields from '@gomomento/sdk-core/dist/src/messages/responses/cache-dictionary-set-fields';
import * as CacheDictionaryGetField from '@gomomento/sdk-core/dist/src/messages/responses/cache-dictionary-get-field';
import * as CacheDictionaryGetFields from '@gomomento/sdk-core/dist/src/messages/responses/cache-dictionary-get-fields';
import * as CacheDictionaryRemoveField from '@gomomento/sdk-core/dist/src/messages/responses/cache-dictionary-remove-field';
import * as CacheDictionaryRemoveFields from '@gomomento/sdk-core/dist/src/messages/responses/cache-dictionary-remove-fields';
import * as CacheDictionaryIncrement from '@gomomento/sdk-core/dist/src/messages/responses/cache-dictionary-increment';
import * as CacheDictionaryLength from '@gomomento/sdk-core/dist/src/messages/responses/cache-dictionary-length';
import * as CacheSetAddElements from '@gomomento/sdk-core/dist/src/messages/responses/cache-set-add-elements';
import * as CacheSetAddElement from '@gomomento/sdk-core/dist/src/messages/responses/cache-set-add-element';
import * as CacheSetRemoveElements from '@gomomento/sdk-core/dist/src/messages/responses/cache-set-remove-elements';
import * as CacheSetRemoveElement from '@gomomento/sdk-core/dist/src/messages/responses/cache-set-remove-element';
import * as CacheSetSample from '@gomomento/sdk-core/dist/src/messages/responses/cache-set-sample';
import * as CacheIncrement from '@gomomento/sdk-core/dist/src/messages/responses/cache-increment';
import * as CacheSetIfNotExists from '@gomomento/sdk-core/dist/src/messages/responses/cache-set-if-not-exists';
import * as CacheSetIfAbsent from '@gomomento/sdk-core/dist/src/messages/responses/cache-set-if-absent';
import * as CacheSetIfPresent from '@gomomento/sdk-core/dist/src/messages/responses/cache-set-if-present';
import * as CacheSetIfEqual from '@gomomento/sdk-core/dist/src/messages/responses/cache-set-if-equal';
import * as CacheSetIfNotEqual from '@gomomento/sdk-core/dist/src/messages/responses/cache-set-if-not-equal';
import * as CacheSetIfAbsentOrEqual from '@gomomento/sdk-core/dist/src/messages/responses/cache-set-if-absent-or-equal';
import * as CacheSetIfPresentAndNotEqual from '@gomomento/sdk-core/dist/src/messages/responses/cache-set-if-present-and-not-equal';
import * as CacheSortedSetPutElement from '@gomomento/sdk-core/dist/src/messages/responses/cache-sorted-set-put-element';
import * as CacheSortedSetPutElements from '@gomomento/sdk-core/dist/src/messages/responses/cache-sorted-set-put-elements';
import * as CacheSortedSetFetch from '@gomomento/sdk-core/dist/src/messages/responses/cache-sorted-set-fetch';
import * as CacheSortedSetGetRank from '@gomomento/sdk-core/dist/src/messages/responses/cache-sorted-set-get-rank';
import * as CacheSortedSetGetScore from '@gomomento/sdk-core/dist/src/messages/responses/cache-sorted-set-get-score';
import * as CacheSortedSetGetScores from '@gomomento/sdk-core/dist/src/messages/responses/cache-sorted-set-get-scores';
import * as CacheSortedSetIncrementScore from '@gomomento/sdk-core/dist/src/messages/responses/cache-sorted-set-increment-score';
import * as CacheSortedSetRemoveElement from '@gomomento/sdk-core/dist/src/messages/responses/cache-sorted-set-remove-element';
import * as CacheSortedSetRemoveElements from '@gomomento/sdk-core/dist/src/messages/responses/cache-sorted-set-remove-elements';
import * as CacheSortedSetLength from '@gomomento/sdk-core/dist/src/messages/responses/cache-sorted-set-length';
import * as CacheSortedSetLengthByScore from '@gomomento/sdk-core/dist/src/messages/responses/cache-sorted-set-length-by-score';
import * as CacheItemGetType from '@gomomento/sdk-core/dist/src/messages/responses/cache-item-get-type';
import * as CacheItemGetTtl from '@gomomento/sdk-core/dist/src/messages/responses/cache-item-get-ttl';
import * as CacheKeyExists from '@gomomento/sdk-core/dist/src/messages/responses/cache-key-exists';
import * as CacheKeysExist from '@gomomento/sdk-core/dist/src/messages/responses/cache-keys-exist';
import * as CacheUpdateTtl from '@gomomento/sdk-core/dist/src/messages/responses/cache-ttl-update';
import * as CacheIncreaseTtl from '@gomomento/sdk-core/dist/src/messages/responses/cache-ttl-increase';
import * as CacheDecreaseTtl from '@gomomento/sdk-core/dist/src/messages/responses/cache-ttl-decrease';
import * as CacheGetBatch from '@gomomento/sdk-core/dist/src/messages/responses/cache-batch-get';
import * as CacheSetBatch from '@gomomento/sdk-core/dist/src/messages/responses/cache-batch-set';

// TopicClient Response Types
import * as TopicPublish from '@gomomento/sdk-core/dist/src/messages/responses/topic-publish';
import * as TopicSubscribe from '@gomomento/sdk-core/dist/src/messages/responses/topic-subscribe';
import {TopicItem} from '@gomomento/sdk-core/dist/src/messages/responses/topic-item';
import {TopicDiscontinuity} from '@gomomento/sdk-core/dist/src/messages/responses/topic-discontinuity';
import {TopicHeartbeat} from '@gomomento/sdk-core/dist/src/messages/responses/topic-heartbeat';

// AuthClient Response Types
import {AuthClient} from './auth-client';
import * as GenerateApiKey from '@gomomento/sdk-core/dist/src/messages/responses/generate-api-key';
import * as RefreshApiKey from '@gomomento/sdk-core/dist/src/messages/responses/refresh-api-key';

import * as GenerateDisposableToken from '@gomomento/sdk-core/dist/src/messages/responses/generate-disposable-token';

// LeaderboardClient Response Types
export {leaderboard} from '@gomomento/sdk-core';
export * from '@gomomento/sdk-core/dist/src/messages/responses/leaderboard';

// Enums representing the different types available for each response
export * from '@gomomento/sdk-core/dist/src/messages/responses/enums';

import {
  ICacheClient,
  IMomentoCache,
  SubscribeCallOptions,
  DictionaryIncrementOptions,
  DictionarySetFieldOptions,
  DictionarySetFieldsOptions,
  SetOptions,
  SortedSetPutElementsOptions,
  CacheInfo,
  CollectionTtl,
  ItemType,
  SortedSetOrder,
  CredentialProvider,
  StringMomentoTokenProvider,
  EnvMomentoTokenProvider,
  MomentoLocalProvider,
  MomentoErrorCode,
  SdkError,
  CacheAlreadyExistsError,
  AuthenticationError,
  CancelledError,
  FailedPreconditionError,
  LimitExceededError,
  InternalServerError,
  InvalidArgumentError,
  UnknownServiceError,
  ServerUnavailableError,
  TimeoutError,
  BadRequestError,
  PermissionError,
  CacheNotFoundError,
  UnknownError,
  MomentoLogger,
  MomentoLoggerFactory,
  NoopMomentoLogger,
  NoopMomentoLoggerFactory,
  ExpiresAt,
  ExpiresIn,
  CacheRole,
  CachePermission,
  TopicRole,
  FunctionRole,
  TopicPermission,
  FunctionPermission,
  Permission,
  Permissions,
  AllDataReadWrite,
  PermissionScope,
  PermissionScopes,
  /**
   * @deprecated please use 'PermissionScope' instead
   */
  TokenScope,
  DisposableTokenScope,
  DisposableTokenScopes,
  CacheName,
  TopicName,
  CacheSelector,
  TopicSelector,
  AllCaches,
  AllTopics,
  LeaderboardOrder,
  ILeaderboard,
  PostUrlWebhookDestination,
  Webhook,
  WebhookDestination,
  WebhookId,
  DeleteWebhook,
  ListWebhooks,
  PutWebhook,
  GetWebhookSecret,
  RotateWebhookSecret,
  WebhookDestinationType,
  ReadConcern,
  CompressionLevel,
} from '@gomomento/sdk-core';

import {Configuration, CacheConfiguration} from './config/configuration';
import {
  AuthConfiguration,
  AuthClientConfiguration,
} from './config/auth-client-configuration';
import {
  TopicConfiguration,
  TopicClientConfiguration,
} from './config/topic-configuration';
import {
  LeaderboardConfiguration,
  LeaderboardClientConfiguration,
} from './config/leaderboard-configuration';
import {PreviewLeaderboardClient} from './preview-leaderboard-client';

export {
  DefaultMomentoLoggerFactory,
  DefaultMomentoLogger,
  DefaultMomentoLoggerLevel,
} from './config/logging/default-momento-logger';

export {
  EligibilityStrategy,
  EligibleForRetryProps,
} from './config/retry/eligibility-strategy';

export {
  RetryStrategy,
  DeterminewhenToRetryRequestProps,
} from './config/retry/retry-strategy';

export {
  ExponentialBackoffRetryStrategy,
  ExponentialBackoffRetryStrategyProps,
} from './config/retry/exponential-backoff-retry-strategy';

export {
  FixedCountRetryStrategy,
  FixedCountRetryStrategyProps,
} from './config/retry/fixed-count-retry-strategy';

export {
  FixedTimeoutRetryStrategy,
  FixedTimeoutRetryStrategyProps,
} from './config/retry/fixed-timeout-retry-strategy';

export {DefaultEligibilityStrategy} from './config/retry/default-eligibility-strategy';

export {
  StaticGrpcConfiguration,
  StaticTransportStrategy,
  TransportStrategy,
  TransportStrategyProps,
} from './config/transport/cache/transport-strategy';

export {
  GrpcConfiguration,
  GrpcConfigurationProps,
} from './config/transport/cache/grpc-configuration';

export {
  StaticTopicGrpcConfiguration,
  StaticTopicTransportStrategy,
  TopicTransportStrategy,
  TopicTransportStrategyProps,
} from './config/transport/topics/transport-strategy';

export {
  TopicGrpcConfiguration,
  TopicGrpcConfigurationProps,
} from './config/transport/topics/grpc-configuration';

export {
  Middleware,
  MiddlewareRequestHandler,
} from './config/middleware/middleware';

export {RequestLoggingMiddleware} from './config/middleware/request-logging-middleware';
export {ExperimentalMetricsCsvMiddleware} from './config/middleware/experimental-metrics-csv-middleware';
export {ExperimentalMetricsLoggingMiddleware} from './config/middleware/experimental-metrics-logging-middleware';
export {ExperimentalActiveRequestCountLoggingMiddleware} from './config/middleware/experimental-active-request-count-middleware';
export {ExperimentalEventLoopPerformanceMetricsMiddleware} from './config/middleware/experimental-event-loop-perf-middleware';
export {ExperimentalGarbageCollectionPerformanceMetricsMiddleware} from './config/middleware/experimental-garbage-collection-middleware';
export {ExampleAsyncMiddleware} from './config/middleware/example-async-middleware';
export {MiddlewareFactory} from './config/middleware/experimental-middleware-factory';

export {
  ICompression,
  CompressionStrategy,
  AutomaticDecompression,
} from './config/compression/compression';

export {
  ICacheClient,
  IMomentoCache,
  CollectionTtl,
  ItemType,
  DictionaryIncrementOptions,
  DictionarySetFieldOptions,
  DictionarySetFieldsOptions,
  SetOptions,
  SortedSetPutElementsOptions,
  SortedSetOrder,
  Configurations,
  Configuration,
  CacheConfiguration,
  CacheClient,
  SimpleCacheClient,
  CacheInfo,
  // Credentials / Auth
  CredentialProvider,
  StringMomentoTokenProvider,
  EnvMomentoTokenProvider,
  MomentoLocalProvider,
  CacheRole,
  CachePermission,
  TopicRole,
  TopicPermission,
  FunctionRole,
  FunctionPermission,
  Permission,
  Permissions,
  AllDataReadWrite,
  PermissionScope,
  /**
   * @deprecated please use 'PermissionScope' instead
   */
  TokenScope,
  PermissionScopes,
  /**
   * @deprecated please use 'PermissionScopes' instead
   */
  PermissionScopes as TokenScopes,
  DisposableTokenScope,
  DisposableTokenScopes,
  CacheName,
  TopicName,
  FunctionName,
  FunctionNamePrefix,
  CacheSelector,
  TopicSelector,
  FunctionSelector,
  AllCaches,
  AllTopics,
  AllFunctions,
  // CacheClient response types
  CacheGet,
  CacheListConcatenateBack,
  CacheListConcatenateFront,
  CacheListFetch,
  CacheListLength,
  CacheListPopBack,
  CacheListPopFront,
  CacheListPushBack,
  CacheListPushFront,
  CacheListRemoveValue,
  CacheListRetain,
  CacheSet,
  CacheSetIfNotExists,
  CacheSetIfAbsent,
  CacheSetIfPresent,
  CacheSetIfEqual,
  CacheSetIfNotEqual,
  CacheSetIfAbsentOrEqual,
  CacheSetIfPresentAndNotEqual,
  CacheDelete,
  CacheFlush,
  CreateCache,
  DeleteCache,
  ListCaches,
  CacheIncrement,
  CacheSetContainsElement,
  CacheSetContainsElements,
  CacheSetFetch,
  CacheDictionaryFetch,
  CacheDictionarySetField,
  CacheDictionarySetFields,
  CacheDictionaryGetField,
  CacheDictionaryGetFields,
  CacheDictionaryRemoveField,
  CacheDictionaryRemoveFields,
  CacheDictionaryIncrement,
  CacheDictionaryLength,
  CacheSetAddElements,
  CacheSetAddElement,
  CacheSetRemoveElements,
  CacheSetRemoveElement,
  CacheSetSample,
  CacheSortedSetPutElement,
  CacheSortedSetPutElements,
  CacheSortedSetFetch,
  CacheSortedSetGetRank,
  CacheSortedSetGetScore,
  CacheSortedSetGetScores,
  CacheSortedSetIncrementScore,
  CacheSortedSetRemoveElement,
  CacheSortedSetRemoveElements,
  CacheSortedSetLength,
  CacheSortedSetLengthByScore,
  CacheItemGetType,
  CacheItemGetTtl,
  CacheKeyExists,
  CacheKeysExist,
  CacheUpdateTtl,
  CacheIncreaseTtl,
  CacheDecreaseTtl,
  CacheGetBatch,
  CacheSetBatch,
  // TopicClient
  TopicConfigurations,
  TopicConfiguration,
  TopicClientConfiguration,
  TopicClient,
  TopicClientProps,
  TopicDiscontinuity,
  TopicHeartbeat,
  TopicItem,
  TopicPublish,
  TopicSubscribe,
  SubscribeCallOptions,
  // Webhooks
  PostUrlWebhookDestination,
  Webhook,
  WebhookDestination,
  WebhookId,
  DeleteWebhook,
  ListWebhooks,
  PutWebhook,
  GetWebhookSecret,
  RotateWebhookSecret,
  WebhookDestinationType,
  // AuthClient response types
  AuthClient,
  AuthConfiguration,
  AuthClientConfiguration,
  AuthClientConfigurations,
  GenerateApiKey,
  /**
   * @deprecated Use 'GenerateApiKey' instead
   */
  GenerateApiKey as GenerateAuthToken,
  RefreshApiKey,
  /**
   * @deprecated Use 'RefreshApiKey' instead
   */
  RefreshApiKey as RefreshAuthToken,
  GenerateDisposableToken,
  ExpiresAt,
  ExpiresIn,
  // LeaderboardClient
  LeaderboardConfigurations,
  LeaderboardConfiguration,
  LeaderboardClientConfiguration,
  PreviewLeaderboardClient,
  LeaderboardOrder,
  ILeaderboard,
  // Errors
  MomentoErrorCode,
  SdkError,
  CacheAlreadyExistsError,
  AuthenticationError,
  CancelledError,
  FailedPreconditionError,
  LimitExceededError,
  InternalServerError,
  InvalidArgumentError,
  UnknownServiceError,
  ServerUnavailableError,
  TimeoutError,
  BadRequestError,
  PermissionError,
  CacheNotFoundError,
  UnknownError,
  // Logging
  MomentoLogger,
  MomentoLoggerFactory,
  NoopMomentoLogger,
  NoopMomentoLoggerFactory,
  BatchUtils,
  ReadConcern,
  CompressionLevel,
};
