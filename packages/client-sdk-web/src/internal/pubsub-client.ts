import * as pubsub from '@gomomento/generated-types-webtext/dist/CachepubsubServiceClientPb';
import * as cachepubsub_pb from '@gomomento/generated-types-webtext/dist/cachepubsub_pb';
import {Configuration} from '../config/configuration';
import {
  CredentialProvider,
  InvalidArgumentError,
  MomentoLogger,
  TopicItem,
  UnknownError,
} from '@gomomento/sdk-core';
import {
  Request,
  StreamInterceptor,
  UnaryInterceptor,
  UnaryResponse,
  RpcError,
  StatusCode,
} from 'grpc-web';
import {TopicClientProps} from '../topic-client-props';
import {version} from '../../package.json';
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {truncateString} from '@gomomento/sdk-core/dist/src/internal/utils';
import {TopicPublish, TopicSubscribe} from '../index';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  AbstractPubsubClient,
  SendSubscribeOptions,
  PrepareSubscribeCallbackOptions,
} from '@gomomento/sdk-core/dist/src/internal/clients/pubsub/AbstractPubsubClient';
import {convertToB64String, createMetadata} from '../utils/web-client-utils';

export class PubsubClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> extends AbstractPubsubClient {
  private readonly client: pubsub.PubsubClient;
  private readonly configuration: Configuration;
  protected readonly credentialProvider: CredentialProvider;
  private readonly requestTimeoutMs: number;
  private static readonly DEFAULT_REQUEST_TIMEOUT_MS: number = 5 * 1000;
  protected readonly logger: MomentoLogger;
  private readonly authHeaders: {authorization: string};
  private readonly unaryInterceptors: UnaryInterceptor<REQ, RESP>[];
  private readonly streamingInterceptors: StreamInterceptor<REQ, RESP>[];

  private static readonly RST_STREAM_NO_ERROR_MESSAGE =
    'Received RST_STREAM with code 0';

  constructor(props: TopicClientProps) {
    super();
    this.configuration = props.configuration;
    this.credentialProvider = props.credentialProvider;
    this.logger = this.configuration.getLoggerFactory().getLogger(this);

    const grpcConfig = this.configuration
      .getTransportStrategy()
      .getGrpcConfig();

    this.validateRequestTimeout(grpcConfig.getDeadlineMillis());
    this.requestTimeoutMs =
      grpcConfig.getDeadlineMillis() || PubsubClient.DEFAULT_REQUEST_TIMEOUT_MS;
    this.logger.debug(
      `Creating topic client using endpoint: '${this.credentialProvider.getCacheEndpoint()}'`
    );

    const headers: Header[] = [new Header('Agent', `nodejs:${version}`)];
    this.unaryInterceptors = this.initializeUnaryInterceptors(headers);
    this.streamingInterceptors = this.initializeStreamingInterceptors(headers);
    this.client = new pubsub.PubsubClient(
      `https://${props.credentialProvider.getCacheEndpoint()}`,
      null,
      {
        unaryInterceptors: this.unaryInterceptors,
        streamInterceptors: this.streamingInterceptors,
      }
    );
    this.authHeaders = {authorization: props.credentialProvider.getAuthToken()};
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

  protected async sendPublish(
    cacheName: string,
    topicName: string,
    value: string | Uint8Array
  ): Promise<TopicPublish.Response> {
    const topicValue = new cachepubsub_pb._TopicValue();
    if (typeof value === 'string') {
      topicValue.setText(value);
    } else {
      topicValue.setBinary(convertToB64String(value));
    }

    const request = new cachepubsub_pb._PublishRequest();
    request.setCacheName(cacheName);
    request.setTopic(topicName);
    request.setValue(topicValue);
    const metadata = createMetadata(cacheName, this.requestTimeoutMs);

    return await new Promise(resolve => {
      this.client.publish(
        request,
        {
          ...this.authHeaders,
          ...metadata,
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
    const request = new cachepubsub_pb._SubscriptionRequest();
    request.setCacheName(options.cacheName);
    request.setTopic(options.topicName);
    request.setResumeAtTopicSequenceNumber(
      options.subscriptionState.resumeAtTopicSequenceNumber
    );

    const call = this.client.subscribe(request, {...this.authHeaders});
    options.subscriptionState.setSubscribed();

    // Allow the caller to cancel the stream.
    // Note that because we restart the stream on error or stream end,
    // we need to ensure we keep the same subscription object. That way
    // stream restarts are transparent to the caller.
    options.subscriptionState.unsubscribeFn = () => {
      call.cancel();
    };

    return new Promise(resolve => {
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
  ): (resp: cachepubsub_pb._SubscriptionItem) => void {
    return (resp: cachepubsub_pb._SubscriptionItem) => {
      if (options.firstMessage) {
        options.resolve(options.subscription);
      }
      options.firstMessage = false;

      if (resp?.getItem()) {
        options.subscriptionState.lastTopicSequenceNumber = resp
          .getItem()
          ?.getTopicSequenceNumber();
        const itemText = resp.getItem()?.getValue()?.getText();
        const itemBinary = resp.getItem()?.getValue()?.getBinary();
        if (itemText) {
          options.onItem(new TopicItem(itemText));
        } else if (itemBinary) {
          options.onItem(new TopicItem(itemBinary));
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
      } else if (resp?.getHeartbeat()) {
        this.logger.trace(
          'Received heartbeat from subscription stream; topic: %s',
          truncateString(options.topicName)
        );
      } else if (resp?.getDiscontinuity()) {
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
      // When the caller unsubscribes, we may get a follow-on error, which we ignore.
      if (!options.subscriptionState.isSubscribed) {
        return;
      }

      const serviceError = err as unknown as RpcError;
      const isRstStreamNoError =
        serviceError.code === StatusCode.INTERNAL &&
        serviceError.message === PubsubClient.RST_STREAM_NO_ERROR_MESSAGE;
      const momentoError = new TopicSubscribe.Error(
        cacheServiceErrorMapper(serviceError)
      );
      this.handleSubscribeError(options, momentoError, isRstStreamNoError);
    };
  }

  private initializeUnaryInterceptors(
    headers: Header[]
  ): UnaryInterceptor<REQ, RESP>[] {
    return [
      new HeaderInterceptorProvider<REQ, RESP>(
        headers
      ).createHeadersInterceptor(),
    ];
  }

  // TODO https://github.com/momentohq/client-sdk-nodejs/issues/349
  // decide on streaming interceptors and middlewares
  private initializeStreamingInterceptors(
    headers: Header[]
  ): StreamInterceptor<REQ, RESP>[] {
    return [
      new HeaderInterceptorProvider<REQ, RESP>(
        headers
      ).createStreamingHeadersInterceptor(),
    ];
  }
}
