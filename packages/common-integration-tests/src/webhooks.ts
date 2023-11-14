import {
  PostUrlWebhookDestination,
  ListWebhooks,
  GetWebhookSecret,
  TopicPublish,
} from '@gomomento/sdk-core';
import {
  getWebhookRequestDetails,
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
import {delay} from './auth-client';

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
        } else if (resp instanceof ListWebhooks.Error) {
          throw new Error(`list webhooks request failed: ${resp.message()}`);
        } else {
          throw new Error(
            `unknown error occured when making a 'listWebhooks' request: ${resp.toString()}`
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
        } else if (resp instanceof GetWebhookSecret.Error) {
          throw new Error(`getWebhookSecret request failed: ${resp.message()}`);
        } else {
          throw new Error(
            `unknown error occured when making a 'getWebhookSecret' request: ${resp.toString()}`
          );
        }
      });
    });
    it('should create a new webhook, publish a message to a topic, and verify that the webhook was called', async () => {
      const webhook = testWebhook(integrationTestCacheName);
      await WithWebhook(topicClient, webhook, async () => {
        const publishResp = await topicClient.publish(
          webhook.id.cacheName,
          webhook.topicName,
          'a message'
        );
        if (publishResp instanceof TopicPublish.Error) {
          throw new Error(
            `failed to publish to topic: ${webhook.topicName} in cache: ${
              webhook.id.cacheName
            } webhook: ${
              webhook.id.webhookName
            } error: ${publishResp.toString()}`
          );
        }
        // wait 5 seconds for webhook to get called. Can increase this if needed
        await delay(5 * 1000);
        const detes = await getWebhookRequestDetails(webhook.destination.url());
        expect(detes.invocationCount).toBe(1);
      });
    });
  });
}
