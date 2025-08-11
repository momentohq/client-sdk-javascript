import * as pubsub from '@gomomento/generated-types-webtext/dist/CachepubsubServiceClientPb';
import * as cachepubsub_pb from '@gomomento/generated-types-webtext/dist/cachepubsub_pb';
import {
  CredentialProvider,
  TopicDiscontinuity,
  TopicHeartbeat,
  TopicItem,
  UnknownError,
  DEFAULT_SUBSCRIPTION_RETRY_DELAY_MILLIS,
} from '@gomomento/sdk-core';
import {Request, RpcError, StatusCode, UnaryResponse} from 'grpc-web';
import {truncateString} from '@gomomento/sdk-core/dist/src/internal/utils';
import {TopicPublish, TopicSubscribe} from '../index';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  AbstractPubsubClient,
  PrepareSubscribeCallbackOptions,
  SendSubscribeOptions,
} from '@gomomento/sdk-core/dist/src/internal/clients/pubsub/AbstractPubsubClient';
import {
  convertToB64String,
  createCallMetadata,
  getWebCacheEndpoint,
} from '../utils/web-client-utils';
import {ClientMetadataProvider} from './client-metadata-provider';
import {TopicClientAllProps} from './topic-client-all-props';
import {secondsToMilliseconds} from '@gomomento/sdk-core/dist/src/utils';

export class PubsubClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> extends AbstractPubsubClient<RpcError> {
  private readonly client: pubsub.PubsubClient;
  private readonly credentialProvider: CredentialProvider;
  private readonly requestTimeoutMs: number;
  private static readonly DEFAULT_REQUEST_TIMEOUT_MS: number =
    secondsToMilliseconds(5);
  private readonly clientMetadataProvider: ClientMetadataProvider;

  private static readonly RST_STREAM_NO_ERROR_MESSAGE =
    'Received RST_STREAM with code 0';
  private static readonly BROWSER_DISCONNECT =
    'Http response at 400 or 500 level, http status code: 0';

  constructor(props: TopicClientAllProps) {
    super(
      props.configuration.getLoggerFactory(),
      props.configuration.getLoggerFactory().getLogger(PubsubClient.name),
      new CacheServiceErrorMapper(props.configuration.getThrowOnErrors())
    );

    this.credentialProvider = props.credentialProvider;
    this.requestTimeoutMs = PubsubClient.DEFAULT_REQUEST_TIMEOUT_MS;
    this.getLogger().debug(
      `Creating topic client using endpoint: '${getWebCacheEndpoint(
        props.credentialProvider
      )}'`
    );

    this.client = new pubsub.PubsubClient(
      // Note: all web SDK requests are routed to a `web.` subdomain to allow us flexibility on the server
      getWebCacheEndpoint(props.credentialProvider),
      null,
      {}
    );
    this.clientMetadataProvider = new ClientMetadataProvider({
      authToken: props.credentialProvider.getAuthToken(),
      clientType: 'topic',
    });
  }

  public getEndpoint(): string {
    const endpoint = getWebCacheEndpoint(this.credentialProvider);
    this.getLogger().debug(`Using cache endpoint: ${endpoint}`);
    return endpoint;
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

    return await new Promise((resolve, reject) => {
      this.client.publish(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createCallMetadata(cacheName, this.requestTimeoutMs),
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
  protected sendSubscribe(
    options: SendSubscribeOptions
  ): Promise<TopicSubscribe.Response> {
    const request = new cachepubsub_pb._SubscriptionRequest();
    request.setCacheName(options.cacheName);
    request.setTopic(options.topicName);
    request.setResumeAtTopicSequenceNumber(
      options.subscriptionState.resumeAtTopicSequenceNumber
    );
    request.setSequencePage(
      options.subscriptionState.resumeAtTopicSequencePage
    );

    this.getLogger().trace(
      `Subscribing to topic with resume_at_topic_sequence_number ${options.subscriptionState.resumeAtTopicSequenceNumber} and sequence_page ${options.subscriptionState.resumeAtTopicSequencePage}`
    );

    const call = this.client.subscribe(request, {
      ...this.clientMetadataProvider.createClientMetadata(),
    });
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
        // We call subscribe send on retryable errors. All retry-able errors happen
        // after the first message. Here we can check if there has been a message that
        // has already been sent from this stream by checking to see if there is a resumable
        // sequence number. If there is one, we know that this isn't the first message.
        firstMessage: !options.subscriptionState.resumeAtTopicSequenceNumber,
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

      const item = resp.getItem();
      const discontinuity = resp.getDiscontinuity();

      if (item) {
        const sequenceNumber = item.getTopicSequenceNumber();
        const sequencePage = item.getSequencePage();
        options.subscriptionState.lastTopicSequenceNumber = sequenceNumber;
        options.subscriptionState.lastTopicSequencePage = sequencePage;
        const publisherId = item.getPublisherId();
        const itemText = item.getValue()?.getText();
        const itemBinary = item.getValue()?.getBinary();
        this.getLogger().trace(
          `Received an item on subscription stream; topic: ${truncateString(
            options.topicName
          )}; sequence number: ${sequenceNumber}; sequence page: ${sequencePage}`
        );
        if (itemText) {
          options.onItem(
            new TopicItem(itemText, sequenceNumber, {tokenId: publisherId})
          );
        } else if (itemBinary) {
          options.onItem(
            new TopicItem(itemBinary, sequenceNumber, {tokenId: publisherId})
          );
        } else {
          this.getLogger().error(
            `Received subscription item with unknown type; topic: ${truncateString(
              options.topicName
            )}`
          );
          options.onError(
            new TopicSubscribe.Error(
              new UnknownError('Unknown item value type')
            ),
            options.subscription
          );
        }
      } else if (resp.getHeartbeat()) {
        this.getLogger().trace(
          `Received heartbeat from subscription stream; topic: ${truncateString(
            options.topicName
          )}`
        );
        options.onHeartbeat(new TopicHeartbeat());
      } else if (discontinuity) {
        const topicDiscontinuity = new TopicDiscontinuity(
          discontinuity.getLastTopicSequence(),
          discontinuity.getNewTopicSequence(),
          discontinuity.getNewSequencePage()
        );
        this.getLogger().trace(
          `Received a discontinuity; topic: ${truncateString(
            options.topicName
          )}; ${topicDiscontinuity.toString()}`
        );
        options.subscriptionState.lastTopicSequenceNumber =
          discontinuity.getNewTopicSequence();
        options.subscriptionState.lastTopicSequencePage =
          discontinuity.getNewSequencePage();
        options.onDiscontinuity(topicDiscontinuity);
      } else {
        this.getLogger().error(
          `Received unknown subscription item; topic: ${truncateString(
            options.topicName
          )}`
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
      const isBrowserDisconnect =
        serviceError.code === StatusCode.UNKNOWN &&
        serviceError.message === PubsubClient.BROWSER_DISCONNECT;
      const isRstStreamNoError =
        serviceError.code === StatusCode.INTERNAL &&
        serviceError.message === PubsubClient.RST_STREAM_NO_ERROR_MESSAGE;
      const shouldReconnectSubscription =
        isBrowserDisconnect || isRstStreamNoError;
      const retryDelayMillis = shouldReconnectSubscription
        ? DEFAULT_SUBSCRIPTION_RETRY_DELAY_MILLIS
        : null;
      const momentoError = new TopicSubscribe.Error(
        this.getCacheServiceErrorMapper().convertError(serviceError)
      );
      this.handleSubscribeError(options, momentoError, retryDelayMillis);
    };
  }
}
