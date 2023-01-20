import {SigningKey} from '../signing-key';
import {control} from '@gomomento/generated-types';
import * as ResponseBase from './response-base';

export {Response, Error} from './response-base';

export class Success extends ResponseBase.Success {
  private readonly nextToken?: string;
  private readonly signingKeys: SigningKey[];

  constructor(
    endpoint: string,
    result?: control.control_client._ListSigningKeysResponse
  ) {
    super();
    this.nextToken = result?.next_token;
    this.signingKeys =
      result?.signing_key.map(
        signingKey =>
          new SigningKey(
            signingKey.key_id,
            new Date(signingKey.expires_at * 1000),
            endpoint
          )
      ) ?? [];
  }

  public getNextToken() {
    return this.nextToken;
  }

  public getSigningKeys() {
    return this.signingKeys;
  }
}
