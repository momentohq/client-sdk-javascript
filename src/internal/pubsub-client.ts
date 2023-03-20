import {pubsub} from '@gomomento/generated-types';
import grpcPubsub = pubsub.cache_client.pubsub;
// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {createRetryInterceptorIfEnabled} from './grpc/retry-interceptor';
import {MomentoErrorCode, UnknownError} from '../errors/errors';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {ChannelCredentials, Interceptor, ServiceError} from '@grpc/grpc-js';
import {Status} from '@grpc/grpc-js/build/src/constants';
import {
  TopicPublish,
  TopicSubscribe,
  Configuration,
  CredentialProvider,
  InvalidArgumentError,
  MomentoLogger,
} from '..';
import {version} from '../../package.json';
import {IdleGrpcClientWrapper} from './grpc/idle-grpc-client-wrapper';
import {GrpcClientWrapper} from './grpc/grpc-client-wrapper';
import {normalizeSdkError} from '../errors/error-utils';
import {
  validateCacheName,
  validateTopicName,
  validateTopicValue,
} from './utils/validators';
import {TopicClientProps} from '../topic-client-props';
import {middlewaresInterceptor} from './grpc/middlewares-interceptor';
import {truncateString} from './utils/display';
import {SubscribeCallOptions} from '../utils/topic-call-options';
import {SubscriptionState} from './subscription-state';

export class PubsubClient {
  private readonly clientWrapper: GrpcClientWrapper<grpcPubsub.PubsubClient>;
  private readonly configuration: Configuration;
  private readonly credentialProvider: CredentialProvider;
  private readonly unaryRequestTimeoutMs: number;
  private static readonly DEFAULT_REQUEST_TIMEOUT_MS: number = 5 * 1000;
  private readonly logger: MomentoLogger;
  private readonly unaryInterceptors: Interceptor[];
  private readonly streamingInterceptors: Interceptor[];

  private static readonly RST_STREAM_NO_ERROR_MESSAGE =
    'Received RST_STREAM with code 0';

  /**
   * @param {TopicClientProps} props
   */
  constructor(props: TopicClientProps) {
    this.configuration = props.configuration;
    this.credentialProvider = props.credentialProvider;
    this.logger = this.configuration.getLoggerFactory().getLogger(this);
    const grpcConfig = this.configuration
      .getTransportStrategy()
      .getGrpcConfig();

    this.validateRequestTimeout(grpcConfig.getDeadlineMillis());
    this.unaryRequestTimeoutMs =
      grpcConfig.getDeadlineMillis() || PubsubClient.DEFAULT_REQUEST_TIMEOUT_MS;
    this.logger.debug(
      `Creating topic client using endpoint: '${this.credentialProvider.getCacheEndpoint()}'`
    );

    this.clientWrapper = new IdleGrpcClientWrapper({
      clientFactoryFn: () =>
        new grpcPubsub.PubsubClient(
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
          }
        ),
      configuration: this.configuration,
    });

    const headers: Header[] = [
      new Header('Authorization', this.credentialProvider.getAuthToken()),
      new Header('Agent', `nodejs:${version}`),
    ];
    this.unaryInterceptors = PubsubClient.initializeUnaryInterceptors(
      headers,
      props.configuration,
      this.unaryRequestTimeoutMs
    );
    this.streamingInterceptors =
      PubsubClient.initializeStreamingInterceptors(headers);
  }

  public getEndpoint(): string {
    const endpoint = this.credentialProvider.getCacheEndpoint();
    this.logger.debug(`Using cache endpoint: ${endpoint}`);
    return endpoint;
  }

  private validateRequestTimeout(timeout?: number) {
    this.logger.debug(`Request timeout ms: ${String(timeout)}`);
    if (timeout !== undefined && timeout <= 0) {
      throw new InvalidArgumentError(
        'request timeout must be greater than zero.'
      );
    }
  }

  public async publish(
    cacheName: string,
    topicName: string,
    value: string | Uint8Array
  ): Promise<TopicPublish.Response> {
    try {
      validateCacheName(cacheName);
      validateTopicName(topicName);
      validateTopicValue(value);
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

  private async sendPublish(
    cacheName: string,
    topicName: string,
    value: string | Uint8Array
  ): Promise<TopicPublish.Response> {
    const topicValue = new grpcPubsub._TopicValue();
    if (typeof value === 'string') {
      topicValue.text = value;
    } else {
      topicValue.binary = value;
    }

    const request = new grpcPubsub._PublishRequest({
      cache_name: cacheName,
      topic: topicName,
      value: topicValue,
    });

    return await new Promise(resolve => {
      this.clientWrapper.getClient().Publish(
        request,
        {
          interceptors: this.unaryInterceptors,
        },
        (err, resp) => {
          if (resp) {
            resolve(new TopicPublish.Success());
          } else {
            resolve(new TopicPublish.Error(cacheServiceErrorMapper(err)));
          }
        }
      );
    });
  }

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
    return await this.sendSubscribe(
      cacheName,
      topicName,
      onItem,
      onError,
      subscriptionState,
      subscription
    );
  }

  /**
   *
   *
   * @private
   * @param {string} cacheName
   * @param {string} topicName
   * @param {SubscribeCallOptions} options
   * @param {SubscriptionState} subscriptionState
   * @param {TopicSubscribe.Subscription} [subscription]
   * @return {*}  {void}
   * @memberof PubsubClient
   *
   * @remark This method is responsible for restarting the stream if it ends unexpectedly.
   * Since we return a single subscription object to the user, we need to update it with the
   * unsubscribe function should we restart the stream. This is why we pass the subscription
   * state and subscription object to this method.
   *
   * Handling a cache not exists requires special care as well. In the most likely case,
   * when the subscription starts and the cache does not exist, we receive an error immediately.
   * We return an error from the subscribe method and do immediately unsubscribe. In a distinct,
   * unlikely but possible case, the user deletes the cache while the stream is running. In this
   * case we already returned a subscription object to the user, so we instead cancel the stream and
   * propagate an error to the user via the error handler.
   */
  private sendSubscribe(
    cacheName: string,
    topicName: string,
    onItem: (item: TopicSubscribe.Item) => void,
    onError: (
      error: TopicSubscribe.Error,
      subscription: TopicSubscribe.Subscription
    ) => void,
    subscriptionState: SubscriptionState,
    subscription: TopicSubscribe.Subscription
  ): Promise<TopicSubscribe.Response> {
    const request = new grpcPubsub._SubscriptionRequest({
      cache_name: cacheName,
      topic: topicName,
      resume_at_topic_sequence_number:
        subscriptionState.resumeAtTopicSequenceNumber,
    });

    const call = this.clientWrapper.getClient().Subscribe(request, {
      interceptors: this.streamingInterceptors,
    });
    subscriptionState.setSubscribed();

    // Whether the stream was restarted due to an error. If so, we skip the end stream handler
    // logic as the error handler will have restarted the stream.
    let restartedDueToError = false;

    // Allow the caller to cancel the stream.
    // Note that because we restart the stream on error or stream end,
    // we need to ensure we keep the same subscription object. That way
    // stream restarts are transparent to the caller.
    subscriptionState.unsubscribeFn = () => {
      call.cancel();
    };

    // If the first message is an error, we return an error immediately and do not subscribe.
    let firstMessage = true;
    return new Promise(resolve => {
      call
        .on('data', (resp: grpcPubsub._SubscriptionItem) => {
          if (firstMessage) {
            resolve(subscription);
          }
          firstMessage = false;

          if (resp?.item) {
            subscriptionState.lastTopicSequenceNumber =
              resp.item.topic_sequence_number;
            if (resp.item.value.text) {
              onItem(new TopicSubscribe.Item(resp.item.value.text));
            } else if (resp.item.value.binary) {
              onItem(new TopicSubscribe.Item(resp.item.value.binary));
            } else {
              this.logger.error(
                'Received subscription item with unknown type; topic: %s',
                truncateString(topicName)
              );
              onError(
                new TopicSubscribe.Error(
                  new UnknownError('Unknown item value type')
                ),
                subscription
              );
            }
          } else if (resp?.heartbeat) {
            this.logger.trace(
              'Received heartbeat from subscription stream; topic: %s',
              truncateString(topicName)
            );
          } else if (resp?.discontinuity) {
            this.logger.trace(
              'Received discontinuity from subscription stream; topic: %s',
              truncateString(topicName)
            );
          } else {
            this.logger.error(
              'Received unknown subscription item; topic: %s',
              truncateString(topicName)
            );
            onError(
              new TopicSubscribe.Error(new UnknownError('Unknown item type')),
              subscription
            );
          }
        })
        .on('error', (err: Error) => {
          // When the caller unsubscribes, we may get a follow on error, which we ignore.
          if (!subscriptionState.isSubscribed) {
            return;
          }

          const serviceError = err as unknown as ServiceError;

          // When the first message is an error, an irrecoverable error has happened,
          // eg the cache does not exist. The user should not receive a subscription
          // object but an error.
          if (firstMessage) {
            this.logger.trace(
              'Received subscription stream error; topic: %s',
              truncateString(topicName)
            );

            resolve(
              new TopicSubscribe.Error(cacheServiceErrorMapper(serviceError))
            );
            subscription.unsubscribe();
            return;
          }

          // The service cuts the the stream after a period of time.
          // Transparently restart the stream instead of propagating an error.
          if (
            serviceError.code === Status.INTERNAL &&
            serviceError.details === PubsubClient.RST_STREAM_NO_ERROR_MESSAGE
          ) {
            this.logger.trace(
              'Server closed stream due to idle activity. Restarting.'
            );
            // When restarting the stream we do not do anything with the promises,
            // because we should have already returned the subscription object to the user.
            this.sendSubscribe(
              cacheName,
              topicName,
              onItem,
              onError,
              subscriptionState,
              subscription
            )
              .then(() => {
                return;
              })
              .catch(() => {
                return;
              });
            restartedDueToError = true;
            return;
          }

          const momentoError = new TopicSubscribe.Error(
            cacheServiceErrorMapper(serviceError)
          );

          // Another special case is when the cache is not found.
          // This happens here if the user deletes the cache in the middle of
          // a subscription.
          if (momentoError.errorCode() === MomentoErrorCode.NOT_FOUND_ERROR) {
            this.logger.trace(
              'Stream ended due to cache not found error on topic: %s',
              topicName
            );
            subscription.unsubscribe();
            onError(momentoError, subscription);
            return;
          }

          // Otherwise we propagate the error to the caller.
          onError(momentoError, subscription);
        })
        .on('end', () => {
          // We want to restart on stream end, except if:
          // 1. The stream was cancelled by the caller.
          // 2. The stream was restarted following an error.
          if (restartedDueToError) {
            this.logger.trace(
              'Stream ended after error but was restarted on topic: %s',
              topicName
            );
            return;
          } else if (!subscriptionState.isSubscribed) {
            this.logger.trace(
              'Stream ended after unsubscribe on topic: %s',
              topicName
            );
            return;
          }

          this.logger.trace(
            'Stream ended on topic: %s; restarting.',
            topicName
          );

          // When restarting the stream we do not do anything with the promises,
          // because we should have already returned the subscription object to the user.
          this.sendSubscribe(
            cacheName,
            topicName,
            onItem,
            onError,
            subscriptionState,
            subscription
          )
            .then(() => {
              return;
            })
            .catch(() => {
              return;
            });
        });
    });
  }

  private static initializeUnaryInterceptors(
    headers: Header[],
    configuration: Configuration,
    requestTimeoutMs: number
  ): Interceptor[] {
    return [
      middlewaresInterceptor(
        configuration.getLoggerFactory(),
        configuration.getMiddlewares()
      ),
      new HeaderInterceptorProvider(headers).createHeadersInterceptor(),
      ClientTimeoutInterceptor(requestTimeoutMs),
      ...createRetryInterceptorIfEnabled(
        configuration.getLoggerFactory(),
        configuration.getRetryStrategy()
      ),
    ];
  }

  // TODO https://github.com/momentohq/client-sdk-nodejs/issues/349
  // decide on streaming interceptors and middlewares
  private static initializeStreamingInterceptors(
    headers: Header[]
  ): Interceptor[] {
    return [new HeaderInterceptorProvider(headers).createHeadersInterceptor()];
  }
}
