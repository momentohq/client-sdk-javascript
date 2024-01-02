import {pubsub} from '@gomomento/generated-types';
import grpcPubsub = pubsub.cache_client.pubsub;
// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {ChannelCredentials, Interceptor, ServiceError} from '@grpc/grpc-js';
import {Status} from '@grpc/grpc-js/build/src/constants';
import {version} from '../../package.json';
import {TopicClientProps} from '../topic-client-props';
import {middlewaresInterceptor} from './grpc/middlewares-interceptor';
import {
  CredentialProvider,
  MomentoLogger,
  TopicItem,
  TopicPublish,
  TopicSubscribe,
  UnknownError,
} from '../';
import {truncateString} from '@gomomento/sdk-core/dist/src/internal/utils';
import {
  AbstractPubsubClient,
  SendSubscribeOptions,
  PrepareSubscribeCallbackOptions,
} from '@gomomento/sdk-core/dist/src/internal/clients/pubsub/AbstractPubsubClient';
import {TopicConfiguration} from '../config/topic-configuration';

export class PubsubClient extends AbstractPubsubClient {
  private readonly client: grpcPubsub.PubsubClient;
  private readonly configuration: TopicConfiguration;
  protected readonly credentialProvider: CredentialProvider;
  private readonly unaryRequestTimeoutMs: number;
  private static readonly DEFAULT_REQUEST_TIMEOUT_MS: number = 5 * 1000;
  private static readonly DEFAULT_MAX_SESSION_MEMORY_MB: number = 256;
  protected readonly logger: MomentoLogger;
  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;
  private readonly unaryInterceptors: Interceptor[];
  private readonly streamingInterceptors: Interceptor[];

  private static readonly RST_STREAM_NO_ERROR_MESSAGE =
    'Received RST_STREAM with code 0';

  /**
   * @param {TopicClientProps} props
   */
  constructor(props: TopicClientProps) {
    super();
    this.configuration = props.configuration;
    this.credentialProvider = props.credentialProvider;
    this.logger = this.configuration.getLoggerFactory().getLogger(this);
    this.cacheServiceErrorMapper = new CacheServiceErrorMapper(
      this.configuration.getThrowOnErrors()
    );
    this.unaryRequestTimeoutMs = PubsubClient.DEFAULT_REQUEST_TIMEOUT_MS;
    this.logger.debug(
      `Creating topic client using endpoint: '${this.credentialProvider.getCacheEndpoint()}'`
    );

    this.client = new grpcPubsub.PubsubClient(
      this.credentialProvider.getCacheEndpoint(),
      ChannelCredentials.createSsl(),
      {
        // default value for max session memory is 10mb.  Under high load, it is easy to exceed this,
        // after which point all requests will fail with a client-side RESOURCE_EXHAUSTED exception.
        'grpc-node.max_session_memory':
          PubsubClient.DEFAULT_MAX_SESSION_MEMORY_MB,
        // This flag controls whether channels use a shared global pool of subchannels, or whether
        // each channel gets its own subchannel pool.  The default value is 0, meaning a single global
        // pool.  Setting it to 1 provides significant performance improvements when we instantiate more
        // than one grpc client.
        'grpc.use_local_subchannel_pool': 1,
      }
    );

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
            this.cacheServiceErrorMapper.handleError(
              err,
              e => new TopicPublish.Error(e),
              resolve,
              reject
            );
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
  protected sendSubscribe(
    options: SendSubscribeOptions
  ): Promise<TopicSubscribe.Response> {
    const request = new grpcPubsub._SubscriptionRequest({
      cache_name: options.cacheName,
      topic: options.topicName,
      resume_at_topic_sequence_number:
        options.subscriptionState.resumeAtTopicSequenceNumber,
    });

    const call = this.client.Subscribe(request, {
      interceptors: this.streamingInterceptors,
    });
    options.subscriptionState.setSubscribed();

    // Allow the caller to cancel the stream.
    // Note that because we restart the stream on error or stream end,
    // we need to ensure we keep the same subscription object. That way
    // stream restarts are transparent to the caller.
    options.subscriptionState.unsubscribeFn = () => {
      call.cancel();
    };

    return new Promise((resolve, reject) => {
      const prepareCallbackOptions: PrepareSubscribeCallbackOptions = {
        ...options,
        restartedDueToError: false,
        firstMessage: true,
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

      if (resp?.item) {
        options.subscriptionState.lastTopicSequenceNumber =
          resp.item.topic_sequence_number;
        if (resp.item.value.text) {
          options.onItem(
            new TopicItem(resp.item.value.text, {
              tokenId: resp.item.publisher_id,
            })
          );
        } else if (resp.item.value.binary) {
          options.onItem(
            new TopicItem(resp.item.value.binary, {
              tokenId: resp.item.publisher_id,
            })
          );
        } else {
          this.logger.error(
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
      } else if (resp?.heartbeat) {
        this.logger.trace(
          'Received heartbeat from subscription stream; topic: %s',
          truncateString(options.topicName)
        );
      } else if (resp?.discontinuity) {
        this.logger.trace(
          'Received discontinuity from subscription stream; topic: %s',
          truncateString(options.topicName)
        );
      } else {
        this.logger.error(
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
      const isRstStreamNoError =
        serviceError.code === Status.INTERNAL &&
        serviceError.details === PubsubClient.RST_STREAM_NO_ERROR_MESSAGE;
      const momentoError = new TopicSubscribe.Error(
        this.cacheServiceErrorMapper.convertError(serviceError)
      );
      this.handleSubscribeError(options, momentoError, isRstStreamNoError);
    };
  }

  private static initializeUnaryInterceptors(
    headers: Header[],
    configuration: TopicConfiguration,
    requestTimeoutMs: number
  ): Interceptor[] {
    return [
      middlewaresInterceptor(configuration.getLoggerFactory(), [], {}),
      new HeaderInterceptorProvider(headers).createHeadersInterceptor(),
      ClientTimeoutInterceptor(requestTimeoutMs),
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
