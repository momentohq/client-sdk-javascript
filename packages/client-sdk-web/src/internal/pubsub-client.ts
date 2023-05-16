import * as pubsub from '@gomomento/generated-types-webtext/dist/CachepubsubServiceClientPb';
import * as cachepubsub_pb from '@gomomento/generated-types-webtext/dist/cachepubsub_pb';
import {Configuration} from '../config/configuration';
import {
  CredentialProvider,
  MomentoErrorCode,
  MomentoLogger,
  SubscribeCallOptions,
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
import {
  truncateString,
  validateCacheName,
  validateTopicName,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {normalizeSdkError} from '@gomomento/sdk-core/dist/src/errors';
import {TopicPublish, TopicSubscribe} from '../index';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {SubscriptionState} from '@gomomento/sdk-core/dist/src/internal/subscription-state';
import {IPubsubClient} from '@gomomento/sdk-core/dist/src/internal/clients';

/**
 * Encapsulates parameters for the `sendSubscribe` method.
 */
interface SendSubscribeOptions {
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
interface PrepareSubscribeCallbackOptions extends SendSubscribeOptions {
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

export class PubsubClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> implements IPubsubClient
{
  private readonly client: pubsub.PubsubClient;
  private readonly configuration: Configuration;
  private readonly credentialProvider: CredentialProvider;
  // private readonly unaryRequestTimeoutMs: number;
  // private static readonly DEFAULT_REQUEST_TIMEOUT_MS: number = 5 * 1000;
  private readonly logger: MomentoLogger;
  private readonly authHeaders: {authorization: string};
  private readonly unaryInterceptors: UnaryInterceptor<REQ, RESP>[];
  private readonly streamingInterceptors: StreamInterceptor<REQ, RESP>[];

  private static readonly RST_STREAM_NO_ERROR_MESSAGE =
    'Received RST_STREAM with code 0';

  constructor(props: TopicClientProps) {
    this.configuration = props.configuration;
    this.credentialProvider = props.credentialProvider;
    this.logger = this.configuration.getLoggerFactory().getLogger(this);

    // TODO:
    // TODO: uncomment after Configuration plumbing is in place . . .
    // TODO
    // const grpcConfig = this.configuration
    //   .getTransportStrategy()
    //   .getGrpcConfig();
    //
    // this.validateRequestTimeout(grpcConfig.getDeadlineMillis());
    // this.unaryRequestTimeoutMs =
    //   grpcConfig.getDeadlineMillis() || PubsubClient.DEFAULT_REQUEST_TIMEOUT_MS;
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

  // TODO:
  // TODO: uncomment after Configuration plumbing is in place . . .
  // TODO
  // private validateRequestTimeout(timeout?: number) {
  //   this.logger.debug(`Request timeout ms: ${String(timeout)}`);
  //   if (timeout !== undefined && timeout <= 0) {
  //     throw new InvalidArgumentError(
  //       'request timeout must be greater than zero.'
  //     );
  //   }
  // }

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

  private async sendPublish(
    cacheName: string,
    topicName: string,
    value: string | Uint8Array
  ): Promise<TopicPublish.Response> {
    const topicValue = new cachepubsub_pb._TopicValue();
    if (typeof value === 'string') {
      topicValue.setText(value);
    } else {
      topicValue.setBinary(this.convertToB64String(value));
    }

    const request = new cachepubsub_pb._PublishRequest();
    request.setCacheName(cacheName);
    request.setTopic(topicName);
    request.setValue(topicValue);
    const metadata = this.createMetadata(cacheName);

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
  private sendSubscribe(
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
      // When the first message is an error, an irrecoverable error has happened,
      // eg the cache does not exist. The user should not receive a subscription
      // object but an error.
      if (options.firstMessage) {
        this.logger.trace(
          'Received subscription stream error; topic: %s',
          truncateString(options.topicName)
        );

        options.resolve(
          new TopicSubscribe.Error(cacheServiceErrorMapper(serviceError))
        );
        options.subscription.unsubscribe();
        return;
      }

      // The service cuts the stream after a period of time.
      // Transparently restart the stream instead of propagating an error.
      if (
        serviceError.code === StatusCode.INTERNAL &&
        serviceError.message === PubsubClient.RST_STREAM_NO_ERROR_MESSAGE
      ) {
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

      const momentoError = new TopicSubscribe.Error(
        cacheServiceErrorMapper(serviceError)
      );

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
    };
  }

  private prepareEndCallback(
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

  private initializeUnaryInterceptors(
    headers: Header[]
    // configuration: Configuration,
    // requestTimeoutMs: number
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

  private createMetadata(cacheName: string): {cache: string} {
    return {cache: cacheName};
  }

  private convertToB64String(v: string | Uint8Array): string {
    if (typeof v === 'string') {
      return btoa(v);
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return btoa(String.fromCharCode.apply(null, v));
  }
}
