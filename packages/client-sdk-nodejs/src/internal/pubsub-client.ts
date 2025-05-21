import {pubsub} from '@gomomento/generated-types';
// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {Header, HeaderInterceptor} from './grpc/headers-interceptor';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  ChannelCredentials,
  ClientReadableStream,
  Interceptor,
  ServiceError,
} from '@grpc/grpc-js';
import {version} from '../../package.json';
import {middlewaresInterceptor} from './grpc/middlewares-interceptor';
import {
  CredentialProvider,
  Middleware,
  StaticGrpcConfiguration,
  TopicDiscontinuity,
  TopicGrpcConfiguration,
  TopicHeartbeat,
  TopicItem,
  TopicPublish,
  TopicSubscribe,
  UnknownError,
} from '../';
import {truncateString} from '@gomomento/sdk-core/dist/src/internal/utils';
import {
  AbstractPubsubClient,
  PrepareSubscribeCallbackOptions,
  SendSubscribeOptions,
} from '@gomomento/sdk-core/dist/src/internal/clients/pubsub/AbstractPubsubClient';
import {TopicConfiguration} from '../config/topic-configuration';
import {TopicClientAllProps} from './topic-client-all-props';
import {grpcChannelOptionsFromGrpcConfig} from './grpc/grpc-channel-options';
import {RetryInterceptor} from './grpc/retry-interceptor';
import {secondsToMilliseconds} from '@gomomento/sdk-core/dist/src/utils';
import grpcPubsub = pubsub.cache_client.pubsub;

export class PubsubClient extends AbstractPubsubClient<ServiceError> {
  private readonly client: grpcPubsub.PubsubClient;
  protected readonly credentialProvider: CredentialProvider;
  private readonly requestTimeoutMs: number;
  private static readonly DEFAULT_REQUEST_TIMEOUT_MS: number =
    secondsToMilliseconds(5);
  private static readonly DEFAULT_MAX_SESSION_MEMORY_MB: number = 256;
  private readonly unaryInterceptors: Interceptor[];
  private readonly streamingInterceptors: Interceptor[];
  private isConnectionLost: boolean;

  // private static readonly RST_STREAM_NO_ERROR_MESSAGE =
  //   'Received RST_STREAM with code 0';

  /**
   * @param {TopicClientProps} props
   */
  constructor(props: TopicClientAllProps) {
    super(
      props.configuration.getLoggerFactory(),
      props.configuration.getLoggerFactory().getLogger(PubsubClient.name),
      new CacheServiceErrorMapper(props.configuration.getThrowOnErrors())
    );
    this.credentialProvider = props.credentialProvider;
    this.getLogger().debug(
      `Creating topic client using endpoint: '${this.credentialProvider.getCacheEndpoint()}'`
    );

    const topicGrpcConfig: TopicGrpcConfiguration = props.configuration
      .getTransportStrategy()
      .getGrpcConfig();

    this.requestTimeoutMs =
      topicGrpcConfig.getDeadlineMillis() ||
      PubsubClient.DEFAULT_REQUEST_TIMEOUT_MS;

    // NOTE: This is hard-coded for now but we may want to expose it via TopicConfiguration in the
    // future, as we do with some of the other clients.
    const grpcConfig = new StaticGrpcConfiguration({
      deadlineMillis: this.requestTimeoutMs,
      maxSessionMemoryMb: PubsubClient.DEFAULT_MAX_SESSION_MEMORY_MB,
      keepAlivePermitWithoutCalls:
        topicGrpcConfig.getKeepAlivePermitWithoutCalls(),
      keepAliveTimeMs: topicGrpcConfig.getKeepAliveTimeMS(),
      keepAliveTimeoutMs: topicGrpcConfig.getKeepAliveTimeoutMS(),
    });

    const channelOptions = grpcChannelOptionsFromGrpcConfig(grpcConfig);

    this.getLogger().debug(
      `Creating pubsub client with channel options: ${JSON.stringify(
        channelOptions,
        null,
        2
      )}`
    );

    this.client = new grpcPubsub.PubsubClient(
      this.credentialProvider.getCacheEndpoint(),
      this.credentialProvider.isCacheEndpointSecure()
        ? ChannelCredentials.createSsl()
        : ChannelCredentials.createInsecure(),
      channelOptions
    );

    const headers: Header[] = [
      new Header('Authorization', this.credentialProvider.getAuthToken()),
      new Header('agent', `nodejs:topic:${version}`),
      new Header('runtime-version', `nodejs:${process.versions.node}`),
    ];
    this.unaryInterceptors = PubsubClient.initializeUnaryInterceptors(
      headers,
      props.configuration,
      this.requestTimeoutMs
    );
    this.streamingInterceptors = PubsubClient.initializeStreamingInterceptors(
      headers,
      props.configuration
    );
    this.isConnectionLost = false;
  }

  public getEndpoint(): string {
    const endpoint = this.credentialProvider.getCacheEndpoint();
    this.getLogger().debug(`Using cache endpoint: ${endpoint}`);
    return endpoint;
  }

  protected async sendPublish(
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

    return await new Promise((resolve, reject) => {
      this.client.Publish(
        request,
        {
          interceptors: this.unaryInterceptors,
        },
        (err, resp) => {
          if (resp) {
            resolve(new TopicPublish.Success());
          } else {
            this.getCacheServiceErrorMapper().resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new TopicPublish.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  /**
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
  protected override sendSubscribe(
    options: SendSubscribeOptions
  ): Promise<TopicSubscribe.Response> {
    const request = new grpcPubsub._SubscriptionRequest({
      cache_name: options.cacheName,
      topic: options.topicName,
      resume_at_topic_sequence_number:
        options.subscriptionState.resumeAtTopicSequenceNumber,
      sequence_page: options.subscriptionState.lastTopicSequencePage,
    });

    this.getLogger().trace(
      'Subscribing to topic with resume_at_topic_sequence_number %s and sequence_page %s',
      options.subscriptionState.resumeAtTopicSequenceNumber,
      options.subscriptionState.resumeAtTopicSequencePage
    );

    let call: ClientReadableStream<grpcPubsub._SubscriptionItem>;
    if (options.firstMessage) {
      // If this is the first message, we want to set a deadline for the request.
      const deadline = Date.now() + this.requestTimeoutMs;
      call = this.client.Subscribe(request, {
        interceptors: this.streamingInterceptors,
        deadline: deadline,
      });
    } else {
      call = this.client.Subscribe(request, {
        interceptors: this.streamingInterceptors,
      });
    }

    options.subscriptionState.setSubscribed();

    // Allow the caller to cancel the stream.
    // Note that because we restart the stream on error or stream end,
    // we need to ensure we keep the same subscription object. That way
    // stream restarts are transparent to the caller.
    options.subscriptionState.unsubscribeFn = () => {
      call.cancel();
      // options.onSubscriptionEnd?.();
    };

    return new Promise((resolve, _reject) => {
      const prepareCallbackOptions: PrepareSubscribeCallbackOptions = {
        ...options,
        resolve,
      };
      call.on('data', this.prepareDataCallback(prepareCallbackOptions));
      call.on('error', this.prepareErrorCallback(prepareCallbackOptions));
      call.on('end', this.prepareEndCallback(prepareCallbackOptions));
    });
  }

  private prepareDataCallback(
    options: PrepareSubscribeCallbackOptions
  ): (resp: grpcPubsub._SubscriptionItem) => void {
    return (resp: grpcPubsub._SubscriptionItem) => {
      if (options.firstMessage) {
        options.resolve(options.subscription);
      }
      options.firstMessage = false;

      if (resp.has_item || resp.has_heartbeat || resp.has_discontinuity) {
        if (this.isConnectionLost) {
          this.isConnectionLost = false;
        }
      }

      if (resp.item) {
        const sequenceNumber = resp.item.topic_sequence_number;
        const sequencePage = resp.item.sequence_page;
        options.subscriptionState.lastTopicSequenceNumber = sequenceNumber;
        options.subscriptionState.lastTopicSequencePage = sequencePage;
        this.getLogger().trace(
          'Received an item on subscription stream; topic: %s; sequence number: %s; sequence page: %s',
          truncateString(options.topicName),
          sequenceNumber,
          sequencePage
        );
        if (resp.item.value.text) {
          options.onItem(
            new TopicItem(resp.item.value.text, sequenceNumber, {
              tokenId: resp.item.publisher_id,
            })
          );
        } else if (resp.item.value.binary) {
          options.onItem(
            new TopicItem(resp.item.value.binary, sequenceNumber, {
              tokenId: resp.item.publisher_id,
            })
          );
        } else {
          this.getLogger().error(
            'Received subscription item with unknown type; topic: %s',
            truncateString(options.topicName)
          );
          options.onError(
            new TopicSubscribe.Error(
              new UnknownError('Unknown item value type')
            ),
            options.subscription
          );
        }
      } else if (resp.heartbeat) {
        this.getLogger().trace(
          'Received heartbeat from subscription stream; topic: %s',
          truncateString(options.topicName)
        );
        options.onHeartbeat(new TopicHeartbeat());
      } else if (resp.discontinuity) {
        const topicDiscontinuity = new TopicDiscontinuity(
          resp.discontinuity.last_topic_sequence,
          resp.discontinuity.new_topic_sequence,
          resp.discontinuity.new_sequence_page
        );
        this.getLogger().trace(
          'Received discontinuity from subscription stream; topic: %s; %s',
          truncateString(options.topicName),
          topicDiscontinuity.toString()
        );
        options.subscriptionState.lastTopicSequenceNumber =
          resp.discontinuity.new_topic_sequence;
        options.subscriptionState.lastTopicSequencePage =
          resp.discontinuity.new_sequence_page;
        options.onDiscontinuity(topicDiscontinuity);
      } else {
        this.getLogger().error(
          'Received unknown subscription item; topic: %s',
          truncateString(options.topicName)
        );
        options.onError(
          new TopicSubscribe.Error(new UnknownError('Unknown item type')),
          options.subscription
        );
      }
    };
  }

  private prepareErrorCallback(
    options: PrepareSubscribeCallbackOptions
  ): (err: Error) => void {
    return (err: Error) => {
      // When the caller unsubscribes, we may get a follow on error, which we ignore.
      if (!options.subscriptionState.isSubscribed) {
        return;
      }

      const serviceError = err as unknown as ServiceError;
      this.getLogger().trace(
        `Subscription encountered an error: ${serviceError.code}: ${serviceError.message}: ${serviceError.details}`
      );
      const shouldReconnectSubscription =
        // previously, we were only attempting a reconnect on this one very specific case, but our current expectation is that
        // we should err on the side of retrying. This may become a sort of "deny list" of error types to *not* retry on
        // in the future, but for now we will be aggressive about retrying.
        // // serviceError.code === Status.INTERNAL &&
        //  // serviceError.details === PubsubClient.RST_STREAM_NO_ERROR_MESSAGE;
        true;

      if (!this.isConnectionLost) {
        this.isConnectionLost = true;
        options.onConnectionLost();
      }

      const momentoError = new TopicSubscribe.Error(
        this.getCacheServiceErrorMapper().convertError(serviceError)
      );
      this.handleSubscribeError(
        options,
        momentoError,
        shouldReconnectSubscription
      );
    };
  }

  private static initializeUnaryInterceptors(
    headers: Header[],
    configuration: TopicConfiguration,
    requestTimeoutMs: number
  ): Interceptor[] {
    const middlewares = configuration.getMiddlewares();
    const groupMiddlewares = (isLateLoad: boolean) =>
      middlewares.filter(
        middleware => (middleware.shouldLoadLate ?? false) === isLateLoad
      );

    const createMiddlewareInterceptor = (middlewareGroup: Middleware[]) =>
      middlewaresInterceptor(
        configuration.getLoggerFactory(),
        middlewareGroup,
        {}
      );

    // Separate middlewares into immediate and late-load groups
    const immediateMiddlewares = groupMiddlewares(false);
    const lateLoadMiddlewares = groupMiddlewares(true);

    const interceptors: Interceptor[] = [
      createMiddlewareInterceptor(immediateMiddlewares),
      HeaderInterceptor.createHeadersInterceptor(headers),
      RetryInterceptor.createRetryInterceptor({
        clientName: 'PubSubClient',
        loggerFactory: configuration.getLoggerFactory(),
        overallRequestTimeoutMs: requestTimeoutMs,
      }),
    ];

    if (lateLoadMiddlewares.length > 0) {
      interceptors.push(createMiddlewareInterceptor(lateLoadMiddlewares));
    }
    return interceptors;
  }

  // TODO https://github.com/momentohq/client-sdk-nodejs/issues/349
  // decide on streaming interceptors and middlewares
  private static initializeStreamingInterceptors(
    headers: Header[],
    configuration: TopicConfiguration
  ): Interceptor[] {
    const middlewares = configuration.getMiddlewares();

    const createMiddlewareInterceptor = (middlewares: Middleware[]) =>
      middlewaresInterceptor(configuration.getLoggerFactory(), middlewares, {});

    return [
      createMiddlewareInterceptor(middlewares),
      HeaderInterceptor.createHeadersInterceptor(headers),
    ];
  }
}
