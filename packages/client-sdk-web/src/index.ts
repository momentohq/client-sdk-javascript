import {CacheClient} from './cache-client';
import {AuthClient} from './auth-client';
import {TopicClient} from './topic-client';
import {PreviewLeaderboardClient} from './preview-leaderboard-client';
import {PreviewStorageClient} from './preview-storage-client';
import * as Configurations from './config/configurations';
import * as TopicConfigurations from './config/topic-configurations';
import * as LeaderboardConfigurations from './config/leaderboard-configurations';
import * as StorageConfigurations from './config/storage-configurations';

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
import * as CacheSetIfPresentAndNotEqual from '@gomomento/sdk-core/dist/src/messages/responses/cache-set-if-present-and-not-equal';
import * as CacheSetIfAbsentOrEqual from '@gomomento/sdk-core/dist/src/messages/responses/cache-set-if-absent-or-equal';
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

// AuthClient Response Types
import * as GenerateApiKey from '@gomomento/sdk-core/dist/src/messages/responses/generate-api-key';
import * as RefreshApiKey from '@gomomento/sdk-core/dist/src/messages/responses/refresh-api-key';
import * as GenerateDisposableToken from '@gomomento/sdk-core/dist/src/messages/responses/generate-disposable-token';

import {
  ICacheClient,
  IMomentoCache,
  SubscribeCallOptions,
  CacheInfo,
  CollectionTtl,
  ItemType,
  SortedSetOrder,
  CredentialProvider,
  StringMomentoTokenProvider,
  EnvMomentoTokenProvider,
  MomentoErrorCode,
  SdkError,
  CacheAlreadyExistsError,
  StoreAlreadyExistsError,
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
  StoreNotFoundError,
  StoreItemNotFoundError,
  UnknownError,
  MomentoLogger,
  MomentoLoggerFactory,
  NoopMomentoLogger,
  NoopMomentoLoggerFactory,
  AllDataReadWrite,
  CachePermission,
  TopicPermission,
  Permission,
  Permissions,
  PermissionScope,
  /**
   * @deprecated please use PermissionScope instead
   */
  TokenScope,
  PermissionScopes,
  DisposableTokenScope,
  DisposableTokenScopes,
  ExpiresIn,
  ExpiresAt,
  CacheName,
  TopicName,
  CacheSelector,
  TopicSelector,
  AllCaches,
  AllTopics,
  CacheRole,
  TopicRole,
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
  StoreInfo,
} from '@gomomento/sdk-core';

import {Configuration} from './config/configuration';

import {
  TopicConfiguration,
  TopicClientConfiguration,
} from './config/topic-configuration';

import {
  LeaderboardClientConfiguration,
  LeaderboardConfiguration,
} from './config/leaderboard-configuration';

export * from '@gomomento/sdk-core/dist/src/messages/responses/storage';

export {
  DefaultMomentoLoggerFactory,
  DefaultMomentoLogger,
  DefaultMomentoLoggerLevel,
} from './config/logging/default-momento-logger';

export {
  ICacheClient,
  IMomentoCache,
  CollectionTtl,
  ItemType,
  SortedSetOrder,
  Configuration,
  Configurations,
  CacheClient,
  AuthClient,
  CacheInfo,
  CredentialProvider,
  StringMomentoTokenProvider,
  EnvMomentoTokenProvider,
  AllDataReadWrite,
  CacheRole,
  TopicRole,
  CachePermission,
  TopicPermission,
  Permission,
  Permissions,
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
  CacheSelector,
  TopicSelector,
  AllCaches,
  AllTopics,
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
  CacheSetIfPresentAndNotEqual,
  CacheSetIfAbsentOrEqual,
  CacheSetBatch,
  CacheGetBatch,
  CacheDelete,
  CacheFlush,
  CreateCache,
  DeleteCache,
  ListCaches,
  CacheIncrement,
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
  TopicConfigurations,
  TopicConfiguration,
  TopicClientConfiguration,
  TopicClient,
  TopicItem,
  TopicPublish,
  TopicSubscribe,
  SubscribeCallOptions,
  LeaderboardConfigurations,
  LeaderboardConfiguration,
  LeaderboardClientConfiguration,
  PreviewLeaderboardClient,
  LeaderboardOrder,
  ILeaderboard,
  GenerateApiKey,
  /**
   * @deprecated - please use GenerateApiKey
   */
  GenerateApiKey as GenerateAuthToken,
  RefreshApiKey,
  /**
   * @deprecated - please use RefreshApiKey
   */
  RefreshApiKey as RefreshAuthToken,
  GenerateDisposableToken,
  ExpiresAt,
  ExpiresIn,
  MomentoErrorCode,
  SdkError,
  CacheAlreadyExistsError,
  StoreAlreadyExistsError,
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
  StoreNotFoundError,
  StoreItemNotFoundError,
  UnknownError,
  MomentoLogger,
  MomentoLoggerFactory,
  NoopMomentoLogger,
  NoopMomentoLoggerFactory,
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
  ReadConcern,
  // Storage
  StoreInfo,
  StorageConfigurations,
  PreviewStorageClient,
};
