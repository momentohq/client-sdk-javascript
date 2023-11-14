import {
  PostUrlWebhookDestination,
  ListWebhooks,
  GetWebhookSecret,
} from '@gomomento/sdk-core';
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
      return topicClient.putWebhook(
        props.cacheName,
        'ItBehavesLikeItValidatesCacheName',
        {
          topicName: 'a topic',
          destination: new PostUrlWebhookDestination('someurl.com'),
        }
      );
    });

    ItBehavesLikeItValidatesTopicName((props: ValidateTopicProps) => {
      return topicClient.putWebhook(
        'a cache',
        'ItBehavesLikeItValidatesCacheName',
        {
          topicName: props.topicName,
          destination: new PostUrlWebhookDestination('someurl.com'),
        }
      );
    });
  });

  describe('#listWebhooks', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return topicClient.listWebhooks(props.cacheName);
    });
  });

  describe('#deleteWebhook', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return topicClient.deleteWebhook(props.cacheName, 'some webhook');
    });
  });

  describe('#getWebhookSecret', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return topicClient.getWebhookSecret(props.cacheName, 'some webhook');
    });
  });

  describe('put list delete getWebhookSecret', () => {
    it('should create a new webhook, list it, and then delete it', async () => {
      const webhook = testWebhook(integrationTestCacheName);
      await WithWebhook(topicClient, webhook, async () => {
        const resp = await topicClient.listWebhooks(integrationTestCacheName);
        if (resp instanceof ListWebhooks.Success) {
          const webhookWeAreLookingFor = resp
            .getWebhooks()
            .find(
              wh =>
                wh.id.webhookName === webhook.id.webhookName &&
                wh.id.cacheName === webhook.id.cacheName
            );
          expect(webhookWeAreLookingFor).toBeTruthy();
        } else {
          throw new Error(
            `list webhooks request failed: ${(
              resp as ListWebhooks.Error
            ).message()}`
          );
        }
      });
    });
    it('should create a new webhook, get its secret, and then delete it', async () => {
      const webhook = testWebhook(integrationTestCacheName);
      await WithWebhook(topicClient, webhook, async () => {
        const resp = await topicClient.getWebhookSecret(
          webhook.id.cacheName,
          webhook.id.webhookName
        );
        if (resp instanceof GetWebhookSecret.Success) {
          expect(resp.secret()).toBeTruthy();
          expect(resp.webhookName()).toEqual(webhook.id.webhookName);
          expect(resp.cacheName()).toEqual(webhook.id.cacheName);
        } else {
          throw new Error(
            `getWebhookSecret request failed: ${(
              resp as GetWebhookSecret.Error
            ).message()}`
          );
        }
      });
    });
  });
}
