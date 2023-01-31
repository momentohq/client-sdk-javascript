import {SigningKey} from '../signing-key';
import {control} from '@gomomento/generated-types';
import {SdkError} from '../../errors/errors';
import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';

export abstract class Response extends ResponseBase {}

class _Success extends Response {
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
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}
export class Error extends ResponseError(_Error) {}
