import {control} from '@gomomento/generated-types';
import {SigningKey} from './SigningKey';

export class ListSigningKeysResponse {
  private readonly nextToken: string | null;
  private readonly signingKeys: SigningKey[];

  constructor(
    endpoint: string,
    result?: control.control_client._ListSigningKeysResponse
  ) {
    this.nextToken = result?.next_token || null;
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
