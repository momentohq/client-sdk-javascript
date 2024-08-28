import * as webhook from '@gomomento/generated-types-webtext/dist/WebhookServiceClientPb';
import {
  CredentialProvider,
  MomentoLogger,
  Webhook,
  WebhookId,
  DeleteWebhook,
  PutWebhook,
  ListWebhooks,
  PostUrlWebhookDestination,
  WebhookDestinationType,
  GetWebhookSecret,
  RotateWebhookSecret,
} from '@gomomento/sdk-core';
import {IWebhookClient} from '@gomomento/sdk-core/dist/src/internal/clients/pubsub/IWebhookClient';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  validateCacheName,
  validateTopicName,
  validateWebhookName,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {getWebControlEndpoint} from '../utils/web-client-utils';
import {ClientMetadataProvider} from './client-metadata-provider';
import {TopicConfiguration} from '../config/topic-configuration';
import {
  _DeleteWebhookRequest,
  _ListWebhookRequest,
  _GetWebhookSecretRequest,
  _PutWebhookRequest,
  _Webhook,
  _WebhookDestination,
  _WebhookId,
  _RotateWebhookSecretRequest,
} from '@gomomento/generated-types-webtext/dist/webhook_pb';
import {TopicClientAllProps} from './topic-client-all-props';

export class WebhookClient implements IWebhookClient {
  private readonly webhookClient: webhook.WebhookClient;
  protected readonly credentialProvider: CredentialProvider;
  private readonly configuration: TopicConfiguration;
  private readonly logger: MomentoLogger;
  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;
  private readonly clientMetadataProvider: ClientMetadataProvider;

  /**
   * @param {TopicClientProps} props
   */
  constructor(props: TopicClientAllProps) {
    this.configuration = props.configuration;
    this.credentialProvider = props.credentialProvider;
    this.logger = this.configuration.getLoggerFactory().getLogger(this);
    this.cacheServiceErrorMapper = new CacheServiceErrorMapper(
      props.configuration.getThrowOnErrors()
    );

    this.logger.debug(
      `Creating webhook client using endpoint: '${getWebControlEndpoint(
        this.credentialProvider
      )}'`
    );

    this.webhookClient = new webhook.WebhookClient(
      // Note: all web SDK requests are routed to a `web.` subdomain to allow us flexibility on the server
      getWebControlEndpoint(props.credentialProvider),
      null,
      {}
    );
    this.clientMetadataProvider = new ClientMetadataProvider({
      authToken: props.credentialProvider.getAuthToken(),
      clientType: 'webhook',
    });
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

    const request = new _DeleteWebhookRequest();
    const webhookId = new _WebhookId();
    webhookId.setWebhookName(id.webhookName);
    webhookId.setCacheName(id.cacheName);
    request.setWebhookId(webhookId);
    request.setWebhookId(webhookId);
    this.logger.debug('issuing "DeleteWebhook" request');

    return await new Promise<DeleteWebhook.Response>((resolve, reject) => {
      this.webhookClient.deleteWebhook(
        request,
        this.clientMetadataProvider.createClientMetadata(),
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
    const request = new _ListWebhookRequest();
    request.setCacheName(cache);
    this.logger.debug('issuing "ListWebhooks" request');

    return await new Promise<ListWebhooks.Response>((resolve, reject) => {
      this.webhookClient.listWebhooks(
        request,
        this.clientMetadataProvider.createClientMetadata(),
        (err, resp) => {
          if (err || !resp) {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new ListWebhooks.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          } else {
            const webhooks = resp.getWebhookList().map(wh => {
              const webhook: Webhook = {
                id: {
                  cacheName: wh.getWebhookId()?.getCacheName() ?? '',
                  webhookName: wh.getWebhookId()?.getWebhookName() ?? '',
                },
                topicName: wh.getTopicName() ?? '',
                destination: new PostUrlWebhookDestination(
                  wh.getDestination()?.getPostUrl() ?? ''
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

    const request = new _PutWebhookRequest();
    const _webhook = new _Webhook();
    const webhookId = new _WebhookId();
    webhookId.setWebhookName(webhook.id.webhookName);
    webhookId.setCacheName(webhook.id.cacheName);
    _webhook.setWebhookId(webhookId);
    _webhook.setTopicName(webhook.topicName);
    const destination = new _WebhookDestination();
    switch (webhook.destination.getType()) {
      case WebhookDestinationType.PostUrl:
        destination.setPostUrl(webhook.destination.url());
        break;
    }
    _webhook.setDestination(destination);
    request.setWebhook(_webhook);
    this.logger.debug('issuing "PutWebhook" request');

    return await new Promise<PutWebhook.Response>((resolve, reject) => {
      this.webhookClient.putWebhook(
        request,
        this.clientMetadataProvider.createClientMetadata(),
        (err, resp) => {
          if (err || !resp) {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new PutWebhook.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          } else {
            resolve(new PutWebhook.Success(resp.getSecretString()));
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

    const request = new _GetWebhookSecretRequest();
    request.setCacheName(id.cacheName);
    request.setWebhookName(id.webhookName);
    this.logger.debug('issuing "GetWebhookSecret" request');

    return await new Promise<GetWebhookSecret.Response>((resolve, reject) => {
      this.webhookClient.getWebhookSecret(
        request,
        this.clientMetadataProvider.createClientMetadata(),
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
                secret: resp.getSecretString(),
                webhookName: resp.getWebhookName(),
                cacheName: resp.getCacheName(),
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

    const request = new _RotateWebhookSecretRequest();
    const webhookId = new _WebhookId();
    webhookId.setWebhookName(id.webhookName);
    webhookId.setCacheName(id.cacheName);
    request.setWebhookId(webhookId);
    this.logger.debug('issuing "RotateWebhookSecret" request');

    return await new Promise<RotateWebhookSecret.Response>(
      (resolve, reject) => {
        this.webhookClient.rotateWebhookSecret(
          request,
          this.clientMetadataProvider.createClientMetadata(),
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
                  secret: resp.getSecretString(),
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
