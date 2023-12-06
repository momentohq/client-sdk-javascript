import {WebhookUtils} from '../../../src/index';

describe('webhookutils', () => {
  it('should validate correct request sent from momento', () => {
    const signingSecret = '1234567890';
    const requestBody =
      '{"text":"some text", "another_field": "another field" }';
    const signature =
      'b43f72787eb66410ff110295b036ef828e5686af21b414ce092f02c05deea3da';
    const res = WebhookUtils.validateWebhookRequest({
      body: requestBody,
      signature,
      signingSecret,
    });
    expect(res).toEqual(WebhookUtils.RequestValidation.VALID);
  });

  it('should invalidate bad request sent from momento', () => {
    const signingSecret = '1234567890';
    const requestBody =
      '{"text":"some text", "another_field": "another field" }';
    const signature = 'this signature is incorrect';
    const res = WebhookUtils.validateWebhookRequest({
      body: requestBody,
      signature,
      signingSecret,
    });
    expect(res).toEqual(WebhookUtils.RequestValidation.INVALID);
  });
});
