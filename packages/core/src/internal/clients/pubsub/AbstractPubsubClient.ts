import {
  sleep,
  truncateString,
  validateCacheName,
  validateTopicName,
} from '../../utils';
import {MomentoErrorCode} from '../../../errors';
import {
  TopicPublish,
  TopicItem,
  MomentoLogger,
  TopicSubscribe,
  SubscribeCallOptions,
  MomentoLoggerFactory,
  TopicDiscontinuity,
  TopicHeartbeat,
} from '../../../index';
import {SubscriptionState} from '../../subscription-state';
import {IPubsubClient} from './IPubsubClient';
import {ICacheServiceErrorMapper} from '../../../errors/ICacheServiceErrorMapper';

/**
 * Encapsulates parameters for the `sendSubscribe` method.
 */
export interface SendSubscribeOptions {
  cacheName: string;
  topicName: string;
  onItem: (item: TopicItem) => void;
  onError: (
    error: TopicSubscribe.Error,
    subscription: TopicSubscribe.Subscription
  ) => void;
  onDiscontinuity: (discontinuity: TopicDiscontinuity) => void;
  onHeartbeat: (heartbeat: TopicHeartbeat) => void;
  onConnectionLost: () => void;
  subscriptionState: SubscriptionState;
  subscription: TopicSubscribe.Subscription;

  /**
   * Whether the stream was restarted due to an error. If so, we skip the end stream handler
   * logic as the error handler will have restarted the stream.
   */
  restartedDueToError: boolean;
  /**
   * If the first message is an error, we return an error immediately and do not subscribe.
   */
  firstMessage: boolean;
}

/**
 * Encapsulates parameters for the subscribe callback prepare methods.
 */
export interface PrepareSubscribeCallbackOptions extends SendSubscribeOptions {
  /**
   * The promise resolve function.
   */
  resolve: (
    value: TopicSubscribe.Response | PromiseLike<TopicSubscribe.Subscription>
  ) => void;
}

export abstract class AbstractPubsubClient<TGrpcError>
  implements IPubsubClient
{
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly logger: MomentoLogger;
  private readonly cacheServiceErrorMapper: ICacheServiceErrorMapper<TGrpcError>;

  protected constructor(
    loggerFactory: MomentoLoggerFactory,
    logger: MomentoLogger,
    cacheServiceErrorMapper: ICacheServiceErrorMapper<TGrpcError>
  ) {
    this.loggerFactory = loggerFactory;
    this.logger = logger;
    this.cacheServiceErrorMapper = cacheServiceErrorMapper;
  }

  protected getLogger(): MomentoLogger {
    return this.logger;
  }

  protected getCacheServiceErrorMapper(): ICacheServiceErrorMapper<TGrpcError> {
    return this.cacheServiceErrorMapper;
  }

  public async publish(
    cacheName: string,
    topicName: string,
    value: string | Uint8Array
  ): Promise<TopicPublish.Response> {
    try {
      validateCacheName(cacheName);
      validateTopicName(topicName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new TopicPublish.Error(err)
      );
      // )  new TopicPublish.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(
      'Issuing publish request; topic: %s, message length: %s',
      truncateString(topicName),
      value.length
    );

    return await this.sendPublish(cacheName, topicName, value);
  }

  protected abstract sendPublish(
    cacheName: string,
    topicName: string,
    value: string | Uint8Array
  ): Promise<TopicPublish.Response>;

  public async subscribe(
    cacheName: string,
    topicName: string,
    options: SubscribeCallOptions
  ): Promise<TopicSubscribe.Response> {
    try {
      validateCacheName(cacheName);
      validateTopicName(topicName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new TopicSubscribe.Error(err)
      );
    }
    this.logger.trace(
      'Issuing subscribe request; topic: %s',
      truncateString(topicName)
    );

    const onItem =
      options.onItem ??
      (() => {
        return;
      });
    const onError =
      options.onError ??
      (() => {
        return;
      });
    const onDiscontinuity =
      options.onDiscontinuity ??
      (() => {
        return;
      });
    const onHeartbeat =
      options.onHeartbeat ??
      (() => {
        return;
      });
    const onConnectionLost =
      options.onConnectionLost ??
      (() => {
        return;
      });

    const subscriptionState = new SubscriptionState();
    const subscription = new TopicSubscribe.Subscription(
      this.loggerFactory,
      subscriptionState
    );
    return await this.sendSubscribe({
      cacheName: cacheName,
      topicName: topicName,
      onItem: onItem,
      onError: onError,
      onDiscontinuity: onDiscontinuity,
      onHeartbeat: onHeartbeat,
      onConnectionLost: onConnectionLost,
      subscriptionState: subscriptionState,
      subscription: subscription,
      restartedDueToError: false,
      firstMessage: true,
    });
  }

  protected abstract sendSubscribe(
    options: SendSubscribeOptions
  ): Promise<TopicSubscribe.Response>;

  protected prepareEndCallback(
    options: PrepareSubscribeCallbackOptions
  ): () => void {
    return () => {
      // We want to restart on stream end, except if:
      // 1. The stream was cancelled by the caller.
      // 2. The stream was restarted following an error.
      if (
        options.restartedDueToError &&
        options.subscriptionState.isSubscribed
      ) {
        this.logger.trace(
          'Stream ended after error but was restarted on topic: %s',
          options.topicName
        );
        options.restartedDueToError = false;
        options.onConnectionLost?.();
        return;
      } else if (!options.subscriptionState.isSubscribed) {
        this.logger.trace(
          'Stream ended after unsubscribe on topic: %s',
          options.topicName
        );
        options.onConnectionLost?.();
        return;
      }

      this.logger.trace(
        'Stream ended on topic: %s; restarting.',
        options.topicName
      );

      // When restarting the stream we do not do anything with the promises,
      // because we should have already returned the subscription object to the user.
      this.sendSubscribe(options)
        .then(() => {
          return;
        })
        .catch(() => {
          return;
        });
    };
  }

  protected handleSubscribeError(
    options: PrepareSubscribeCallbackOptions,
    momentoError: TopicSubscribe.Error,
    shouldReconnectSubscription: boolean
  ): void {
    this.logger.trace('Handling subscribe error');
    // When the first message is an error, an irrecoverable error has happened,
    // eg the cache does not exist. The user should not receive a subscription
    // object but an error.
    if (options.firstMessage) {
      this.logger.trace(
        'First message on subscription was an error; topic: %s, error: %s',
        truncateString(options.topicName),
        momentoError.toString()
      );

      options.resolve(momentoError);
      options.subscription.unsubscribe();
      return;
    }

    this.logger.trace(
      'Subscribe error was not the first message on the stream.'
    );

    // Another special case is when the cache is not found.
    // This happens here if the user deletes the cache in the middle of
    // a subscription.
    if (momentoError.errorCode() === MomentoErrorCode.CACHE_NOT_FOUND_ERROR) {
      this.logger.trace(
        'Stream ended due to cache not found error on topic: %s',
        options.topicName
      );
      options.subscription.unsubscribe();
      options.onError(momentoError, options.subscription);
      return;
    }

    this.logger.trace(
      'Checking to see if we should attempt to reconnect subscription.'
    );

    // For several types of errors having to with network interruptions, we wish to
    // transparently restart the stream instead of propagating an error.
    if (shouldReconnectSubscription) {
      options.restartedDueToError = true;
      const reconnectDelayMillis = 500;
      this.logger.trace(
        'Error occurred on subscription, possibly a network interruption. Will attempt to restart stream in %s ms.',
        reconnectDelayMillis
      );
      sleep(reconnectDelayMillis)
        .then(() => {
          if (!options.subscriptionState.isSubscribed) {
            this.logger.trace(
              'Subscription was unsubscribed before retrying; aborting reconnect.'
            );
            return;
          }

          // When restarting the stream we do not do anything with the promises,
          // because we should have already returned the subscription object to the user.
          this.sendSubscribe(options)
            .then(() => {
              return;
            })
            .catch(e => {
              this.logger.trace(
                'Error when calling sendSubscribe to reconnect: %s',
                e
              );
              return;
            });
          return;
        })
        .catch(e => {
          this.logger.trace(
            'Error when sleeping prior to sendSubscribe to reconnect: %s',
            e
          );
          return;
        });
      return;
    }

    this.logger.trace('Subscribe error was not a re-connectable error.');

    this.logger.trace(
      'Subscribe error was not one of the known error types; calling error handler.'
    );
    options.onError(momentoError, options.subscription);
  }
}
