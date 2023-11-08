import {webhook} from '@gomomento/generated-types';
import grpcWebhook = webhook.webhook;
import {TopicClientProps} from '../topic-client-props';
import {
  CredentialProvider,
  MomentoLogger,
  Webhook,
  WebhookId,
  DeleteWebhook,
  PutWebhook,
  ListWebhooks,
  PostUrlWebhookDestination,
  WebhookItem,
} from '../../../core';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {IWebhookClient} from '../../../core/src/internal/clients/pubsub/IWebhookClient';
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {version} from '../../package.json';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  validateCacheName,
  validateTopicName,
  validateWebhookName,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {normalizeSdkError} from '@gomomento/sdk-core/dist/src/errors';

export class WebhookClient implements IWebhookClient {
  private readonly webhookClient: grpcWebhook.WebhookClient;
  protected readonly credentialProvider: CredentialProvider;
  private readonly logger: MomentoLogger;
  private static readonly DEFAULT_REQUEST_TIMEOUT_MS: number = 5 * 1000;
  private readonly unaryInterceptors: Interceptor[];

  /**
   * @param {TopicClientProps} props
   */
  constructor(props: TopicClientProps) {
    this.credentialProvider = props.credentialProvider;
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    const headers = [
      new Header('Authorization', props.credentialProvider.getAuthToken()),
      new Header('Agent', `nodejs:${version}`),
    ];
    this.unaryInterceptors = [
      new HeaderInterceptorProvider(headers).createHeadersInterceptor(),
      ClientTimeoutInterceptor(WebhookClient.DEFAULT_REQUEST_TIMEOUT_MS),
    ];
    this.webhookClient = new webhook.webhook.WebhookClient(
      props.credentialProvider.getControlEndpoint(),
      ChannelCredentials.createSsl()
    );
  }

  async deleteWebhook(id: WebhookId): Promise<DeleteWebhook.Response> {
    try {
      validateCacheName(id.cacheName);
    } catch (err) {
      return new DeleteWebhook.Error(normalizeSdkError(err as Error));
    }
    const request = new grpcWebhook._DeleteWebhookRequest({
      webhook_id: new grpcWebhook._WebhookId({
        cache_name: id.cacheName,
        webhook_name: id.webhookName,
      }),
    });
    this.logger.debug('issuing "DeleteWebhook" request');

    return await new Promise<DeleteWebhook.Response>(resolve => {
      this.webhookClient.DeleteWebhook(
        request,
        {interceptors: this.unaryInterceptors},
        (err, _resp) => {
          if (err) {
            resolve(new DeleteWebhook.Error(cacheServiceErrorMapper(err)));
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
      return new ListWebhooks.Error(normalizeSdkError(err as Error));
    }
    const request = new grpcWebhook._ListWebhookRequest({cache_name: cache});
    this.logger.debug('issuing "ListWebhooks" request');

    return await new Promise<ListWebhooks.Response>(resolve => {
      this.webhookClient.ListWebhooks(
        request,
        {interceptors: this.unaryInterceptors},
        (err, resp) => {
          if (err || !resp) {
            resolve(new ListWebhooks.Error(cacheServiceErrorMapper(err)));
          } else {
            const webhookItems = resp.webhook_item.map(item => {
              const webhook: Webhook = {
                id: {
                  cacheName: item.webhook.webhook_id.cache_name,
                  webhookName: item.webhook.webhook_id.webhook_name,
                },
                topicName: item.webhook.topic_name,
                destination: new PostUrlWebhookDestination(
                  item.webhook.destination.post_url
                ),
              };
              const webhookItem: WebhookItem = {
                webhook,
                secret: item.secret,
              };
              return webhookItem;
            });
            resolve(new ListWebhooks.Success(webhookItems));
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
      return new PutWebhook.Error(normalizeSdkError(err as Error));
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

    return await new Promise<PutWebhook.Response>(resolve => {
      this.webhookClient.PutWebhook(
        request,
        {interceptors: this.unaryInterceptors},
        (err, resp) => {
          if (err || !resp) {
            resolve(new PutWebhook.Error(cacheServiceErrorMapper(err)));
          } else {
            resolve(new PutWebhook.Success(resp.secret_string));
          }
        }
      );
    });
  }
}
