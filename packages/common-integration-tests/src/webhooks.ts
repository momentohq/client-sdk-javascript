import {PostUrlWebhookDestination, ListWebhooks} from '@gomomento/sdk-core';
import {
  ItBehavesLikeItValidatesCacheName,
  ItBehavesLikeItValidatesTopicName,
  testWebhook,
  ValidateCacheProps,
  ValidateTopicProps,
  WithWebhook,
} from './common-int-test-utils';
import {
  ICacheClient,
  ITopicClient,
} from '@gomomento/sdk-core/dist/src/internal/clients';

export function runWebhookTests(
  topicClient: ITopicClient,
  cacheClient: ICacheClient,
  integrationTestCacheName: string
) {
  describe('#putWebhook', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return topicClient.putWebhook({
        id: {
          cacheName: props.cacheName,
          webhookName: 'ItBehavesLikeItValidatesCacheName',
        },
        topicName: 'a topic',
        destination: new PostUrlWebhookDestination('someurl.com'),
      });
    });

    ItBehavesLikeItValidatesTopicName((props: ValidateTopicProps) => {
      return topicClient.putWebhook({
        id: {
          cacheName: 'a cache',
          webhookName: 'ItBehavesLikeItValidatesCacheName',
        },
        topicName: props.topicName,
        destination: new PostUrlWebhookDestination('someurl.com'),
      });
    });
  });

  describe('#listWebhooks', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return topicClient.listWebhooks(props.cacheName);
    });
  });

  describe('#deleteWebhook', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return topicClient.deleteWebhook({
        webhookName: 'some webhook',
        cacheName: props.cacheName,
      });
    });
  });

  describe('put list and delete', () => {
    it('should create a new webhook, list it, and then delete it', async () => {
      const webhook = testWebhook(integrationTestCacheName);
      await WithWebhook(topicClient, webhook, async () => {
        const resp = await topicClient.listWebhooks(webhook.id.cacheName);
        if (resp instanceof ListWebhooks.Success) {
          const webhookWeAreLookingFor = resp
            .getWebhookItems()
            .find(
              wi =>
                wi.webhook.id.webhookName === webhook.id.webhookName &&
                wi.webhook.id.cacheName === webhook.id.cacheName
            );
          expect(webhookWeAreLookingFor).toBeTruthy();
          expect(webhookWeAreLookingFor?.secret).toBeTruthy();
        } else {
          throw new Error(
            `list webhooks request failed: ${(
              resp as ListWebhooks.Error
            ).message()}`
          );
        }
      });
    });
  });
}
