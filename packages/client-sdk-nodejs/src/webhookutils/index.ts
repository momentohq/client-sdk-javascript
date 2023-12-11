import * as crypto from 'crypto';

type Props = {
  /**
   * The signing secret associated with the webhook
   */
  signingSecret: string;
  /**
   * The 'momento-signature' header passed with the request
   */
  signature: string;
  /**
   * The stringified body of the request
   */
  body: string;
};

export enum RequestValidation {
  VALID = 'valid',
  INVALID = 'invalid',
}

/**
 * This function is a helper function that can be used to validate that webhook
 * requests are coming from Momento. It is best practice to validate incoming
 * request to a public webhook endpoint
 * @param props {Props}
 */
export const validateWebhookRequest = (props: Props): RequestValidation => {
  const hash = crypto.createHmac('SHA3-256', props.signingSecret);
  const hashed = hash.update(props.body).digest('hex');
  console.log('expected', props.signature);
  console.log('actual', hashed);
  if (hashed === props.signature) {
    return RequestValidation.VALID;
  }
  return RequestValidation.INVALID;
};
