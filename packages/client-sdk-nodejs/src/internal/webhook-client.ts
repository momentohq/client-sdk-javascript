import {webhook} from '@gomomento/generated-types';
import grpcWebhook = webhook.webhook;
import {
  CredentialProvider,
  MomentoLogger,
  Webhook,
  WebhookId,
  DeleteWebhook,
  PutWebhook,
  ListWebhooks,
  PostUrlWebhookDestination,
  GetWebhookSecret,
  RotateWebhookSecret,
} from '@gomomento/sdk-core';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {IWebhookClient} from '@gomomento/sdk-core/dist/src/internal/clients/pubsub/IWebhookClient';
import {Header, HeaderInterceptor} from './grpc/headers-interceptor';
import {version} from '../../package.json';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  validateCacheName,
  validateTopicName,
  validateWebhookName,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {RetryInterceptor} from './grpc/retry-interceptor';
import {TopicClientAllProps} from './topic-client-all-props';
import {secondsToMilliseconds} from '@gomomento/sdk-core/dist/src/utils';

export class WebhookClient implements IWebhookClient {
  private readonly webhookClient: grpcWebhook.WebhookClient;
  protected readonly credentialProvider: CredentialProvider;
  private readonly logger: MomentoLogger;
  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;
  private static readonly DEFAULT_REQUEST_TIMEOUT_MS: number =
    secondsToMilliseconds(5);
  private readonly unaryInterceptors: Interceptor[];

  /**
   * @param {TopicClientProps} props
   */
  constructor(props: TopicClientAllProps) {
    this.credentialProvider = props.credentialProvider;
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.cacheServiceErrorMapper = new CacheServiceErrorMapper(
      props.configuration.getThrowOnErrors()
    );
    const headers = [
      new Header('Authorization', props.credentialProvider.getAuthToken()),
      new Header('agent', `nodejs:webhook:${version}`),
      new Header('runtime-version', `nodejs:${process.versions.node}`),
    ];
    this.unaryInterceptors = [
      HeaderInterceptor.createHeadersInterceptor(headers),
      RetryInterceptor.createRetryInterceptor({
        clientName: 'WebhookClient',
        loggerFactory: props.configuration.getLoggerFactory(),
        overallRequestTimeoutMs: WebhookClient.DEFAULT_REQUEST_TIMEOUT_MS,
      }),
    ];
    this.webhookClient = new webhook.webhook.WebhookClient(
      props.credentialProvider.getControlEndpoint(),
      props.credentialProvider.isEndpointSecure()
        ? ChannelCredentials.createSsl()
        : ChannelCredentials.createInsecure()
    );
  }

  async deleteWebhook(id: WebhookId): Promise<DeleteWebhook.Response> {
    try {
      validateCacheName(id.cacheName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new DeleteWebhook.Error(err)
      );
    }
    const request = new grpcWebhook._DeleteWebhookRequest({
      webhook_id: new grpcWebhook._WebhookId({
        cache_name: id.cacheName,
        webhook_name: id.webhookName,
      }),
    });
    this.logger.debug('issuing "DeleteWebhook" request');

    return await new Promise<DeleteWebhook.Response>((resolve, reject) => {
      this.webhookClient.DeleteWebhook(
        request,
        {interceptors: this.unaryInterceptors},
        (err, _resp) => {
          if (err) {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new DeleteWebhook.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          } else {
            resolve(new DeleteWebhook.Success());
          }
        }
      );
    });
  }

  async listWebhooks(cache: string): Promise<ListWebhooks.Response> {
    try {
      validateCacheName(cache);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new ListWebhooks.Error(err)
      );
    }
    const request = new grpcWebhook._ListWebhookRequest({cache_name: cache});
    this.logger.debug('issuing "ListWebhooks" request');

    return await new Promise<ListWebhooks.Response>((resolve, reject) => {
      this.webhookClient.ListWebhooks(
        request,
        {interceptors: this.unaryInterceptors},
        (err, resp) => {
          if (err || !resp) {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new ListWebhooks.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          } else {
            const webhooks = resp.webhook.map(wh => {
              const webhook: Webhook = {
                id: {
                  cacheName: wh.webhook_id.cache_name,
                  webhookName: wh.webhook_id.webhook_name,
                },
                topicName: wh.topic_name,
                destination: new PostUrlWebhookDestination(
                  wh.destination.post_url
                ),
              };
              return webhook;
            });
            resolve(new ListWebhooks.Success(webhooks));
          }
        }
      );
    });
  }

  async putWebhook(webhook: Webhook): Promise<PutWebhook.Response> {
    try {
      validateCacheName(webhook.id.cacheName);
      validateTopicName(webhook.topicName);
      validateWebhookName(webhook.id.webhookName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new PutWebhook.Error(err)
      );
    }

    const request = new grpcWebhook._PutWebhookRequest({
      webhook: new grpcWebhook._Webhook({
        webhook_id: new grpcWebhook._WebhookId({
          cache_name: webhook.id.cacheName,
          webhook_name: webhook.id.webhookName,
        }),
        destination: new grpcWebhook._WebhookDestination({
          post_url: webhook.destination.url(),
        }),
        topic_name: webhook.topicName,
      }),
    });
    this.logger.debug('issuing "PutWebhook" request');

    return await new Promise<PutWebhook.Response>((resolve, reject) => {
      this.webhookClient.PutWebhook(
        request,
        {interceptors: this.unaryInterceptors},
        (err, resp) => {
          if (err || !resp) {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new PutWebhook.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          } else {
            resolve(new PutWebhook.Success(resp.secret_string));
          }
        }
      );
    });
  }

  async getWebhookSecret(id: WebhookId): Promise<GetWebhookSecret.Response> {
    try {
      validateCacheName(id.cacheName);
      validateWebhookName(id.webhookName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new GetWebhookSecret.Error(err)
      );
    }

    const request = new grpcWebhook._GetWebhookSecretRequest({
      webhook_name: id.webhookName,
      cache_name: id.cacheName,
    });
    this.logger.debug('issuing "GetWebhookSecret" request');

    return await new Promise<GetWebhookSecret.Response>((resolve, reject) => {
      this.webhookClient.GetWebhookSecret(
        request,
        {interceptors: this.unaryInterceptors},
        (err, resp) => {
          if (err || !resp) {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new GetWebhookSecret.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          } else {
            resolve(
              new GetWebhookSecret.Success({
                secret: resp.secret_string,
                webhookName: resp.webhook_name,
                cacheName: resp.cache_name,
              })
            );
          }
        }
      );
    });
  }

  async rotateWebhookSecret(
    id: WebhookId
  ): Promise<RotateWebhookSecret.Response> {
    try {
      validateCacheName(id.cacheName);
      validateWebhookName(id.webhookName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new RotateWebhookSecret.Error(err)
      );
    }

    const webhookId = grpcWebhook._WebhookId.fromObject({
      webhook_name: id.webhookName,
      cache_name: id.cacheName,
    });
    const request = new grpcWebhook._RotateWebhookSecretRequest({
      webhook_id: webhookId,
    });
    this.logger.debug('issuing "RotateWebhookSecret" request');

    return await new Promise<RotateWebhookSecret.Response>(
      (resolve, reject) => {
        this.webhookClient.RotateWebhookSecret(
          request,
          {interceptors: this.unaryInterceptors},
          (err, resp) => {
            if (err || !resp) {
              this.cacheServiceErrorMapper.resolveOrRejectError({
                err: err,
                errorResponseFactoryFn: e => new RotateWebhookSecret.Error(e),
                resolveFn: resolve,
                rejectFn: reject,
              });
            } else {
              resolve(
                new RotateWebhookSecret.Success({
                  secret: resp.secret_string,
                  webhookName: id.webhookName,
                  cacheName: id.cacheName,
                })
              );
            }
          }
        );
      }
    );
  }
}
