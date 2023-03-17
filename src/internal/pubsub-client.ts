import {pubsub} from '@gomomento/generated-types';
import grpcPubsub = pubsub.cache_client.pubsub;
// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {createRetryInterceptorIfEnabled} from './grpc/retry-interceptor';
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
import {validateCacheName} from './utils/validators';
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

    this.unaryRequestTimeoutMs =
      grpcConfig.getDeadlineMillis() || PubsubClient.DEFAULT_REQUEST_TIMEOUT_MS;
    this.validateRequestTimeout(this.unaryRequestTimeoutMs);
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
    if (timeout && timeout <= 0) {
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
      // todo: validate topic name
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
      // TODO: validate topic name
    } catch (err) {
      return new TopicSubscribe.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(
      'Issuing subscribe request; topic: %s',
      truncateString(topicName)
    );

    return await new Promise(resolve => {
      const subscriptionState: SubscriptionState = new SubscriptionState();
      const subscription = new TopicSubscribe.Subscription(subscriptionState);
      this.sendSubscribe(
        cacheName,
        topicName,
        options,
        subscriptionState,
        subscription
      );
      resolve(subscription);
    });
  }

  /**
   *
   *
   * @private
   * @param {string} cacheName
   * @param {string} topicName
   * @param {SubscribeCallOptions} options
   * @param {number} [resumeAtTopicSequenceNumber=0]
   * @param {TopicSubscribe.Subscription} [subscription]
   * @return {*}  {TopicSubscribe.Subscription}
   * @memberof PubsubClient
   *
   * @remark This method is responsible for reconnecting the stream if it ends unexpectedly.
   * Since we return a single subscription object to the user, we need to update it with the
   * unsubscribe function should we restart the stream. This is why we pass the subscription
   * object as a parameter.
   */
  private sendSubscribe(
    cacheName: string,
    topicName: string,
    options: SubscribeCallOptions,
    subscriptionState: SubscriptionState,
    subscription: TopicSubscribe.Subscription
  ): void {
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

    // Whether the stream was restarted due to an error. If so, we short circuit the end stream handler
    // as the error handler will restart the stream.
    let restartedDueToError = false;

    // Allow the caller to cancel the stream.
    // Note that because we restart the stream on error or stream end,
    // we need to ensure we keep the same subscription object. That way
    // stream restarts are transparent to the caller.
    subscriptionState.unsubscribeFn = () => {
      call.cancel();
    };

    call
      .on('data', (resp: grpcPubsub._SubscriptionItem) => {
        if (resp?.item) {
          subscriptionState.lastTopicSequenceNumber =
            resp.item.topic_sequence_number;
          if (resp.item.value.text) {
            options.onItem(new TopicSubscribe.Item(resp.item.value.text));
          } else if (resp.item.value.binary) {
            options.onItem(new TopicSubscribe.Item(resp.item.value.binary));
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
        }
      })
      .on('error', (err: Error) => {
        // When the caller unsubscribes, we may get a follow on error, which we ignore.
        if (!subscriptionState.isSubscribed) {
          return;
        }

        const serviceError = err as unknown as ServiceError;
        // The service cuts the the stream after a period of time. Hence we reconnect.
        if (
          serviceError.code === Status.INTERNAL &&
          serviceError.details === 'Received RST_STREAM with code 0'
        ) {
          this.logger.trace(
            'Server closed stream due to idle activity. Restarting.'
          );
          this.sendSubscribe(
            cacheName,
            topicName,
            options,
            subscriptionState,
            subscription
          );
          restartedDueToError = true;
          return;
        }

        // Otherwise we propagate the error to the caller.
        options.onError(
          new TopicSubscribe.Error(cacheServiceErrorMapper(serviceError)),
          subscription
        );
      })
      .on('end', () => {
        // We want to reconnect on stream end, except if:
        // 1. The stream was cancelled by the caller.
        // 2. The stream was restarted due to an error.
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

        this.logger.trace('Stream ended on topic: %s; restarting.', topicName);
        this.sendSubscribe(
          cacheName,
          topicName,
          options,
          subscriptionState,
          subscription
        );
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
