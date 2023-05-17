import {
  truncateString,
  validateCacheName,
  validateTopicName,
} from '../../utils';
import {MomentoErrorCode, normalizeSdkError} from '../../../errors';
import {
  CredentialProvider,
  TopicPublish,
  TopicItem,
  MomentoLogger,
  TopicSubscribe,
  SubscribeCallOptions,
} from '../../../index';
import {SubscriptionState} from '../../subscription-state';
import {IPubsubClient} from './IPubsubClient';

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
  subscriptionState: SubscriptionState;
  subscription: TopicSubscribe.Subscription;
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

export abstract class AbstractPubsubClient implements IPubsubClient {
  protected readonly logger: MomentoLogger;
  protected readonly credentialProvider: CredentialProvider;

  public getEndpoint(): string {
    const endpoint = this.credentialProvider.getCacheEndpoint();
    this.logger.debug(`Using cache endpoint: ${endpoint}`);
    return endpoint;
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
      return new TopicPublish.Error(normalizeSdkError(err as Error));
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
      return new TopicSubscribe.Error(normalizeSdkError(err as Error));
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

    const subscriptionState = new SubscriptionState();
    const subscription = new TopicSubscribe.Subscription(subscriptionState);
    return await this.sendSubscribe({
      cacheName: cacheName,
      topicName: topicName,
      onItem: onItem,
      onError: onError,
      subscriptionState: subscriptionState,
      subscription: subscription,
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
      if (options.restartedDueToError) {
        this.logger.trace(
          'Stream ended after error but was restarted on topic: %s',
          options.topicName
        );
        return;
      } else if (!options.subscriptionState.isSubscribed) {
        this.logger.trace(
          'Stream ended after unsubscribe on topic: %s',
          options.topicName
        );
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
    isRstStreamNoError: boolean
  ): void {
    // When the first message is an error, an irrecoverable error has happened,
    // eg the cache does not exist. The user should not receive a subscription
    // object but an error.
    if (options.firstMessage) {
      this.logger.trace(
        'Received subscription stream error; topic: %s',
        truncateString(options.topicName)
      );

      options.resolve(momentoError);
      options.subscription.unsubscribe();
      return;
    }

    // The service cuts the stream after a period of time.
    // Transparently restart the stream instead of propagating an error.
    if (isRstStreamNoError) {
      this.logger.trace(
        'Server closed stream due to idle activity. Restarting.'
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
      options.restartedDueToError = true;
      return;
    }

    // Another special case is when the cache is not found.
    // This happens here if the user deletes the cache in the middle of
    // a subscription.
    if (momentoError.errorCode() === MomentoErrorCode.NOT_FOUND_ERROR) {
      this.logger.trace(
        'Stream ended due to cache not found error on topic: %s',
        options.topicName
      );
      options.subscription.unsubscribe();
      options.onError(momentoError, options.subscription);
      return;
    } else {
      options.onError(momentoError, options.subscription);
    }
  }
}
