import {
  PostUrlWebhookDestination,
  ListWebhooksResponse,
  GetWebhookSecretResponse,
  TopicPublishResponse,
  RotateWebhookSecretResponse,
} from '@gomomento/sdk-core';
import {
  getWebhookRequestDetails,
  ItBehavesLikeItValidatesCacheName,
  ItBehavesLikeItValidatesTopicName,
  testWebhook,
  ValidateCacheProps,
  ValidateTopicProps,
  WithWebhook,
  itOnlyInCi,
} from '../common-int-test-utils';
import {
  ICacheClient,
  ITopicClient,
} from '@gomomento/sdk-core/dist/src/internal/clients';
import {delay} from '../auth/auth-client';
import {log} from 'console';

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

  describe('put list delete getWebhookSecret rotateWebhookSecret', () => {
    it('should create a new webhook, list it, and then delete it', async () => {
      const webhook = testWebhook(integrationTestCacheName);
      await WithWebhook(topicClient, webhook, async () => {
        const resp = await topicClient.listWebhooks(integrationTestCacheName);
        switch (resp.type) {
          case ListWebhooksResponse.Success: {
            const webhookWeAreLookingFor = resp
              .getWebhooks()
              .find(
                wh =>
                  wh.id.webhookName === webhook.id.webhookName &&
                  wh.id.cacheName === webhook.id.cacheName
              );
            expect(webhookWeAreLookingFor).toBeTruthy();
            break;
          }
          case ListWebhooksResponse.Error:
            throw new Error(`list webhooks request failed: ${resp.message()}`);
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
        switch (resp.type) {
          case GetWebhookSecretResponse.Success:
            expect(resp.secret()).toBeTruthy();
            expect(resp.webhookName()).toEqual(webhook.id.webhookName);
            expect(resp.cacheName()).toEqual(webhook.id.cacheName);
            break;
          case GetWebhookSecretResponse.Error:
            throw new Error(
              `getWebhookSecret request failed: ${resp.message()}`
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
        if (publishResp.type === TopicPublishResponse.Error) {
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
        const details = await getWebhookRequestDetails(
          webhook.destination.url()
        );
        log('webhook request details:', details);
        expect(details.invocationCount).toBe(1);
      });
    });
    itOnlyInCi('should rotate a webhook secret', async () => {
      const webhook = testWebhook(integrationTestCacheName);
      await WithWebhook(topicClient, webhook, async () => {
        const getSecretResp = await topicClient.getWebhookSecret(
          webhook.id.cacheName,
          webhook.id.webhookName
        );
        if (!(getSecretResp.type === GetWebhookSecretResponse.Success)) {
          throw new Error(
            `unknown error occurred when making a 'getWebhookSecret' request: ${getSecretResp.toString()}`
          );
        }
        expect(getSecretResp.secret()).toBeTruthy();
        const rotateResp = await topicClient.rotateWebhookSecret(
          webhook.id.cacheName,
          webhook.id.webhookName
        );
        if (!(rotateResp.type === RotateWebhookSecretResponse.Success)) {
          throw new Error(
            `unknown error occurred when making a 'rotateWebhookSecret' request: ${rotateResp.toString()}`
          );
        }
        expect(rotateResp.secret()).toBeTruthy();
        expect(rotateResp.webhookName()).toEqual(getSecretResp.webhookName());
        expect(rotateResp.cacheName()).toEqual(getSecretResp.cacheName());

        // make sure the secrets are in fact different
        expect(rotateResp.secret() === getSecretResp.secret()).toBeFalsy();
      });
    });
  });
}
